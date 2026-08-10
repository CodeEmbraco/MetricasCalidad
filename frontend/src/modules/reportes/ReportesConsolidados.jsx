import { useMemo, useState } from "react"
import { FileSpreadsheet, Columns3 } from "lucide-react"
import AdvancedFilters, { defaultFilterState, applyFilters } from "../../components/AdvancedFilters.jsx"
import { useStoreData } from "../../hooks/useStoreData.js"
import { semaforoCPK, semaforoFrecuencia, round } from "../../utils/metrics.js"
import { formatDateDisplay, groupKey, groupLabel } from "../../utils/dates.js"
import Semaforo from "../../components/Semaforo.jsx"
import CpkTrendChart from "../../components/charts/CpkTrendChart.jsx"
import { exportReportWithCharts } from "../../utils/excel.js"
import { renderCpkStackedBars, renderFrecuenciaBars } from "../../utils/chartImage.js"

const ALL_COLUMNS = [
  { key: "caracteristica", header: "Característica", always: true },
  { key: "piezasMedidas", header: "Piezas Medidas", group: "base" },
  { key: "cp", header: "CP", group: "cp" },
  { key: "cpk", header: "CPK", group: "cpk", sem: "cpk" },
  { key: "porcentaje", header: "% Frecuencia", group: "freq", sem: "freq" },
  { key: "les", header: "LES", group: "limites" },
  { key: "obj", header: "OBJ", group: "limites" },
  { key: "lei", header: "LEI", group: "limites" },
  { key: "fecha", header: "Fecha", group: "base" },
]

