/* Cálculos de negocio y reglas de semáforo */

/* Horas reales en formato horas+minutos -> horas decimales */
export function horasDecimal(horas, minutos) {
  const h = Number(horas) || 0
  const m = Number(minutos) || 0
  return h + m / 60
}

/* Rate = Volumen / Horas Reales (entero redondeado) */
export function calcRate(volumen, horasDec) {
  if (!volumen || !horasDec) return 0
  return Math.round(Number(volumen) / horasDec)
}

/* Piezas/Hora = Frecuencia / Tamaño de Muestra */
export function calcPiezasHora(frecuencia, tamanoMuestra) {
  const f = Number(frecuencia) || 0
  const t = Number(tamanoMuestra) || 0
  if (!t) return 0
  return f / t
}

/* Total de Muestras = Horas Reales / Piezas/Hora (entero redondeado) */
export function calcTotalMuestras(horasDec, piezasHora) {
  if (!horasDec || !piezasHora) return 0
  return Math.round(horasDec / piezasHora)
}

/* % Frecuencia de Medición = (Mediciones Infinity / Total Muestras) * 100 */
export function calcPorcentajeFrecuencia(medicionesInfinity, totalMuestras) {
  if (!totalMuestras) return 0
  return (Number(medicionesInfinity) / totalMuestras) * 100
}

/* ---------- Semáforo Frecuencia de Medición ----------
   Rojo: < 70%  (menor a 69%)
   Amarillo: 70% - 84%
   Verde: >= 85% */
export function semaforoFrecuencia(porcentaje) {
  const p = Number(porcentaje) || 0
  if (p < 70) return "red"
  if (p < 85) return "yellow"
  return "green"
}

/* ---------- Semáforo CPK ----------
   Rojo: < 1.00 (menos de 0.99)
   Amarillo: 1.00 - 1.33
   Verde: > 1.33 */
export function semaforoCPK(cpk) {
  const c = Number(cpk)
  if (isNaN(c)) return "red"
  if (c < 1.0) return "red"
  if (c <= 1.33) return "yellow"
  return "green"
}

export const SEM_LABEL = {
  red: "Crítico",
  yellow: "Alerta",
  green: "Óptimo",
}

/* Color hex para Excel / charts según estado */
export const SEM_HEX = {
  red: { fill: "FDE8E6", text: "D92D20", solid: "D92D20" },
  yellow: { fill: "FDF6E3", text: "B58900", solid: "E0A800" },
  green: { fill: "E6F5EC", text: "1A8C4A", solid: "1A8C4A" },
}

export function round(n, dec = 2) {
  const f = Math.pow(10, dec)
  return Math.round((Number(n) || 0) * f) / f
}
