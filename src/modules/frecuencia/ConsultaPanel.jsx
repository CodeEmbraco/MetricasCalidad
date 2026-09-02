import { useMemo, useState, useEffect } from "react"
import { FileSpreadsheet, Trash2, Filter, RefreshCw } from "lucide-react"
import { semaforoFrecuencia } from "../../utils/metrics.js"
import { getISOWeek, getISOWeekYear, groupKey, getDayName, todayISO } from "../../utils/dates.js"
import Semaforo from "../../components/Semaforo.jsx"
import MultiSelect from "../../components/MultiSelect.jsx"
import { exportTable } from "../../utils/excel.js"

const PERIODOS = [
  { id: "todos", label: "Todo el histórico" },
  { id: "dia", label: "Día específico" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mes" },
  { id: "anio", label: "Año" },
]

// Helper para obtener la semana actual en formato ISO (ej. "2026-W35")
function getSemanaActualISO() {
  const hoy = new Date()
  // Convertimos a string YYYY-MM-DD para evitar el error con parseDate
  const hoyStr = hoy.toISOString().split("T")[0]
  
  const year = getISOWeekYear(hoyStr)
  const week = getISOWeek(hoyStr)
  const weekStr = String(week).padStart(2, "0")
  
  return `${year}-W${weekStr}`
}

// Formatea fechas ISO "YYYY-MM-DD..." a formato legible "DD/MM/YYYY" de forma segura
function formatFechaSQL(fechaStr) {
  if (!fechaStr) return "-"
  const fechaLimpia = String(fechaStr).substring(0, 10)
  const partes = fechaLimpia.split("-")
  if (partes.length !== 3) return "-"
  const [year, month, day] = partes
  return `${day}/${month}/${year}`
}

export default function ConsultaPanel() {
  // ESTADOS DE DATOS REALES DE SQL SERVER
  const [freq, setFreq] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // PERÍODO POR DEFECTO: "semana" con la semana actual en curso
  const [periodo, setPeriodo] = useState("semana")
  const [fecha, setFecha] = useState(getSemanaActualISO())

  // ESTADOS DE FILTROS SELECCIONADOS
  const [familias, setFamilias] = useState([])
  const [componentes, setComponentes] = useState([])
  const [caracteristicas, setCaracteristicas] = useState([])

  // 1. Cargar historial desde la API (GET /api/frecuencias/historial)
  const fetchHistorial = () => {
    setLoading(true)
    setError(null)
    fetch("http://localhost:3001/api/frecuencias/historial")
      .then((res) => {
        if (!res.ok) throw new Error("Error al consultar el historial de la base de datos")
        return res.json()
      })
      .then((data) => {
        setFreq(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error API Historial:", err)
        setError("No se pudieron obtener los datos de SQL Server")
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchHistorial()
  }, [])

  // 2. Extraer Familias únicas disponibles en los datos reales
  const familiasOptions = useMemo(() => {
    const set = new Set(freq.map((r) => r.familia).filter(Boolean))
    return Array.from(set).sort()
  }, [freq])

  // Inicializar filtro de familias cuando cargan los datos por primera vez
  useEffect(() => {
    if (familiasOptions.length > 0 && familias.length === 0) {
      setFamilias(familiasOptions)
    }
  }, [familiasOptions])

  // 3. Extraer Componentes únicos pertenecientes a las familias seleccionadas
  const componentesOptions = useMemo(() => {
    const set = new Set(
      freq
        .filter((r) => familias.length === 0 || familias.includes(r.familia))
        .map((r) => r.componente)
        .filter(Boolean)
    )
    return Array.from(set).sort()
  }, [freq, familias])

  useEffect(() => {
    setComponentes(componentesOptions)
  }, [componentesOptions])

  // 4. Extraer Características únicas filtradas por familias y componentes elegidos
  const caracOptions = useMemo(() => {
    const set = new Set(
      freq
        .filter(
          (r) =>
            (familias.length === 0 || familias.includes(r.familia)) &&
            (componentes.length === 0 || componentes.includes(r.componente))
        )
        .map((r) => r.caracteristica)
        .filter(Boolean)
    )
    return Array.from(set).sort()
  }, [freq, familias, componentes])

  // 5. Filtrado de registros para la tabla
  const filtered = useMemo(() => {
    return freq.filter((r) => {
      if (familias.length > 0 && !familias.includes(r.familia)) return false
      if (componentes.length > 0 && !componentes.includes(r.componente)) return false
      if (caracteristicas.length > 0 && !caracteristicas.includes(r.caracteristica)) return false

      if (periodo !== "todos" && fecha) {
        // Normaliza la fecha de la fila a string YYYY-MM-DD
        const fechaFila = String(r.fecha).substring(0, 10)

        if (periodo === "dia" && fechaFila !== fecha) return false
        if (periodo === "semana") {
          const [y, w] = [getISOWeekYear(fechaFila), getISOWeek(fechaFila)]
          const [selY, selW] = fecha.split("-W").map(Number)
          if (y !== selY || w !== selW) return false
        }
        if (periodo === "mes" && groupKey(fechaFila, "mes") !== fecha) return false
        if (periodo === "anio" && groupKey(fechaFila, "anio") !== fecha) return false
      }
      return true
    })
  }, [freq, familias, componentes, caracteristicas, periodo, fecha])

  // 6. Función para eliminar registros en SQL Server (DELETE /api/frecuencias/:id)
  async function handleDelete(id) {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este registro de la base de datos?")) return

    try {
      const res = await fetch(`http://localhost:3001/api/frecuencias/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("No se pudo eliminar el registro")

      // Actualizar el estado local para quitar la fila inmediatamente
      setFreq((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      console.error(err)
      alert("Hubo un error al eliminar el registro en la base de datos.")
    }
  }

  // 7. Exportación a Excel
  async function handleExport() {
    await exportTable({
      filename: "frecuencia_medicion.xlsx",
      sheetName: "Frecuencia",
      title: "Métricas de Calidad — Frecuencia de Medición",
      columns: [
        { header: "Familia", key: "familia", width: 18 },
        { header: "Componente", key: "componente", width: 14 },
        { header: "Característica", key: "caracteristica", width: 32 },
        { header: "Máquina", key: "maquina", width: 16 },
        { header: "Fecha", width: 12, value: (r) => formatFechaSQL(r.fecha) },
        { header: "Mediciones Infinity", key: "medicionesInfinity", width: 16 },
        { header: "Total Muestras", key: "totalMuestras", width: 14 },
        { header: "% Frecuencia", width: 14, sem: "freq", value: (r) => `${r.porcentaje}%` },
      ],
      rows: filtered,
      getSemEstado: (r) => r.estado || semaforoFrecuencia(r.porcentaje),
    })
  }

  return (
    <div>
      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="row-between" style={{ width: "100%" }}>
            <div className="row" style={{ gap: 8 }}>
              <Filter size={16} />
              <h3>Filtros de Consulta</h3>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={fetchHistorial} title="Actualizar datos">
              <RefreshCw size={14} className={loading ? "spin" : ""} />
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="filter-bar">
            {/* Filtro Período */}
            <div className="field">
              <label>Período</label>
              <select
                value={periodo}
                onChange={(e) => {
                  const nuevoPeriodo = e.target.value
                  setPeriodo(nuevoPeriodo)

                  // Asignación de fecha por defecto según el período
                  if (nuevoPeriodo === "semana") {
                    setFecha(getSemanaActualISO())
                  } else if (nuevoPeriodo === "dia") {
                    setFecha(todayISO())
                  } else {
                    setFecha("")
                  }
                }}
              >
                {PERIODOS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {periodo === "dia" && (
              <div className="field">
                <label>Día</label>
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                {fecha && <span className="hint">{getDayName(fecha)}</span>}
              </div>
            )}
            {periodo === "semana" && (
              <div className="field">
                <label>Semana</label>
                <input type="week" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                {fecha && <span className="hint">Semana {fecha.split("-W")[1]} del año</span>}
              </div>
            )}
            {periodo === "mes" && (
              <div className="field">
                <label>Mes</label>
                <input type="month" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
            )}
            {periodo === "anio" && (
              <div className="field">
                <label>Año</label>
                <input
                  type="number"
                  min="2020"
                  max="2099"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  placeholder="Ej. 2026"
                />
              </div>
            )}

            {/* MultiSelects Dinámicos con datos de SQL */}
            <MultiSelect
              label="Familia"
              options={familiasOptions}
              value={familias}
              onChange={setFamilias}
              placeholder="Todas"
            />
            <MultiSelect
              label="Componente"
              options={componentesOptions}
              value={componentes}
              onChange={setComponentes}
              placeholder="Todos"
            />
            <MultiSelect
              label="Característica"
              options={caracOptions}
              value={caracteristicas}
              onChange={setCaracteristicas}
              placeholder="Todas"
            />
          </div>
        </div>
      </div>

      {/* Contador y Exportación */}
      <div className="row-between mb-4">
        <span className="text-muted" style={{ fontSize: 13 }}>
          {loading ? "Cargando..." : `${filtered.length} registro(s) encontrados`}
        </span>
        <button className="btn btn-excel" onClick={handleExport} disabled={filtered.length === 0}>
          <FileSpreadsheet size={16} /> Exportar a Excel
        </button>
      </div>

      {error && <div className="card p-4 style-error mb-4">{error}</div>}

      {/* Tabla de Registros */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Familia</th>
              <th>Componente</th>
              <th>Característica</th>
              <th>Máquina</th>
              <th>Fecha</th>
              <th>Mediciones Infinity</th>
              <th>Total Muestras</th>
              <th>% Frecuencia</th>
              <th>Semáforo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const estado = r.estado || semaforoFrecuencia(r.porcentaje)
              return (
                <tr key={r.id}>
                  <td>{r.familia}</td>
                  <td>{r.componente}</td>
                  <td>{r.caracteristica}</td>
                  <td style={{ fontWeight: "500" }}>{r.maquina || "-"}</td>
                  <td>{formatFechaSQL(r.fecha)}</td>
                  <td>{r.medicionesInfinity}</td>
                  <td>{r.totalMuestras}</td>
                  <td className={`sem-cell-${estado}`}>{Math.round(r.porcentaje)}%</td>
                  <td>
                    <Semaforo estado={estado} />
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDelete(r.id)}
                      aria-label="Eliminar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              )
            })}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={10}>
                  <div className="empty-state">No hay registros guardados que coincidan con los filtros.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}