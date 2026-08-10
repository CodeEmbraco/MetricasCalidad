/* ============================================================
   frontend/src/hooks/useStoreData.js
   Hook que carga los datos desde el backend REST y expone
   un método refresh() para volver a cargar tras mutaciones.
   ============================================================ */

import { useEffect, useState, useCallback } from "react"
import { getFrecuencia, getCPK } from "../data/store.js"

export function useStoreData() {
  const [freq, setFreq]       = useState([])
  const [cpk, setCpk]         = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [freqData, cpkData] = await Promise.all([getFrecuencia(), getCPK()])
      setFreq(freqData)
      setCpk(cpkData)
    } catch (err) {
      console.error("[useStoreData] Error al cargar datos:", err.message)
      setError(err.message || "Error al conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }, [])

  // Carga inicial
  useEffect(() => {
    refresh()
  }, [refresh])

  return { freq, cpk, loading, error, refresh }
}
