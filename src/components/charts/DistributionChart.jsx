import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { buildDistribution } from "../../utils/stats.js"

/* Histograma de distribución + curva normal + límites LEI/OBJ/LES */
export default function DistributionChart({ record, height = 260, compact = false }) {
  const { muestras = [], lei, obj, les } = record
  const { bins, curve } = buildDistribution(muestras, lei, les)

  // combinar bins y curva sobre el mismo eje x aproximado
  const data = bins.map((b) => {
    const near = curve.reduce((prev, c) => (Math.abs(c.x - b.x) < Math.abs(prev.x - b.x) ? c : prev), curve[0])
    return { x: b.x, count: b.count, curva: near ? near.y : 0 }
  })

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 12, bottom: compact ? 4 : 16, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="x"
          tick={{ fontSize: 10, fill: "var(--text-muted)" }}
          tickFormatter={(v) => v.toFixed(2)}
        />
        <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} allowDecimals={false} />
        {!compact && (
          <Tooltip
            contentStyle={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v, n) => [Number(v).toFixed(2), n === "count" ? "Frecuencia" : "Normal"]}
          />
        )}
        <Bar dataKey="count" fill="var(--nidec-green)" radius={[3, 3, 0, 0]} barSize={compact ? 10 : 18} />
        <Line type="monotone" dataKey="curva" stroke="#1b211e" strokeWidth={2} dot={false} />
        <ReferenceLine x={lei} stroke="#d92d20" strokeWidth={1.5} label={compact ? null : { value: "LEI", fontSize: 10, fill: "#d92d20" }} />
        <ReferenceLine x={obj} stroke="#0e6dd6" strokeDasharray="4 3" label={compact ? null : { value: "OBJ", fontSize: 10, fill: "#0e6dd6" }} />
        <ReferenceLine x={les} stroke="#d92d20" strokeWidth={1.5} label={compact ? null : { value: "LES", fontSize: 10, fill: "#d92d20" }} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
