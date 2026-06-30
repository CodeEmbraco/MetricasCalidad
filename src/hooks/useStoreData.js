import { useEffect, useState, useCallback } from "react"
import { getFrecuencia, getCPK } from "../data/store.js"

/* Suscribe a cambios del almacén local y re-renderiza */
export function useStoreData() {
  const [freq, setFreq] = useState(() => getFrecuencia())
  const [cpk, setCpk] = useState(() => getCPK())

  const refresh = useCallback(() => {
    setFreq(getFrecuencia())
    setCpk(getCPK())
  }, [])

  useEffect(() => {
    window.addEventListener("mc-data-changed", refresh)
    return () => window.removeEventListener("mc-data-changed", refresh)
  }, [refresh])

  return { freq, cpk, refresh }
}
