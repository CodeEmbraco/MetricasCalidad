import { useMemo, useState, useCallback } from "react"
import { Save, CalendarDays } from "lucide-react"
import { FAMILIAS, COMPONENTES, MAQUINAS, getCaracteristicas } from "../../data/catalog.js"
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
import { useStoreData } from "../../hooks/useStoreData.js"

const EMPTY = {
  familia: "",
  componente: "",
  caracteristica: "",
  maquina: "", // Inicializado vacío
  fecha: todayISO(),
  volumen: "",
  horas: "",
  minutos: "",
  tamanoMuestra: "",
  frecuencia: "",
  medicionesInfinity: "",
}

export default function CapturaForm() {
  const [form, setForm] = useState(EMPTY)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const { refresh } = useStoreData()

  const caracteristicas = useMemo(
    () => getCaracteristicas(form.familia, form.componente),
    [form.familia, form.componente],
  )

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
      if (field === "familia") {
        next.componente = ""
        next.caracteristica = ""
      }
      if (field === "componente") next.caracteristica = ""
      return next
    })
  }

  // Se añade form.maquina a las condiciones estrictas de guardado
  const valid =
    form.familia &&
    form.componente &&
    form.caracteristica &&
    form.maquina &&
    form.fecha &&
    form.volumen &&
    (form.horas || form.minutos) &&
    form.tamanoMuestra &&
    form.frecuencia &&
    form.medicionesInfinity !== ""

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!valid || saving) return
    setSaving(true)
    setSaveError(null)
    try {
      await addFrecuencia(buildFrecuenciaRecord(form))
      setForm({ ...EMPTY, fecha: form.fecha, familia: form.familia, componente: form.componente, maquina: form.maquina })
      setSaved(true)
      refresh()
    } catch (err) {
      setSaveError(err.message || "Error al guardar. Verifica la conexión con el servidor.")
    } finally {
      setSaving(false)
    }
  }, [valid, saving, form, refresh])

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="card-header">
        <div>
          <h2>Formulario de Registro</h2>
          <div className="card-sub">Captura de datos de frecuencia de medición (almacenamiento local)</div>
        </div>
      </div>
      <div className="card-body">
        <div className="form-grid">
          {/* Familia */}
          <div className="field">
            <label>
              Familia <span className="req">*</span>
            </label>
            <select value={form.familia} onChange={(e) => update("familia", e.target.value)}>
              <option value="">Seleccionar familia...</option>
              {FAMILIAS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Componente */}
          <div className="field">
            <label>
              Componente <span className="req">*</span>
            </label>
            <select
              value={form.componente}
              onChange={(e) => update("componente", e.target.value)}
              disabled={!form.familia}
            >
              <option value="">Seleccionar componente...</option>
              {COMPONENTES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Característica */}
          <div className="field">
            <label>
              Característica <span className="req">*</span>
            </label>
            <select
              value={form.caracteristica}
              onChange={(e) => update("caracteristica", e.target.value)}
              disabled={!form.componente}
            >
              <option value="">Seleccionar característica...</option>
              {caracteristicas.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Máquina — NUEVO CAMPO OBLIGATORIO */}
          <div className="field">
            <label>
              Máquina <span className="req">*</span>
            </label>
            <select value={form.maquina} onChange={(e) => update("maquina", e.target.value)}>
              <option value="">Seleccionar máquina...</option>
              {MAQUINAS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div className="field">
            <label>
              <CalendarDays size={13} /> Fecha <span className="req">*</span>
            </label>
            <input type="date" value={form.fecha} onChange={(e) => update("fecha", e.target.value)} />
            {form.fecha && <span className="hint">Día: {getDayName(form.fecha)}</span>}
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

          {/* Mediciones Infinity */}
          <div className="field">
            <label>
              Mediciones de Infinity <span className="req">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={form.medicionesInfinity}
              onChange={(e) => update("medicionesInfinity", e.target.value)}
              placeholder="Captura manual provisional"
            />
            <span className="hint">Sustituye temporalmente la API de Infinity</span>
          </div>
        </div>

        {/* Indicador de porcentaje */}
        <div className="mt-6">
          <div className={`gauge gauge-${estado}`}>
            <div className="gauge-circle">{round(porcentaje, 0)}%</div>
            <div className="gauge-meta">
              <strong>Porcentaje de Frecuencia de Medición</strong>
              <span>
                {form.medicionesInfinity || 0} mediciones de {totalMuestras} muestras esperadas
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
          <span className="text-muted" style={{ fontSize: 13, color: saveError ? "var(--sem-red)" : undefined }}>
            {saveError
              ? saveError
              : saved
              ? "✓ Registro guardado correctamente."
              : "Completa los campos requeridos (*)."}
          </span>
          <button type="submit" className="btn btn-primary" disabled={!valid || saving}>
            <Save size={16} /> {saving ? "Guardando..." : "Guardar registro"}
          </button>
        </div>
      </div>
    </form>
  )
}