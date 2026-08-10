/* ============================================================
   frontend/src/data/store.js
   Adaptador de datos — delega todas las operaciones al backend
   REST a través de api.js.

   Las funciones de cálculo puro (buildFrecuenciaRecord, etc.)
   permanecen aquí porque no dependen del almacenamiento.
   ============================================================ */

import {
  getFrecuencia as apiFrecuencia,
  addFrecuencia as apiAddFrecuencia,
  deleteFrecuencia as apiDeleteFrecuencia,
  getCPK as apiGetCPK,
  addCPK as apiAddCPK,
} from "./api.js"

import {
  horasDecimal,
  calcRate,
  calcPiezasHora,
  calcTotalMuestras,
  calcPorcentajeFrecuencia,
  round,
} from "../utils/metrics.js"

/* ── Frecuencia de Medición ─────────────────────────────── */

export async function getFrecuencia() {
  return apiFrecuencia()
}

export async function addFrecuencia(record) {
  return apiAddFrecuencia(record)
}

export async function deleteFrecuencia(id) {
  return apiDeleteFrecuencia(id)
}

/* ── CPK ────────────────────────────────────────────────── */

export async function getCPK() {
  return apiGetCPK()
}

export async function addCPK(record) {
  return apiAddCPK(record)
}

/* ── Cálculo de registro de frecuencia (lógica pura) ─────── */
export function buildFrecuenciaRecord(input) {
  const horasDec = horasDecimal(input.horas, input.minutos)
  const rate = calcRate(input.volumen, horasDec)
  const piezasHora = calcPiezasHora(input.frecuencia, input.tamanoMuestra)
  const totalMuestras = calcTotalMuestras(horasDec, piezasHora)
  const porcentaje = calcPorcentajeFrecuencia(input.medicionesInfinity, totalMuestras)
  return {
    familia:            input.familia,
    componente:         input.componente,
    caracteristica:     input.caracteristica,
    maquina:            input.maquina || "-",
    fecha:              input.fecha,
    volumen:            Number(input.volumen)            || 0,
    horas:              Number(input.horas)              || 0,
    minutos:            Number(input.minutos)            || 0,
    horasDec:           round(horasDec, 2),
    rate,
    tamanoMuestra:      Number(input.tamanoMuestra)      || 0,
    frecuencia:         Number(input.frecuencia)         || 0,
    piezasHora:         round(piezasHora, 2),
    totalMuestras,
    medicionesInfinity: Number(input.medicionesInfinity) || 0,
    porcentaje:         round(porcentaje, 1),
  }
}

/* ── seedIfEmpty / resetData — no-ops en modo backend ───── */
// El seed vive en backend/db/seed.js (npm run seed).
export function seedIfEmpty() {}
export function resetData() {
  console.warn("[store] resetData() no está implementado en modo backend.")
}
