/* ============================================================
   frontend/src/data/api.js
   Cliente HTTP centralizado para consumir el backend REST.
   Todas las funciones son async/await.
   ============================================================ */

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "")

/* ── Helper interno ─────────────────────────────────────── */
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })

  if (!res.ok) {
    let msg = `Error ${res.status}`
    try {
      const body = await res.json()
      msg = body.error || msg
    } catch {
      // respuesta no-JSON
    }
    throw new Error(msg)
  }

  // DELETE devuelve JSON vacío a veces
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

/* ── Frecuencia ─────────────────────────────────────────── */

/** Obtiene todos los registros de frecuencia */
export async function getFrecuencia() {
  return request("/api/frecuencia")
}

/** Crea un nuevo registro de frecuencia */
export async function addFrecuencia(record) {
  return request("/api/frecuencia", {
    method: "POST",
    body: JSON.stringify(record),
  })
}

/** Elimina un registro de frecuencia por ID */
export async function deleteFrecuencia(id) {
  return request(`/api/frecuencia/${id}`, { method: "DELETE" })
}

/* ── CPK ────────────────────────────────────────────────── */

/** Obtiene todos los registros de CPK */
export async function getCPK() {
  return request("/api/cpk")
}

/** Crea un nuevo registro de CPK */
export async function addCPK(record) {
  return request("/api/cpk", {
    method: "POST",
    body: JSON.stringify(record),
  })
}
