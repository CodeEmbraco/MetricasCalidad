import { useMemo, useState, useEffect } from "react"
import { Save, CalendarDays, RefreshCw } from "lucide-react"
import { getDayName, todayISO } from "../../utils/dates.js"
import {
  horasDecimal,
  calcRate,
  calcPiezasHora,
  calcTotalMuestras,
  calcPorcentajeFrecuencia,
  semaforoFrecuencia,
  round,
} from "../../utils/metrics.js"
import { addFrecuencia, buildFrecuenciaRecord } from "../../data/store.js"

const EMPTY = {
  familia: "",
  componente: "",
  caracteristica: "",
  maquina: "",
  fecha: todayISO(),
  volumen: "",
  horas: "",
  minutos: "",
  tamanoMuestra: "",
  frecuencia: "",
  medicionesInfinity: 0,
}

export default function CapturaForm() {
  const [form, setForm] = useState(EMPTY)
  const [saved, setSaved] = useState(false)

  // ESTADOS DINÁMICOS DESDE LA API
  const [apiData, setApiData] = useState(null)
  const [loadingApi, setLoadingApi] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // 1. Ejecutar Stored Procedure vía API al cambiar la fecha
  useEffect(() => {
    if (!form.fecha) return

    setLoadingApi(true)
    setApiError(null)

    fetch(`http://localhost:3001/api/procedure?fecha=${form.fecha}`)
      .then((res) => {
        if (!res.ok) throw new Error("Error al consultar mediciones de la base de datos")
        return res.json()
      })
      .then((data) => {
        setApiData(data)
        setLoadingApi(false)
      })
      .catch((err) => {
        console.error("Error API:", err)
        setApiError("No se pudieron cargar los datos de Infinity SQL")
        setLoadingApi(false)
      })
  }, [form.fecha])

  // 2. Extraer Familias disponibles dinámicamente desde SQL
  const familiasOptions = useMemo(() => {
    if (!apiData || !apiData.familias) return []
    return Object.keys(apiData.familias)
  }, [apiData])

  // Registros de la familia seleccionada
  const registrosFamilia = useMemo(() => {
    if (!apiData || !form.familia || !apiData.familias[form.familia]) return []
    return apiData.familias[form.familia]
  }, [apiData, form.familia])

  // 3. Extraer Componentes únicos de la Familia seleccionada
  const componentesOptions = useMemo(() => {
    if (!form.familia) return []
    const componentes = registrosFamilia.map((r) => r.Producto_SKU_PART_DAT)
    return [...new Set(componentes)]
  }, [registrosFamilia, form.familia])

  // Registros filtrados por Familia y Componente
  const registrosComponente = useMemo(() => {
    if (!form.componente) return []
    return registrosFamilia.filter((r) => r.Producto_SKU_PART_DAT === form.componente)
  }, [registrosFamilia, form.componente])

  // 4. Extraer Máquinas/Procesos únicos del Componente seleccionado
  const maquinasOptions = useMemo(() => {
    if (!form.componente) return []
    const maquinas = registrosComponente.map((r) => r.Proceso_Maquina_PRCS_DAT)
    return [...new Set(maquinas)]
  }, [registrosComponente, form.componente])

  // 5. Extraer Características filtradas por Máquina seleccionada
  const caracteristicasOptions = useMemo(() => {
    if (!form.maquina) return []
    return registrosComponente
      .filter((r) => r.Proceso_Maquina_PRCS_DAT === form.maquina)
      .map((r) => ({
        nombre: r.Caracteristica_Medida_TEST_DAT,
        totalPiezasMedidas: r.Total_Piezas_Medidas,
      }))
  }, [registrosComponente, form.maquina])

  // Métricas de cálculo
  const horasDec = horasDecimal(form.horas, form.minutos)
  const rate = calcRate(form.volumen, horasDec)
  const piezasHora = calcPiezasHora(form.frecuencia, form.tamanoMuestra)
  const totalMuestras = calcTotalMuestras(horasDec, piezasHora)
  const porcentaje = calcPorcentajeFrecuencia(form.medicionesInfinity, totalMuestras)
  const estado = semaforoFrecuencia(porcentaje)

  function update(field, value) {
    setSaved(false)
    setForm((f) => {
      const next = { ...f, [field]: value }

      // Limpieza en cascada adecuada
      if (field === "fecha") {
        next.familia = ""
        next.componente = ""
        next.maquina = ""
        next.caracteristica = ""
        next.medicionesInfinity = 0
      }
      if (field === "familia") {
        next.componente = ""
        next.maquina = ""
        next.caracteristica = ""
        next.medicionesInfinity = 0
      }
      if (field === "componente") {
        next.maquina = ""
        next.caracteristica = ""
        next.medicionesInfinity = 0
      }
      if (field === "maquina") {
        next.caracteristica = ""
        next.medicionesInfinity = 0
      }
      if (field === "caracteristica") {
        const seleccionada = caracteristicasOptions.find((c) => c.nombre === value)
        next.medicionesInfinity = seleccionada ? seleccionada.totalPiezasMedidas : 0
      }
      return next
    })
  }

  const valid =
    form.familia &&
    form.componente &&
    form.caracteristica &&
    form.maquina &&
    form.fecha &&
    form.volumen &&
    (form.horas || form.minutos) &&
    form.tamanoMuestra &&
    form.frecuencia

  async function handleSubmit(e) {
    e.preventDefault()
    if (!valid || submitting) return

    setSubmitting(true)

    // Armamos el objeto con métricas listas para la base de datos
    const payload = {
      ...form,
      totalMuestras,
      porcentaje,
      estado,
    }

    try {
      const response = await fetch("http://localhost:3001/api/frecuencias/guardarRegistro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Error al guardar en el servidor")

      // Guardado local opcional de respaldo
      addFrecuencia(buildFrecuenciaRecord(form))

      setForm({
        ...EMPTY,
        fecha: form.fecha,
        familia: form.familia,
        componente: form.componente,
        maquina: form.maquina,
      })
      setSaved(true)
    } catch (err) {
      console.error(err)
      alert("Hubo un error al guardar el registro en la base de datos.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="card-header">
        <div>
          <h2>Formulario de Registro</h2>
          <div className="card-sub">Captura de datos de frecuencia respaldados por InfinityQS</div>
        </div>
      </div>

      <div className="card-body">
        <div className="form-grid">
          {/* 1. Fecha */}
          <div className="field">
            <label>
              <CalendarDays size={13} /> Fecha <span className="req">*</span>
            </label>
            <input type="date" value={form.fecha} onChange={(e) => update("fecha", e.target.value)} />
            {form.fecha && <span className="hint">Día: {getDayName(form.fecha)}</span>}
          </div>

          {/* 2. Familia */}
          <div className="field">
            <label>
              Familia <span className="req">*</span> {loadingApi && <RefreshCw size={12} className="spin" />}
            </label>
            <select
              value={form.familia}
              onChange={(e) => update("familia", e.target.value)}
              disabled={loadingApi || familiasOptions.length === 0}
            >
              <option value="">
                {loadingApi ? "Cargando desde BD..." : "Seleccionar familia..."}
              </option>
              {familiasOptions.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            {apiError && <span className="hint style-error">{apiError}</span>}
          </div>

          {/* 3. Componente */}
          <div className="field">
            <label>
              Componente <span className="req">*</span>
            </label>
            <select
              value={form.componente}
              onChange={(e) => update("componente", e.target.value)}
              disabled={!form.familia || componentesOptions.length === 0}
            >
              <option value="">Seleccionar componente...</option>
              {componentesOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Máquina / Proceso */}
          <div className="field">
            <label>
              Máquina / Proceso <span className="req">*</span>
            </label>
            <select
              value={form.maquina}
              onChange={(e) => update("maquina", e.target.value)}
              disabled={!form.componente || maquinasOptions.length === 0}
            >
              <option value="">Seleccionar máquina...</option>
              {maquinasOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Característica */}
          <div className="field">
            <label>
              Característica <span className="req">*</span>
            </label>
            <select
              value={form.caracteristica}
              onChange={(e) => update("caracteristica", e.target.value)}
              disabled={!form.maquina || caracteristicasOptions.length === 0}
            >
              <option value="">Seleccionar característica...</option>
              {caracteristicasOptions.map((c) => (
                <option key={c.nombre} value={c.nombre}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Volumen */}
          <div className="field">
            <label>
              Volumen (piezas/día) <span className="req">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={form.volumen}
              onChange={(e) => update("volumen", e.target.value)}
              placeholder="Ej. 1500"
            />
          </div>

          {/* Horas reales */}
          <div className="field">
            <label>
              Horas Reales de Trabajo <span className="req">*</span>
            </label>
            <div className="time-inputs">
              <input
                type="number"
                min="0"
                max="24"
                value={form.horas}
                onChange={(e) => update("horas", e.target.value)}
                placeholder="HH"
              />
              <span>h</span>
              <input
                type="number"
                min="0"
                max="59"
                value={form.minutos}
                onChange={(e) => update("minutos", e.target.value)}
                placeholder="MM"
              />
              <span>m</span>
            </div>
          </div>

          {/* Rate (auto) */}
          <div className="field field-readonly">
            <label>Rate (auto)</label>
            <input value={rate || 0} readOnly tabIndex={-1} />
            <span className="hint">Volumen ÷ Horas reales</span>
          </div>

          {/* Tamaño muestra */}
          <div className="field">
            <label>
              Tamaño de Muestra <span className="req">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={form.tamanoMuestra}
              onChange={(e) => update("tamanoMuestra", e.target.value)}
              placeholder="Piezas por medición"
            />
          </div>

          {/* Frecuencia */}
          <div className="field">
            <label>
              Frecuencia (meta) <span className="req">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={form.frecuencia}
              onChange={(e) => update("frecuencia", e.target.value)}
              placeholder="Ej. 4 piezas/hora"
            />
          </div>

          {/* Piezas/Hora (auto) */}
          <div className="field field-readonly">
            <label>Piezas / Hora (auto)</label>
            <input value={round(piezasHora, 2)} readOnly tabIndex={-1} />
            <span className="hint">Frecuencia ÷ Tamaño de muestra</span>
          </div>

          {/* Total muestras (auto) */}
          <div className="field field-readonly">
            <label>Total de Muestras (auto)</label>
            <input value={totalMuestras} readOnly tabIndex={-1} />
            <span className="hint">Horas reales ÷ Piezas/hora</span>
          </div>

          {/* Mediciones Infinity SQL */}
          <div className="field field-readonly">
            <label>Mediciones en Infinity (Real SQL)</label>
            <input value={form.medicionesInfinity} readOnly tabIndex={-1} />
            <span className="hint">Conteo automático obtenido de la base de datos de Infinity</span>
          </div>
        </div>

        {/* Indicador de Porcentaje */}
        <div className="mt-6">
          <div className={`gauge gauge-${estado}`}>
            <div className="gauge-circle">{round(porcentaje, 0)}%</div>
            <div className="gauge-meta">
              <strong>Porcentaje de Frecuencia de Medición</strong>
              <span>
                {form.medicionesInfinity} mediciones reales de {totalMuestras} muestras esperadas
              </span>
              <span style={{ marginTop: 4, display: "block" }}>
                {estado === "red" && "Rojo · Menor a 70%"}
                {estado === "yellow" && "Amarillo · Entre 70% y 84%"}
                {estado === "green" && "Verde · 85% o superior"}
              </span>
            </div>
          </div>
        </div>

        <div className="row-between mt-6">
          <span className="text-muted" style={{ fontSize: 13 }}>
            {saved ? "Registro guardado correctamente." : "Completa los campos requeridos (*)."}
          </span>
          <button type="submit" className="btn btn-primary" disabled={!valid || submitting}>
            <Save size={16} /> {submitting ? "Guardando..." : "Guardar registro"}
          </button>
        </div>
      </div>
    </form>
  )
}