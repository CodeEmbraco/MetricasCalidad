const COLORS = {
  green: "#00833e",
  blue: "#0e6dd6",
  red: "#d92d20",
  yellow: "#ffcc00",
  grid: "#d9dedb",
  text: "#5c6661",
  axis: "#1b211e",
}

export function renderCpkTrend(data, { title = "Evolución de CPK", width = 720, height = 320 } = {}) {
  const canvas = document.createElement("canvas")
  const scale = 2
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext("2d")
  ctx.scale(scale, scale)
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, width, height)

  const pad = { top: 44, right: 24, bottom: 56, left: 44 }
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom

  ctx.fillStyle = COLORS.axis
  ctx.font = "bold 15px Arial"
  ctx.fillText(title, pad.left, 26)

  const maxY = Math.max(2, ...data.map((d) => Math.max(d.cpk, d.cp || 0)) ) * 1.1
  const yToPx = (v) => pad.top + plotH - (v / maxY) * plotH
  const xToPx = (i) => pad.left + (data.length <= 1 ? plotW / 2 : (i / (data.length - 1)) * plotW)

  ctx.strokeStyle = COLORS.grid
  ctx.fillStyle = COLORS.text
  ctx.font = "11px Arial"
  ctx.lineWidth = 1
  const ticks = 5
  for (let t = 0; t <= ticks; t++) {
    const v = (maxY / ticks) * t
    const y = yToPx(v)
    ctx.beginPath()
    ctx.moveTo(pad.left, y)
    ctx.lineTo(width - pad.right, y)
    ctx.stroke()
    ctx.fillText(v.toFixed(1), 8, y + 4)
  }

  const drawLimit = (val, color, label) => {
    if (val > maxY) return
    const y = yToPx(val)
    ctx.strokeStyle = color
    ctx.setLineDash([6, 4])
    ctx.beginPath()
    ctx.moveTo(pad.left, y)
    ctx.lineTo(width - pad.right, y)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = color
    ctx.fillText(label, width - pad.right - 28, y - 4)
  }
  drawLimit(1.0, COLORS.red, "1.00")
  drawLimit(1.33, COLORS.green, "1.33")

  ctx.fillStyle = COLORS.text
  ctx.font = "10px Arial"
  const stepLabel = Math.ceil(data.length / 10)
  data.forEach((d, i) => {
    if (i % stepLabel !== 0 && i !== data.length - 1) return
    const x = xToPx(i)
    ctx.save()
    ctx.translate(x, height - pad.bottom + 14)
    ctx.rotate(-Math.PI / 6)
    ctx.fillText(String(d.label), -20, 0)
    ctx.restore()
  })

  const drawSeries = (key, color, dashed) => {
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    if (dashed) ctx.setLineDash([5, 3])
    ctx.beginPath()
    data.forEach((d, i) => {
      const x = xToPx(i)
      const y = yToPx(d[key] || 0)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
    ctx.setLineDash([])
    data.forEach((d, i) => {
      ctx.beginPath()
      ctx.arc(xToPx(i), yToPx(d[key] || 0), 3, 0, Math.PI * 2)
      ctx.fill()
    })
  }
  if (data.some((d) => d.cp != null)) drawSeries("cp", COLORS.blue, true)
  drawSeries("cpk", COLORS.green, false)

  ctx.font = "11px Arial"
  ctx.fillStyle = COLORS.green
  ctx.fillRect(pad.left, height - 18, 12, 4)
  ctx.fillStyle = COLORS.axis
  ctx.fillText("CPK", pad.left + 18, height - 12)
  ctx.fillStyle = COLORS.blue
  ctx.fillRect(pad.left + 70, height - 18, 12, 4)
  ctx.fillStyle = COLORS.axis
  ctx.fillText("CP", pad.left + 88, height - 12)

  return canvas.toDataURL("image/png")
}

export function renderFrecuenciaBars(data, { title = "% Frecuencia de Medición", width = 720, height = 320 } = {}) {
  const canvas = document.createElement("canvas")
  const scale = 2
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext("2d")
  ctx.scale(scale, scale)
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, width, height)

  const semColor = { red: COLORS.red, yellow: "#e0a800", green: "#1a8c4a" }
  const pad = { top: 44, right: 24, bottom: 60, left: 44 }
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom

  ctx.fillStyle = COLORS.axis
  ctx.font = "bold 15px Arial"
  ctx.fillText(title, pad.left, 26)

  const maxY = 100
  const yToPx = (v) => pad.top + plotH - (v / maxY) * plotH

  ctx.strokeStyle = COLORS.grid
  ctx.fillStyle = COLORS.text
  ctx.font = "11px Arial"
  for (let t = 0; t <= 5; t++) {
    const v = (maxY / 5) * t
    const y = yToPx(v)
    ctx.beginPath()
    ctx.moveTo(pad.left, y)
    ctx.lineTo(width - pad.right, y)
    ctx.stroke()
    ctx.fillText(v + "%", 10, y + 4)
  }

  const n = data.length || 1
  const bw = Math.min(48, (plotW / n) * 0.7)
  data.forEach((d, i) => {
    const cx = pad.left + (plotW / n) * (i + 0.5)
    const y = yToPx(d.valor)
    ctx.fillStyle = semColor[d.estado] || COLORS.green
    ctx.fillRect(cx - bw / 2, y, bw, pad.top + plotH - y)
    ctx.fillStyle = COLORS.axis
    ctx.font = "10px Arial"
    ctx.textAlign = "center"
    ctx.fillText(Math.round(d.valor) + "%", cx, y - 4)
    ctx.save()
    ctx.translate(cx, height - pad.bottom + 14)
    ctx.rotate(-Math.PI / 6)
    ctx.fillText(String(d.label), -10, 0)
    ctx.restore()
    ctx.textAlign = "left"
  })

  return canvas.toDataURL("image/png")
}

