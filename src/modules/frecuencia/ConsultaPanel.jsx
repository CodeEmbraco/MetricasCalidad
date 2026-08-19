import { useMemo, useState } from "react"
import { FileSpreadsheet, Trash2, Filter } from "lucide-react"
import { FAMILIAS, COMPONENTES } from "../../data/catalog.js"
import { useStoreData } from "../../hooks/useStoreData.js"
import { deleteFrecuencia } from "../../data/store.js"
import { semaforoFrecuencia } from "../../utils/metrics.js"
import { getISOWeek, getISOWeekYear, groupKey, formatDateDisplay, getDayName } from "../../utils/dates.js"
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

export default function ConsultaPanel() {
  const { freq } = useStoreData()
  const [periodo, setPeriodo] = useState("todos")
  const [fecha, setFecha] = useState("")
  const [familias, setFamilias] = useState([...FAMILIAS])
  const [componentes, setComponentes] = useState([...COMPONENTES])
  const [caracteristicas, setCaracteristicas] = useState([])

  const caracOptions = useMemo(() => {
    const set = new Set(
      freq
        .filter((r) => familias.includes(r.familia) && componentes.includes(r.componente))
        .map((r) => r.caracteristica),
    )
    return Array.from(set).sort()
  }, [freq, familias, componentes])

  const filtered = useMemo(() => {
    return freq.filter((r) => {
      if (!familias.includes(r.familia)) return false
      if (!componentes.includes(r.componente)) return false
      if (caracteristicas.length > 0 && !caracteristicas.includes(r.caracteristica)) return false
      if (periodo !== "todos" && fecha) {
        if (periodo === "dia" && r.fecha !== fecha) return false
        if (periodo === "semana") {
          const [y, w] = [getISOWeekYear(r.fecha), getISOWeek(r.fecha)]
          const sel = fecha
          const [selY, selW] = sel.split("-W").map(Number)
          if (y !== selY || w !== selW) return false
        }
        if (periodo === "mes" && groupKey(r.fecha, "mes") !== fecha) return false
        if (periodo === "anio" && groupKey(r.fecha, "anio") !== fecha) return false
      }
      return true
    })
  }, [freq, familias, componentes, caracteristicas, periodo, fecha])

  async function handleExport() {
    await exportTable({
      filename: "frecuencia_medicion.xlsx",
      sheetName: "Frecuencia",
      title: "Métricas de Calidad — Frecuencia de Medición",
      columns: [
        { header: "Familia", key: "familia", width: 18 },
        { header: "Componente", key: "componente", width: 14 },
        { header: "Característica", key: "caracteristica", width: 32 },
        { header: "Máquina", key: "maquina", width: 16 }, // Columna agregada al reporte Excel
        { header: "Fecha", width: 12, value: (r) => formatDateDisplay(r.fecha) },
        { header: "Mediciones Infinity", key: "medicionesInfinity", width: 16 },
        { header: "Total Muestras", key: "totalMuestras", width: 14 },
        { header: "% Frecuencia", width: 14, sem: "freq", value: (r) => `${r.porcentaje}%` },
        { header: "Rate", key: "rate", width: 10 },
      ],
      rows: filtered,
      getSemEstado: (r) => semaforoFrecuencia(r.porcentaje),
    })
  }

  return (
    <div>
      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="row" style={{ gap: 8 }}>
            <Filter size={16} />
            <h3>Filtros</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="filter-bar">
            <div className="field">
              <label>Período</label>
              <select
                value={periodo}
                onChange={(e) => {
                  setPeriodo(e.target.value)
                  setFecha("")
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

            <MultiSelect label="Familia" options={FAMILIAS} value={familias} onChange={setFamilias} />
            <MultiSelect label="Componente" options={COMPONENTES} value={componentes} onChange={setComponentes} />
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

      {/* Resultados */}
      <div className="row-between mb-4">
        <span className="text-muted" style={{ fontSize: 13 }}>
          {filtered.length} registro(s) encontrados
        </span>
        <button className="btn btn-excel" onClick={handleExport} disabled={filtered.length === 0}>
          <FileSpreadsheet size={16} /> Exportar a Excel
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Familia</th>
              <th>Componente</th>
              <th>Característica</th>
              <th>Máquina</th> {/* Cabecera de Columna agregada */}
              <th>Fecha</th>
              <th>Mediciones Infinity</th>
              <th>Total Muestras</th>
              <th>% Frecuencia</th>
              <th>Rate</th>
              <th>Semáforo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const estado = semaforoFrecuencia(r.porcentaje)
              return (
                <tr key={r.id}>
                  <td>{r.familia}</td>
                  <td>{r.componente}</td>
                  <td>{r.caracteristica}</td>
                  <td style={{ fontWeight: "500" }}>{r.maquina || "-"}</td> {/* Mapeo de celda Máquina */}
                  <td>{formatDateDisplay(r.fecha)}</td>
                  <td>{r.medicionesInfinity}</td>
                  <td>{r.totalMuestras}</td>
                  <td className={`sem-cell-${estado}`}>{r.porcentaje}%</td>
                  <td>{r.rate}</td>
                  <td>
                    <Semaforo estado={estado} />
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => deleteFrecuencia(r.id)}
                      aria-label="Eliminar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11}>
                  <div className="empty-state">No hay registros que coincidan con los filtros.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
