import { useMemo, useState, useEffect } from "react"
import { FileSpreadsheet, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react" // <--- Agregados íconos de navegación
import AdvancedFilters, { defaultFilterState, applyFilters } from "../../components/AdvancedFilters.jsx"
import { semaforoCPK, round } from "../../utils/metrics.js"
import { groupKey, groupLabel } from "../../utils/dates.js"
import CpkTrendChart from "../../components/charts/CpkTrendChart.jsx"
import CpkDetailView from "./CpkDetailView.jsx"
import { exportMatrixReport } from "../../utils/excel.js"
import { renderCpkStackedBars } from "../../utils/chartImage.js"

// Recharts para la mini gráfica del hover
import { LineChart, Line, YAxis, ReferenceLine, ResponsiveContainer } from "recharts"

export default function AnalisisCPK() {
  // Estados para consumo de API SQL Server (InfinityQS)
  const [cpk, setCpk] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [filters, setFilters] = useState(defaultFilterState())
  const [detail, setDetail] = useState(null)
  const [hover, setHover] = useState(null) // { record, x, y }

  // 1. ESTADOS DE PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Helper para formatear YYYY-MM-DD sin desfase UTC por zona horaria
  function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Obtener rango exacto de la semana
  function getRangoSemana(offsetSemanas = 0) {
    const hoy = new Date();
    const dayOfWeek = hoy.getDay() === 0 ? 7 : hoy.getDay(); 
    
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - dayOfWeek + 1 + (offsetSemanas * 7));
    
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);

    return {
      fechaInicio: formatLocalDate(lunes),
      fechaFin: formatLocalDate(domingo)
    };
  }

  // Petición a la API del Backend en Express
  const fetchCpkData = () => {
    setLoading(true)
    setError(null)

    const { fechaInicio, fechaFin } = getRangoSemana(-1); 
    const fInicio = filters.desde || fechaInicio;
    const fFin = filters.hasta || fechaFin;

    const url = `http://localhost:3001/api/cpk/getCpk?fechaInicio=${fInicio}&fechaFin=${fFin}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Error al consultar Cpk de InfinityQS")
        return res.json()
      })
      .then((data) => {
        setCpk(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error API Cpk:", err)
        setError("No se pudieron cargar los datos de capacidad (Cpk) desde InfinityQS.")
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchCpkData()
  }, [filters.desde, filters.hasta])

  const filtered = useMemo(() => {
    return applyFilters(cpk, filters)
  }, [cpk, filters])

  // Columnas de tiempo dinámicas únicas (Eje X)
  const timeColumns = useMemo(() => {
    const keysMap = new Map()
    filtered.forEach((r) => {
      const key = groupKey(r.fecha, filters.group)
      if (!keysMap.has(key)) {
        keysMap.set(key, { key, label: groupLabel(r.fecha, filters.group) })
      }
    })
    return Array.from(keysMap.values()).sort((a, b) => (a.key < b.key ? -1 : 1))
  }, [filtered, filters.group])

  // Agrupación porcentual acumulada
  const trendData = useMemo(() => {
    const segments = new Map()
    timeColumns.forEach(col => {
      segments.set(col.key, { label: col.label, criticoCount: 0, alertaCount: 0, optimoCount: 0, total: 0 })
    })

    filtered.forEach((r) => {
      const key = groupKey(r.fecha, filters.group)
      const seg = segments.get(key)
      if (seg) {
        const estado = semaforoCPK(r.cpk)
        if (estado === "red") seg.criticoCount++
        else if (estado === "yellow") seg.alertaCount++
        else seg.optimoCount++
        seg.total++
      }
    })

    return Array.from(segments.values()).map((s) => ({
      label: s.label,
      critico: s.total ? round((s.criticoCount / s.total) * 100, 1) : 0,
      alerta: s.total ? round((s.alertaCount / s.total) * 100, 1) : 0,
      optimo: s.total ? round((s.optimoCount / s.total) * 100, 1) : 0,
    }))
  }, [filtered, timeColumns])

  // Transformación matricial completa
  const matrixRows = useMemo(() => {
    const map = new Map()
    filtered.forEach((r) => {
      const maq = r.maquina || r.machine || "-"
      const rowKey = `${r.familia}-${r.componente}-${r.caracteristica}-${maq}`
      if (!map.has(rowKey)) {
        map.set(rowKey, {
          familia: r.familia,
          componente: r.componente,
          caracteristica: r.caracteristica,
          maquina: maq,
          valoresPorPeriodo: {},
        })
      }
      const tKey = groupKey(r.fecha, filters.group)
      map.get(rowKey).valoresPorPeriodo[tKey] = r
    })
    return Array.from(map.values())
  }, [filtered, filters.group])

  // 2. REINICIAR A PÁGINA 1 CUANDO CAMBIEN LOS FILTROS O LA MATRIZ
  useEffect(() => {
    setCurrentPage(1)
  }, [matrixRows.length])

  // 3. RECORTAR 'matrixRows' PARA OBTENER LA PÁGINA ACTUAL
  const totalPages = Math.ceil(matrixRows.length / pageSize) || 1

  const paginatedMatrixRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return matrixRows.slice(start, start + pageSize)
  }, [matrixRows, currentPage, pageSize])

  const criticos = filtered.filter((r) => semaforoCPK(r.cpk) === "red").length

  const componenteDinamico = useMemo(() => {
    if (filters.componentes && filters.componentes.length === 1) return filters.componentes[0]
    return "Componentes Múltiples"
  }, [filters.componentes])

  async function handleExportExcel() {
    const chartImgUrl = renderCpkStackedBars(trendData, { title: `Distribución de Estados CPK por ${filters.group}` })
    
    // Se mantiene 'matrixRows' completo para exportar la totalidad de la matriz a Excel
    await exportMatrixReport({
      filename: `analisis_cpk_matriz_${filters.group}.xlsx`,
      title: `Reporte de Evolución Cruzada CPK — Agrupación: ${filters.group}`,
      timeColumns,
      matrixRows,
      chartDataUrl: chartImgUrl
    })
  }

  if (detail) {
    return <CpkDetailView record={detail} onBack={() => setDetail(null)} />
  }

  return (
    <div onMouseMove={(e) => hover?.record && setHover((h) => h ? { ...h, x: e.clientX, y: e.clientY } : null)}>
      
      {/* 1. Filtros avanzados */}
      <div style={{ position: "relative" }}>
        <AdvancedFilters state={filters} setState={setFilters} data={cpk} />
        
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={fetchCpkData} 
          title="Recargar Cpk"
          style={{ position: "absolute", top: 12, right: 12 }}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} />
        </button>
      </div>

      {/* 2. Fila de KPIs */}
      <div className="kpi-row" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "16px" }}>
        <div className="kpi"><div className="kpi-label">Registros</div><div className="kpi-value">{loading ? "..." : filtered.length}</div></div>
        <div className="kpi">
          <div className="kpi-label">Características críticas</div>
          <div className="kpi-value" style={{ color: criticos ? "var(--sem-red)" : "var(--text)" }}>{loading ? "..." : criticos}</div>
        </div>
        <div className="kpi"><div className="kpi-label">Agrupación</div><div className="kpi-value" style={{ fontSize: 20, textTransform: "capitalize" }}>{filters.group}</div></div>
      </div>

      {error && <div className="card p-4 style-error mb-4 mt-4">{error}</div>}

      {/* 3. Gráfica de Evolución */}
      <div className="chart-card mb-4 mt-4">
        <h3 style={{ margin: "0 0 4px 0" }}>Evolución de CPK</h3>
        <div className="chart-sub" style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: "500" }}>
          {componenteDinamico} | CTQs Evolution
        </div>
        {trendData.length > 0 ? <CpkTrendChart data={trendData} height={340} /> : <div className="empty-state">Sin datos para el rango seleccionado.</div>}
      </div>

      <div className="row-between mb-4">
        <span className="text-muted" style={{ fontSize: 13 }}>
          {loading ? "Cargando matriz..." : `${matrixRows.length} características cruzadas en ${timeColumns.length} columnas de tiempo. Pasa el cursor sobre el valor para previsualizar; haz clic para pantalla completa.`}
        </span>
        <button className="btn btn-excel" onClick={handleExportExcel} disabled={matrixRows.length === 0}>
          <FileSpreadsheet size={16} /> Exportar Matriz a Excel
        </button>
      </div>

      {/* 4. Tabla Matricial Dinámica Paginada */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Familia</th>
              <th>Componente</th>
              <th>Característica</th>
              <th>Máquina</th>
              {timeColumns.map((col) => (
                <th key={col.key} style={{ textAlign: "center", minWidth: 80 }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Se renderiza únicamente la página activa: 'paginatedMatrixRows' */}
            {paginatedMatrixRows.map((row, rIdx) => (
              <tr key={rIdx}>
                <td>{row.familia}</td>
                <td>{row.componente}</td>
                <td style={{ fontWeight: 500, color: "var(--text-accent)" }}>{row.caracteristica}</td>
                <td style={{ fontWeight: 500, color: "var(--text-muted)" }}>{row.maquina}</td>
                {timeColumns.map((col) => {
                  const item = row.valoresPorPeriodo[col.key]
                  if (!item) return <td key={col.key} style={{ textAlign: "center", color: "#ccc", background: "#fafafa" }}>-</td>
                  
                  const estado = semaforoCPK(item.cpk)
                  return (
                    <td
                      key={col.key}
                      className={`sem-cell-${estado} cpk-clickable`}
                      style={{ textAlign: "center", fontWeight: "bold" }}
                      onMouseEnter={(e) => setHover({ record: item, x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => {
                        setHover(null)
                        setDetail(item)
                      }}
                    >
                      {item.cpk.toFixed(2)}
                    </td>
                  )
                })}
              </tr>
            ))}
            {!loading && matrixRows.length === 0 && (
              <tr>
                <td colSpan={4 + timeColumns.length}>
                  <div className="empty-state">No hay datos de CPK que coincidan con los filtros.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 5. CONTROLES DE PAGINACIÓN */}
      {!loading && matrixRows.length > 0 && (
        <div className="row-between mt-4" style={{ alignItems: "center" }}>
          <div className="row" style={{ gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13 }}>Mostrar</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="form-select"
              style={{ width: "auto", padding: "4px 8px" }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span style={{ fontSize: 13 }}>filas por página</span>
          </div>

          <div className="row" style={{ gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13, marginRight: 8 }}>
              Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
            </span>
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              style={{ padding: "6px 12px" }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{ padding: "6px 12px" }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 6. Tooltip Flotante */}
      {hover?.record && (
        <div
          className="cpk-tooltip"
          style={{
            top: Math.min((hover.y || 0) + 16, window.innerHeight - 240),
            left: Math.min((hover.x || 0) + 16, window.innerWidth - 340),
            width: 320,
            padding: 12
          }}
        >
          <h4 style={{ margin: "0 0 4px 0", fontSize: 13, fontWeight: "bold" }}>
            {hover.record.caracteristica} · CPK {hover.record.cpk.toFixed(2)}
          </h4>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>
            CP: {hover.record.cp.toFixed(2)} | Máquina: {hover.record.maquina || hover.record.machine || "-"}
          </div>
          
          <MiniControlChart record={hover.record} />
        </div>
      )}
    </div>
  )
}

/* Gráfica lineal para el Hover flotante */
function MiniControlChart({ record }) {
  const muestras = record?.muestras || []
  if (!muestras.length) return null

  const sumXi = muestras.reduce((a, b) => a + b, 0)
  const mediaXi = sumXi / muestras.length

  const rangos = []
  for (let i = 1; i < muestras.length; i++) {
    rangos.push(Math.abs(muestras[i] - muestras[i - 1]))
  }
  const mediaR = rangos.length ? rangos.reduce((a, b) => a + b, 0) / rangos.length : 0
  const sigmaEstimado = mediaR / 1.128
  const lscXi = mediaXi + 3 * sigmaEstimado
  const licXi = Math.max(0, mediaXi - 3 * sigmaEstimado)

  const chartData = muestras.map((val, idx) => ({
    pieza: idx + 1,
    xi: Number(val.toFixed(4)),
  }))

  return (
    <div style={{ width: "100%", height: 130, marginTop: 8, background: "var(--bg-main)", borderRadius: 6, padding: "4px 0" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 35, left: -25, bottom: 5 }}>
          <YAxis domain={[Math.min(record.lei, licXi) * 0.995, Math.max(record.les, lscXi) * 1.005]} tick={{ fontSize: 8 }} />
          <ReferenceLine y={record.lei} stroke="#d92d20" strokeWidth={1} label={{ value: "LEI", position: "right", fill: "#d92d20", fontSize: 8 }} />
          <ReferenceLine y={record.les} stroke="#d92d20" strokeWidth={1} label={{ value: "LES", position: "right", fill: "#d92d20", fontSize: 8 }} />
          <ReferenceLine y={lscXi} stroke="#ff8000" strokeDasharray="3 3" strokeWidth={1} label={{ value: "LSC", position: "insideTopRight", fill: "#ff8000", fontSize: 8 }} />
          <ReferenceLine y={mediaXi} stroke="#00833e" strokeWidth={1} />
          <ReferenceLine y={licXi} stroke="#ff8000" strokeDasharray="3 3" strokeWidth={1} label={{ value: "LIC", position: "insideBottomRight", fill: "#ff8000", fontSize: 8 }} />
          <Line type="monotone" dataKey="xi" stroke="#1b211e" strokeWidth={1.5} dot={{ r: 2, fill: "#0e6dd6", strokeWidth: 0 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}