export default function ReportesConsolidados() {
  const { cpk } = useStoreData()
  const [filters, setFilters] = useState(defaultFilterState())
  const [visible, setVisible] = useState(() => ALL_COLUMNS.map((c) => c.key))

  const filtered = useMemo(() => applyFilters(cpk, filters), [cpk, filters])

  const consolidated = useMemo(() => {
    const map = new Map()
    filtered.forEach((r) => {
      if (!map.has(r.caracteristica)) {
        map.set(r.caracteristica, {
          caracteristica: r.caracteristica,
          familia: r.familia,
          componente: r.componente,
          piezasMedidas: 0,
          cps: [],
          cpks: [],
          porcentajes: [],
          les: r.les,
          obj: r.obj,
          lei: r.lei,
          fechas: [],
        })
      }
      const g = map.get(r.caracteristica)
      g.piezasMedidas += r.piezasMedidas
      g.cps.push(r.cp)
      g.cpks.push(r.cpk)
      g.porcentajes.push(r.porcentaje)
      g.les = r.les
      g.obj = r.obj
      g.lei = r.lei
      g.fechas.push(r.fecha)
    })
    return Array.from(map.values()).map((g) => ({
      caracteristica: g.caracteristica,
      familia: g.familia,
      componente: g.componente,
      piezasMedidas: g.piezasMedidas,
      cp: round(g.cps.reduce((a, b) => a + b, 0) / g.cps.length, 2),
      cpk: round(g.cpks.reduce((a, b) => a + b, 0) / g.cpks.length, 2),
      porcentaje: round(g.porcentajes.reduce((a, b) => a + b, 0) / g.porcentajes.length, 1),
      les: g.les,
      obj: g.obj,
      lei: g.lei,
      fecha: g.fechas.sort().slice(-1)[0],
    }))
  }, [filtered])

  // Lógica de tendencias recalculada para acoplarse a los estados de barra al 100%
  const trend = useMemo(() => {
    const map = new Map()
    filtered.forEach((r) => {
      const key = groupKey(r.fecha, filters.group)
      if (!map.has(key)) map.set(key, { label: groupLabel(r.fecha, filters.group), pcts: [], total: 0, crit: 0, alert: 0, opt: 0, key })
      const g = map.get(key)
      g.pcts.push(r.porcentaje)
      g.total++
      
      const est = semaforoCPK(r.cpk)
      if (est === "red") g.crit++
      else if (est === "yellow") g.alert++
      else g.opt++
    })
    return Array.from(map.values())
      .sort((a, b) => (a.key < b.key ? -1 : 1))
      .map((g) => ({
        label: g.label,
        critico: round((g.crit / g.total) * 100, 1),
        alerta: round((g.alert / g.total) * 100, 1),
        optimo: round((g.opt / g.total) * 100, 1),
        pct: round(g.pcts.reduce((a, b) => a + b, 0) / g.pcts.length, 1),
      }))
  }, [filtered, filters.group])

  const shownColumns = ALL_COLUMNS.filter((c) => c.always || visible.includes(c.key))

  function toggleCol(key) {
    setVisible((v) => (v.includes(key) ? v.filter((k) => k !== key) : [...v, key]))
  }

  function cellValue(row, key) {
    if (key === "fecha") return formatDateDisplay(row.fecha)
    if (key === "porcentaje") return `${row.porcentaje}%`
    return row[key]
  }

  async function handleExport() {
    const cpkImg = renderCpkStackedBars(trend, { title: "Evolución Porcentual Distribución CPK" })
    const freqImg = renderFrecuenciaBars(
      trend.map((t) => ({ label: t.label, valor: t.pct, estado: semaforoFrecuencia(t.pct) })),
      { title: "% Frecuencia de Medición" },
    )

    const columns = shownColumns.map((c) => ({
      header: c.header,
      key: c.key,
      width: c.key === "caracteristica" ? 34 : 16,
      sem: c.sem,
      value: (r) => cellValue(r, c.key),
    }))

    await exportReportWithCharts({
      filename: "reporte_consolidado.xlsx",
      title: "Métricas de Calidad — Reporte Consolidado",
      columns,
      rows: consolidated,
      getSemEstado: (r, type) =>
        type === "cpk" ? semaforoCPK(r.cpk) : type === "freq" ? semaforoFrecuencia(r.porcentaje) : null,
      charts: [
        { title: "Evolución de Distribución CPK (Barras Apiladas)", dataUrl: cpkImg, widthPx: 720, heightPx: 320 },
        { title: "% Frecuencia de Medición", dataUrl: freqImg, widthPx: 720, heightPx: 320 },
      ],
    })
  }

  return (
    <div>
      <AdvancedFilters state={filters} setState={setFilters} data={cpk} />

      <div className="card mb-4">
        <div className="card-header">
          <div className="row" style={{ gap: 8 }}>
            <Columns3 size={16} />
            <h3>Filtros de Visualización de Columnas</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="col-toggle">
            {ALL_COLUMNS.filter((c) => !c.always).map((c) => (
              <button
                key={c.key}
                className={`col-pill ${visible.includes(c.key) ? "on" : ""}`}
                onClick={() => toggleCol(c.key)}
              >
                {c.header}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="charts-grid mb-4">
        <div className="chart-card">
          <h3>Evolución de Distribución de CPK</h3>
          <div className="chart-sub">Agrupado por {filters.group}</div>
          {trend.length ? <CpkTrendChart data={trend} height={260} /> : <div className="empty-state">Sin datos</div>}
        </div>
      </div>

      <div className="row-between mb-4">
        <span className="text-muted" style={{ fontSize: 13 }}>
          {consolidated.length} característica(s) consolidada(s)
        </span>
        <button className="btn btn-excel" onClick={handleExport} disabled={consolidated.length === 0}>
          <FileSpreadsheet size={16} /> Exportar Excel (tablas + gráficas)
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {shownColumns.map((c) => (
                <th key={c.key}>{c.header}</th>
              ))}
              {visible.includes("cpk") && <th>Semáforo CPK</th>}
              {visible.includes("porcentaje") && <th>Semáforo Frec.</th>}
            </tr>
          </thead>
          <tbody>
            {consolidated.map((row) => {
              const eCpk = semaforoCPK(row.cpk)
              const eFreq = semaforoFrecuencia(row.porcentaje)
              return (
                <tr key={row.caracteristica}>
                  {shownColumns.map((c) => {
                    let cls = ""
                    if (c.sem === "cpk") cls = `sem-cell-${eCpk}`
                    if (c.sem === "freq") cls = `sem-cell-${eFreq}`
                    return (
                      <td key={c.key} className={cls}>
                        {cellValue(row, c.key)}
                      </td>
                    )
                  })}
                  {visible.includes("cpk") && (
                    <td>
                      <Semaforo estado={eCpk} />
                    </td>
                  )}
                  {visible.includes("porcentaje") && (
                    <td>
                      <Semaforo estado={eFreq} />
                    </td>
                  )}
                </tr>
              )
            })}
            {consolidated.length === 0 && (
              <tr>
                <td colSpan={shownColumns.length + 2}>
                  <div className="empty-state">No hay datos consolidados para los filtros aplicados.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
