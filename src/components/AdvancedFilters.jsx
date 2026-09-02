import { useMemo } from "react"
import { Filter } from "lucide-react"
import { FAMILIAS, COMPONENTES, MAQUINAS } from "../data/catalog.js"
import MultiSelect from "./MultiSelect.jsx"

/* Filtros maestros compartidos (Módulos 2 y 3).
   state: { desde, hasta, horaDesde, horaHasta, group, familias[], componentes[], caracteristicas[], maquina }
   data: registros para derivar opciones reales dinámicamente */
const GROUPS = [
  { id: "dia", label: "Día" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mes" },
  { id: "año", label: "Año" },
]

export default function AdvancedFilters({ state, setState, data = [], showHora = true }) {
  const set = (patch) => setState((s) => ({ ...s, ...patch }))

  // 1. Extraer opciones únicas de Familia presentes en la data de InfinityQS
  const opcionesFamilias = useMemo(() => {
    if (!data || !data.length) return FAMILIAS
    const setFam = new Set(data.map((r) => r.familia).filter(Boolean))
    return setFam.size > 0 ? Array.from(setFam).sort() : FAMILIAS
  }, [data])

  // 2. Extraer opciones únicas de Componente presentes en la data de InfinityQS
  const opcionesComponentes = useMemo(() => {
    if (!data || !data.length) return COMPONENTES
    const setComp = new Set(data.map((r) => r.componente).filter(Boolean))
    return setComp.size > 0 ? Array.from(setComp).sort() : COMPONENTES
  }, [data])

  // 3. Extraer opciones únicas de Máquina presentes en la data de InfinityQS
  const opcionesMaquinas = useMemo(() => {
    if (!data || !data.length) return MAQUINAS
    const setMaq = new Set(data.map((r) => r.maquina || r.machine).filter(Boolean))
    return setMaq.size > 0 ? Array.from(setMaq).sort() : MAQUINAS
  }, [data])

  // 4. Extraer opciones de Característica dependientes de la Familia/Componente seleccionados
  const caracOptions = useMemo(() => {
    if (!data || !data.length) return []
    const filtrados = data.filter((r) => {
      const pasaFam = !state.familias || state.familias.length === 0 || state.familias.includes(r.familia)
      const pasaComp = !state.componentes || state.componentes.length === 0 || state.componentes.includes(r.componente)
      return pasaFam && pasaComp
    })
    const sel = new Set(filtrados.map((r) => r.caracteristica).filter(Boolean))
    return Array.from(sel).sort()
  }, [data, state.familias, state.componentes])

  return (
    <div className="card mb-4">
      <div className="card-header">
        <div className="row" style={{ gap: 8 }}>
          <Filter size={16} />
          <h3>Filtros Avanzados</h3>
        </div>
      </div>
      <div className="card-body">
        <div className="filter-bar">
          <div className="field">
            <label>Fecha desde</label>
            <input type="date" value={state.desde} onChange={(e) => set({ desde: e.target.value })} />
          </div>
          <div className="field">
            <label>Fecha hasta</label>
            <input type="date" value={state.hasta} onChange={(e) => set({ hasta: e.target.value })} />
          </div>
          <div className="field">
            <label>Agrupación</label>
            <select value={state.group} onChange={(e) => set({ group: e.target.value })}>
              {GROUPS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Máquina */}
          <div className="field">
            <label>Máquina</label>
            <select value={state.maquina || "Todas"} onChange={(e) => set({ maquina: e.target.value })}>
              <option value="Todas">Todas</option>
              {opcionesMaquinas.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <MultiSelect
            label="Familia"
            options={opcionesFamilias}
            value={state.familias}
            onChange={(v) => set({ familias: v })}
            placeholder="Todas"
          />
          <MultiSelect
            label="Componente"
            options={opcionesComponentes}
            value={state.componentes}
            onChange={(v) => set({ componentes: v })}
            placeholder="Todos"
          />
          <MultiSelect
            label="Característica"
            options={caracOptions}
            value={state.caracteristicas}
            onChange={(v) => set({ caracteristicas: v })}
            placeholder="Todas"
          />
        </div>
      </div>
    </div>
  )
}

/* Estado inicial por defecto: Arreglos vacíos = "Mostrar Todos" */
export function defaultFilterState() {
  return {
    desde: "",
    hasta: "",
    horaDesde: "",
    horaHasta: "",
    group: "semana",
    maquina: "Todas",
    familias: [],
    componentes: [],
    caracteristicas: [],
  }
}

/* Aplica los filtros a un arreglo de registros de forma segura */
export function applyFilters(rows, state) {
  if (!rows || !rows.length) return []

  return rows.filter((r) => {
    // Si hay familias seleccionadas explícitamente, filtrar; si está vacío, pasan todas
    if (state.familias && state.familias.length > 0 && !state.familias.includes(r.familia)) {
      return false
    }

    // Si hay componentes seleccionados explícitamente, filtrar; si está vacío, pasan todos
    if (state.componentes && state.componentes.length > 0 && !state.componentes.includes(r.componente)) {
      return false
    }

    // Si hay características seleccionadas, filtrar
    if (state.caracteristicas && state.caracteristicas.length > 0 && !state.caracteristicas.includes(r.caracteristica)) {
      return false
    }

    // Rango de fechas
    if (state.desde && r.fecha < state.desde) return false
    if (state.hasta && r.fecha > state.hasta) return false

    // Filtro condicional para la máquina
    if (state.maquina && state.maquina !== "Todas") {
      const valorMaquina = r.maquina || r.machine
      if (valorMaquina !== state.maquina) return false
    }

    // Rango de horas
    if (r.hora) {
      if (state.horaDesde && r.hora < state.horaDesde) return false
      if (state.horaHasta && r.hora > state.horaHasta) return false
    }

    return true
  })
}