import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  LabelList,
} from "recharts"

/* Gráfica con etiquetas de datos embebidas (Estilo Imagen 2) */
export default function CpkTrendChart({ data, height = 280 }) {
  
  // Formateador para ocultar números en segmentos demasiado pequeños e impedir encimado de texto
  const renderCustomLabel = (value) => {
    return value > 4 ? `${Number(value).toFixed(1)}%` : ""
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 15, right: 16, bottom: 8, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis 
          dataKey="label" 
          tick={{ fontSize: 10, fill: "var(--text-muted)" }} 
          interval="preserveStartEnd" 
        />
        <YAxis 
          tick={{ fontSize: 10, fill: "var(--text-muted)" }} 
          domain={[0, 100]} 
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(v) => [`${Number(v).toFixed(1)}%`]}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        
        {/* Barras Apiladas con inyección de LabelList */}
        <Bar dataKey="optimo" name="Cpk > 1.33" stackId="cpkStack" fill="#00833e">
          <LabelList dataKey="optimo" formatter={renderCustomLabel} position="inside" fill="#ffffff" style={{ fontSize: 11, fontWeight: "bold" }} />
        </Bar>
        
        <Bar dataKey="alerta" name="Cpk(1.00 - 1.33)" stackId="cpkStack" fill="#ffcc00">
          <LabelList dataKey="alerta" formatter={renderCustomLabel} position="inside" fill="#1b211e" style={{ fontSize: 11, fontWeight: "bold" }} />
        </Bar>
        
        <Bar dataKey="critico" name="Cpk < 1.00" stackId="cpkStack" fill="#d92d20" radius={[3, 3, 0, 0]}>
          <LabelList dataKey="critico" formatter={renderCustomLabel} position="inside" fill="#ffffff" style={{ fontSize: 11, fontWeight: "bold" }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}