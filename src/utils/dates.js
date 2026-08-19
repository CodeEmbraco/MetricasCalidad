/* Utilidades de fecha: día de la semana, número de semana ISO, agrupaciones */

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export function parseDate(value) {
  if (!value) return null
  // value en formato YYYY-MM-DD (input date) — interpretar como fecha local
  const [y, m, d] = value.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function getDayName(value) {
  const date = parseDate(value)
  if (!date) return ""
  return DIAS[date.getDay()]
}

export function getMonthName(monthIndex) {
  return MESES[monthIndex] || ""
}

/* Número de semana ISO 8601 */
export function getISOWeek(value) {
  const date = parseDate(value)
  if (!date) return null
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = tmp.getUTCDay() || 7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  return Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7)
}

export function getISOWeekYear(value) {
  const date = parseDate(value)
  if (!date) return null
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = tmp.getUTCDay() || 7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum)
  return tmp.getUTCFullYear()
}

/* Clave de agrupación temporal */
export function groupKey(value, mode) {
  const date = parseDate(value)
  if (!date) return ""
  const y = date.getFullYear()
  switch (mode) {
    case "dia":
      return value
    case "semana":
      return `${getISOWeekYear(value)}-S${String(getISOWeek(value)).padStart(2, "0")}`
    case "mes":
      return `${y}-${String(date.getMonth() + 1).padStart(2, "0")}`
    case "anio":
      return `${y}`
    default:
      return value
  }
}

export function groupLabel(value, mode) {
  const date = parseDate(value)
  if (!date) return ""
  switch (mode) {
    case "dia":
      return value
    case "semana":
      return `Sem ${getISOWeek(value)} · ${getISOWeekYear(value)}`
    case "mes":
      return `${getMonthName(date.getMonth())} ${date.getFullYear()}`
    case "anio":
      return `${date.getFullYear()}`
    default:
      return value
  }
}

export function formatDateDisplay(value) {
  const date = parseDate(value)
  if (!date) return ""
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`
}

export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export { DIAS, MESES }
