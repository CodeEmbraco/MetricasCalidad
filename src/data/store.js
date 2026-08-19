/* Almacén local (localStorage) — simula backend / API Infinity.
   - registros de Frecuencia de Medición (Módulo 1)
   - mediciones de CPK (Módulos 2 y 3) */

import { getCaracteristicas } from "./catalog.js"
import {
  horasDecimal,
  calcRate,
  calcPiezasHora,
  calcTotalMuestras,
  calcPorcentajeFrecuencia,
  round,
} from "../utils/metrics.js"

const KEY_FREQ = "mc_frecuencia_v1"
const KEY_CPK = "mc_cpk_v1"
const KEY_SEED = "mc_seeded_v1"

/* ---------- helpers ---------- */
function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]")
  } catch {
    return []
  }
}
function write(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
  window.dispatchEvent(new CustomEvent("mc-data-changed", { detail: { key } }))
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function dateNDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function rnd(min, max) {
  return Math.random() * (max - min) + min
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/* ---------- Frecuencia de Medición (Módulo 1) ---------- */
export function getFrecuencia() {
  return read(KEY_FREQ)
}

export function addFrecuencia(record) {
  const list = read(KEY_FREQ)
  list.unshift({ id: uid(), ...record })
  write(KEY_FREQ, list)
}

export function deleteFrecuencia(id) {
  write(KEY_FREQ, read(KEY_FREQ).filter((r) => r.id !== id))
}

/* construye un registro completo a partir de entradas crudas */
export function buildFrecuenciaRecord(input) {
  const horasDec = horasDecimal(input.horas, input.minutos)
  const rate = calcRate(input.volumen, horasDec)
  const piezasHora = calcPiezasHora(input.frecuencia, input.tamanoMuestra)
  const totalMuestras = calcTotalMuestras(horasDec, piezasHora)
  const porcentaje = calcPorcentajeFrecuencia(input.medicionesInfinity, totalMuestras)
  return {
    familia: input.familia,
    componente: input.componente,
    caracteristica: input.caracteristica,
    fecha: input.fecha,
    volumen: Number(input.volumen) || 0,
    horas: Number(input.horas) || 0,
    minutos: Number(input.minutos) || 0,
    horasDec: round(horasDec, 2),
    rate,
    tamanoMuestra: Number(input.tamanoMuestra) || 0,
    frecuencia: Number(input.frecuencia) || 0,
    piezasHora: round(piezasHora, 2),
    totalMuestras,
    medicionesInfinity: Number(input.medicionesInfinity) || 0,
    porcentaje: round(porcentaje, 1),
  }
}

/* ---------- CPK (Módulos 2 y 3) ---------- */
export function getCPK() {
  return read(KEY_CPK)
}

export function addCPK(record) {
  const list = read(KEY_CPK)
  list.unshift({ id: uid(), ...record })
  write(KEY_CPK, list)
}

/* ---------- Datos de ejemplo ---------- */
export function seedIfEmpty() {
  if (localStorage.getItem(KEY_SEED)) return

  const freq = []
  const cpk = []

  const componentes = ["Crankcase", "Piston", "Crankshaft"]

  for (let i = 0; i < 90; i++) {
    const fecha = dateNDaysAgo(i)
    // 2-3 registros por día
    const n = 2 + Math.floor(Math.random() * 2)
    for (let j = 0; j < n; j++) {
      const familia = pick(["Compresores ES", "Compresores ES", "Cooling"])
      const componente = pick(componentes)
      const caracs = getCaracteristicas(familia, componente)
      if (!caracs.length) continue
      const caracteristica = pick(caracs)

      const volumen = Math.round(rnd(800, 2200))
      const horas = 7 + Math.floor(rnd(0, 2))
      const minutos = Math.floor(rnd(0, 60))
      const horasDec = horasDecimal(horas, minutos)
      const rate = calcRate(volumen, horasDec)
      const tamanoMuestra = pick([3, 4, 5])
      const frecuencia = pick([4, 6, 8])
      const piezasHora = calcPiezasHora(frecuencia, tamanoMuestra)
      const totalMuestras = calcTotalMuestras(horasDec, piezasHora)
      const cumplimiento = rnd(0.55, 1.0)
      const medicionesInfinity = Math.round(totalMuestras * cumplimiento)
      const porcentaje = calcPorcentajeFrecuencia(medicionesInfinity, totalMuestras)

      freq.push({
        id: uid(),
        familia,
        componente,
        caracteristica,
        fecha,
        volumen,
        horas,
        minutos,
        horasDec: round(horasDec, 2),
        rate,
        tamanoMuestra,
        frecuencia,
        piezasHora: round(piezasHora, 2),
        totalMuestras,
        medicionesInfinity,
        porcentaje: round(porcentaje, 1),
      })

      // CPK asociado
      const obj = round(rnd(9.5, 10.5), 3)
      const lei = round(obj - rnd(0.3, 0.6), 3)
      const les = round(obj + rnd(0.3, 0.6), 3)
      const cpkVal = round(rnd(0.7, 1.9), 2)
      const cpVal = round(cpkVal + rnd(0.05, 0.4), 2)
      const piezasMedidas = medicionesInfinity

      // muestra de distribución (para histograma)
      const sigma = (les - lei) / (6 * Math.max(cpVal, 0.4))
      const muestras = []
      for (let k = 0; k < 30; k++) {
        // box-muller
        const u1 = Math.random() || 1e-6
        const u2 = Math.random()
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
        muestras.push(round(obj + z * sigma, 4))
      }

      cpk.push({
        id: uid(),
        familia,
        componente,
        caracteristica,
        fecha,
        hora: `${String(7 + Math.floor(rnd(0, 9))).padStart(2, "0")}:${String(Math.floor(rnd(0, 60))).padStart(2, "0")}`,
        cp: cpVal,
        cpk: cpkVal,
        lei,
        obj,
        les,
        piezasMedidas,
        porcentaje: round(porcentaje, 1),
        rate,
        muestras,
      })
    }
  }

  write(KEY_FREQ, freq)
  write(KEY_CPK, cpk)
  localStorage.setItem(KEY_SEED, "1")
}

export function resetData() {
  localStorage.removeItem(KEY_FREQ)
  localStorage.removeItem(KEY_CPK)
  localStorage.removeItem(KEY_SEED)
  seedIfEmpty()
  window.dispatchEvent(new CustomEvent("mc-data-changed", { detail: { key: "all" } }))
}
