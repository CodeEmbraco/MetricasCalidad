import { useMemo } from "react"
import { Filter } from "lucide-react"
import { FAMILIAS, COMPONENTES, MAQUINAS } from "../data/catalog.js"
import MultiSelect from "./MultiSelect.jsx"

/* Filtros maestros compartidos (Módulos 2 y 3).
   state: { desde, hasta, horaDesde, horaHasta, group, familias[], componentes[], caracteristicas[], maquina }
   data: registros para derivar opciones de característica */
const GROUPS = [
  { id: "dia", label: "Día" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mes" },
  { id: "anio", label: "Año" },
]

export default function AdvancedFilters({ state, setState, data, showHora = true }) {
  const set = (patch) => setState((s) => ({ ...s, ...patch }))

  const caracOptions = useMemo(() => {
    const sel = new Set(
      data
        .filter((r) => state.familias.includes(r.familia) && state.componentes.includes(r.componente))
        .map((r) => r.caracteristica),
    )
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
          {showHora && (
            <>
              <div className="field">
                <label>Hora desde</label>
                <input type="time" value={state.horaDesde} onChange={(e) => set({ horaDesde: e.target.value })} />
              </div>
              <div className="field">
                <label>Hora hasta</label>
                <input type="time" value={state.horaHasta} onChange={(e) => set({ horaHasta: e.target.value })} />
              </div>
            </>
          )}
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

          {/* Selector de Máquina — NUEVO CAMPO AÑADIDO */}
          <div className="field">
            <label>Máquina</label>
            <select value={state.maquina || "Todas"} onChange={(e) => set({ maquina: e.target.value })}>
              <option value="Todas">Todas</option>
              {MAQUINAS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <MultiSelect
            label="Familia"
            options={FAMILIAS}
            value={state.familias}
            onChange={(v) => set({ familias: v })}
          />
          <MultiSelect
            label="Componente"
            options={COMPONENTES}
            value={state.componentes}
            onChange={(v) => set({ componentes: v })}
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

/* Estado inicial por defecto — Modificado para incluir 'maquina' */
export function defaultFilterState() {
  return {
    desde: "",
    hasta: "",
    horaDesde: "",
    horaHasta: "",
    group: "semana",
    maquina: "Todas", // Inicializado en "Todas" por defecto
    familias: [...FAMILIAS],
    componentes: [...COMPONENTES],
    caracteristicas: [],
  }
}

/* Aplica los filtros a un arreglo de registros — Modificado para validar Máquina */
export function applyFilters(rows, state) {
  return rows.filter((r) => {
    if (!state.familias.includes(r.familia)) return false
    if (!state.componentes.includes(r.componente)) return false
    if (state.caracteristicas.length > 0 && !state.caracteristicas.includes(r.caracteristica)) return false
    if (state.desde && r.fecha < state.desde) return false
    if (state.hasta && r.fecha > state.hasta) return false
    
    // Filtro condicional para la máquina (Valida r.maquina o r.machine de forma segura)
    if (state.maquina && state.maquina !== "Todas") {
      const valorMaquina = r.maquina || r.machine
      if (valorMaquina !== state.maquina) return false
    }

    if (r.hora) {
      if (state.horaDesde && r.hora < state.horaDesde) return false
      if (state.horaHasta && r.hora > state.horaHasta) return false
    }
    return true
  })
}