/* NUEVA: Pinta la gráfica de barras apiladas al 100% para exportar al Excel (Imagen 4)
*/
export function renderCpkStackedBars(data, { title = "Evolución de Distribución de CPK (%)", width = 720, height = 320 } = {}) {
  const canvas = document.createElement("canvas")
  const scale = 2
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext("2d")
  ctx.scale(scale, scale)

  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, width, height)

  const pad = { top: 46, right: 30, bottom: 54, left: 50 }
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom

  ctx.fillStyle = COLORS.axis
  ctx.font = "bold 14px Arial"
  ctx.fillText(title, pad.left, 26)

  const yToPx = (pct) => pad.top + plotH - (pct / 100) * plotH

  ctx.lineWidth = 1
  for (let p = 0; p <= 100; p += 25) {
    const y = yToPx(p)
    ctx.strokeStyle = COLORS.grid
    ctx.beginPath()
    ctx.moveTo(pad.left, y)
    ctx.lineTo(width - pad.right, y)
    ctx.stroke()
    ctx.fillStyle = COLORS.text
    ctx.font = "10px Arial"
    ctx.fillText(`${p}%`, 16, y + 4)
  }

  const n = data.length || 1
  const colW = plotW / n
  const barW = colW * 0.75

  data.forEach((d, i) => {
    const x = pad.left + colW * i + (colW - barW) / 2

    const yCritico = yToPx(d.critico)
    const yAlerta = yToPx(d.critico + d.alerta)
    const yOptimo = yToPx(d.critico + d.alerta + d.optimo)

    // Óptimo
    ctx.fillStyle = COLORS.green
    ctx.fillRect(x, yOptimo, barW, yToPx(0) - yOptimo)

    // Alerta
    ctx.fillStyle = COLORS.yellow
    ctx.fillRect(x, yAlerta, barW, yToPx(0) - yAlerta)

    // Crítico
    ctx.fillStyle = COLORS.red
    ctx.fillRect(x, yCritico, barW, yToPx(0) - yCritico)

    // Etiquetas X
    ctx.fillStyle = COLORS.axis
    ctx.save()
    ctx.translate(x + barW / 2, height - pad.bottom + 14)
    ctx.rotate(-Math.PI / 6)
    ctx.textAlign = "center"
    ctx.fillText(String(d.label), 0, 0)
    ctx.restore()
  })

  return canvas.toDataURL("image/png")
}
