/* Utilidades estadísticas para distribución/CPK */

export function mean(arr) {
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

export function stdDev(arr) {
  if (arr.length < 2) return 0
  const m = mean(arr)
  const v = arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length - 1)
  return Math.sqrt(v)
}

/* Construye histograma + curva normal teórica para una característica.
   Devuelve { bins:[{x, count, density}], curve:[{x, y}], mu, sigma } */
export function buildDistribution(muestras, lei, les, bins = 12) {
  if (!muestras || muestras.length === 0) return { bins: [], curve: [], mu: 0, sigma: 0 }
  const mu = mean(muestras)
  const sigma = stdDev(muestras) || 1e-6
  const min = Math.min(...muestras, lei)
  const max = Math.max(...muestras, les)
  const span = max - min || 1
  const step = span / bins
  const binArr = Array.from({ length: bins }, (_, i) => ({
    x: +(min + step * (i + 0.5)).toFixed(3),
    x0: min + step * i,
    x1: min + step * (i + 1),
    count: 0,
  }))
  muestras.forEach((v) => {
    let idx = Math.floor((v - min) / step)
    if (idx >= bins) idx = bins - 1
    if (idx < 0) idx = 0
    binArr[idx].count++
  })
  // curva normal escalada al conteo máximo
  const maxCount = Math.max(...binArr.map((b) => b.count), 1)
  const peak = 1 / (sigma * Math.sqrt(2 * Math.PI))
  const curve = []
  const cSteps = 50
  for (let i = 0; i <= cSteps; i++) {
    const x = min + (span * i) / cSteps
    const y = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-((x - mu) ** 2) / (2 * sigma ** 2))
    curve.push({ x: +x.toFixed(3), y: +((y / peak) * maxCount).toFixed(3) })
  }
  return { bins: binArr, curve, mu: +mu.toFixed(3), sigma: +sigma.toFixed(4) }
}
