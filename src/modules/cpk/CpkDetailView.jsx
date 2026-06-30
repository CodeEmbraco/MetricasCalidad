import { useMemo } from "react"
import { ArrowLeft, Activity } from "lucide-react"
import Semaforo from "../../components/Semaforo.jsx"
import { semaforoCPK } from "../../utils/metrics.js"
import { formatDateDisplay } from "../../utils/dates.js"
import { buildDistribution } from "../../utils/stats.js"

// Importamos Recharts para montar las cartas de control estilo Minitab
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts"

/* Vista dedicada a pantalla completa de la gráfica de un registro CPK */
export default function CpkDetailView({ record, onBack }) {
  const estado = semaforoCPK(record.cpk)
  const { mu, sigma } = buildDistribution(record.muestras, record.lei, record.les)

  // Lógica para calcular Rangos Móviles y Límites Estadísticos
  const controlStats = useMemo(() => {
    const vMuestras = record?.muestras || []
    if (!vMuestras.length) return null

    // 1. Promedio de lecturas individuales (LC de Xi)
    const sumXi = vMuestras.reduce((a, b) => a + b, 0)
    const mediaXi = sumXi / vMuestras.length

    // 2. Rangos Móviles (Diferencia absoluta consecutiva)
    const rangos = []
    for (let i = 1; i < vMuestras.length; i++) {
      rangos.push(Math.abs(vMuestras[i] - vMuestras[i - 1]))
    }
    const mediaR = rangos.length ? rangos.reduce((a, b) => a + b, 0) / rangos.length : 0

    // 3. Límites de Control para Gráfica Individual (Xi) usando d2 = 1.128
    const d2 = 1.128
    const sigmaEstimado = mediaR / d2
    const lscXi = mediaXi + 3 * sigmaEstimado
    const licXi = Math.max(0, mediaXi - 3 * sigmaEstimado)

    // 4. Límites de Control para Gráfica de Rangos (R móvil) usando D4 = 3.267
    const lscR = 3.267 * mediaR

    // 5. Mapear dataset unificado para las gráficas
    const chartData = vMuestras.map((val, idx) => ({
      pieza: idx + 1,
      xi: Number(val.toFixed(4)),
      rMovil: idx === 0 ? null : Number(Math.abs(val - vMuestras[idx - 1]).toFixed(4)),
    }))

    return { chartData, mediaXi, lscXi, licXi, mediaR, lscR }
  }, [record])

  const stats = [
    { label: "CPK", value: record.cpk, sem: true },
    { label: "CP", value: record.cp },
    { label: "LEI", value: record.lei },
    { label: "Objetivo", value: record.obj },
    { label: "LES", value: record.les },
    { label: "Media (μ)", value: mu },
    { label: "Desv. (σ)", value: sigma },
    { label: "Piezas medidas", value: record.piezasMedidas },
  ]

  return (
    <div>
      <div className="row-between mb-4">
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Volver a la tabla
        </button>
        <Semaforo estado={estado} label={`CPK ${record.cpk}`} />
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <div>
            <h2>{record.caracteristica}</h2>
            <div className="card-sub">
              {record.familia} · {record.componente} · {formatDateDisplay(record.fecha)} {record.hora}
            </div>
          </div>
        </div>
        <div className="card-body">
          {/* Fila de KPIs Original */}
          <div className="kpi-row" style={{ marginBottom: 24 }}>
            {stats.map((s) => (
              <div className="kpi" key={s.label}>
                <div className="kpi-label">{s.label}</div>
                <div className="kpi-value" style={s.sem ? { color: `var(--sem-${estado})` } : undefined}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Sección de Cartas de Control Estadístico de Subgrupos */}
          {controlStats && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              
              {/* CARTAS CONTROL XI (Valores Individuales) */}
              <div>
                <h3 style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <Activity size={18} color="#0e6dd6" /> Gráfica de Valores Individuales (Xi)
                </h3>
                <div style={{ width: "100%", height: 200, background: "#fafafa", borderRadius: 8, padding: 10, border: "1px solid var(--border)" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={controlStats.chartData} margin={{ top: 10, right: 60, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="pieza" tick={{ fontSize: 10 }} />
                      <YAxis domain={[Math.min(record.lei, controlStats.licXi) * 0.99, Math.max(record.les, controlStats.lscXi) * 1.01]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      
                      {/* Límites Tecnológicos / Especificación */}
                      <ReferenceLine y={record.lei} stroke="#d92d20" strokeWidth={1.5} label={{ value: "LEI", position: "right", fill: "#d92d20", fontSize: 9 }} />
                      <ReferenceLine y={record.les} stroke="#d92d20" strokeWidth={1.5} label={{ value: "LES", position: "right", fill: "#d92d20", fontSize: 9 }} />
                      <ReferenceLine y={record.obj} stroke="#0e6dd6" strokeDasharray="3 3" label={{ value: "OBJ", position: "right", fill: "#0e6dd6", fontSize: 9 }} />
                      
                      {/* Límites Estadísticos Calculados del Proceso */}
                      <ReferenceLine y={controlStats.lscXi} stroke="#ff8000" strokeDasharray="4 4" label={{ value: `LSC=${controlStats.lscXi.toFixed(3)}`, position: "top", fill: "#ff8000", fontSize: 9 }} />
                      <ReferenceLine y={controlStats.mediaXi} stroke="#00833e" label={{ value: `LC=${controlStats.mediaXi.toFixed(3)}`, position: "top", fill: "#00833e", fontSize: 9 }} />
                      <ReferenceLine y={controlStats.licXi} stroke="#ff8000" strokeDasharray="4 4" label={{ value: `LIC=${controlStats.licXi.toFixed(3)}`, position: "bottom", fill: "#ff8000", fontSize: 9 }} />
                      
                      <Line type="monotone" dataKey="xi" name="Valor" stroke="#1b211e" strokeWidth={2} dot={{ r: 4, stroke: "#0e6dd6", fill: "#fff" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* CARTAS CONTROL R (Rango Móvil) */}
              <div>
                <h3 style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <Activity size={18} color="#ff8000" /> Gráfica de Rangos Móviles (R móvil)
                </h3>
                <div style={{ width: "100%", height: 160, background: "#fafafa", borderRadius: 8, padding: 10, border: "1px solid var(--border)" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={controlStats.chartData} margin={{ top: 10, right: 60, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="pieza" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, controlStats.lscR * 1.2]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      
                      {/* Límites del Rango */}
                      <ReferenceLine y={controlStats.lscR} stroke="#ff8000" strokeDasharray="4 4" label={{ value: `LSC=${controlStats.lscR.toFixed(3)}`, position: "right", fill: "#ff8000", fontSize: 9 }} />
                      <ReferenceLine y={controlStats.mediaR} stroke="#00833e" label={{ value: `R̄=${controlStats.mediaR.toFixed(3)}`, position: "right", fill: "#00833e", fontSize: 9 }} />
                      
                      <Line type="monotone" dataKey="rMovil" name="Rango M." stroke="#5c6661" strokeWidth={1.5} connectNulls dot={{ r: 3.5, stroke: "#ff8000", fill: "#fff" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
