import { useMemo } from "react"
import { Filter } from "lucide-react"
import { FAMILIAS, COMPONENTES, MAQUINAS } from "../data/catalog.js"
import MultiSelect from "./MultiSelect.jsx"

const GROUPS = [
  { id: "dia", label: "Día" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mes" },
  { id: "año", label: "Año" },
]

export default function AdvancedFilters({ state, setState, data = [], showHora = true }) {
  const set = (patch) => setState((s) => ({ ...s, ...patch }))

  // 1. FAMILIAS: Muestra todas las familias disponibles en los datos
  const opcionesFamilias = useMemo(() => {
    if (!data || !data.length) return FAMILIAS
    const setFam = new Set(data.map((r) => r.familia).filter(Boolean))
    return setFam.size > 0 ? Array.from(setFam).sort() : FAMILIAS
  }, [data])

  // 2. COMPONENTES: Filtra únicamente los componentes pertenecientes a las Familias seleccionadas
  const opcionesComponentes = useMemo(() => {
    if (!data || !data.length) return COMPONENTES
    
    const dataFamilia = data.filter((r) => {
      return !state.familias || state.familias.length === 0 || state.familias.includes(r.familia)
    })

    const setComp = new Set(dataFamilia.map((r) => r.componente).filter(Boolean))
    return setComp.size > 0 ? Array.from(setComp).sort() : COMPONENTES
  }, [data, state.familias])

  // 3. MÁQUINAS: Filtra únicamente las máquinas asociadas a las Familias y Componentes seleccionados
  const opcionesMaquinas = useMemo(() => {
    if (!data || !data.length) return MAQUINAS

    const dataComp = data.filter((r) => {
      const pasaFam = !state.familias || state.familias.length === 0 || state.familias.includes(r.familia)
      const pasaComp = !state.componentes || state.componentes.length === 0 || state.componentes.includes(r.componente)
      return pasaFam && pasaComp
    })

    const setMaq = new Set(dataComp.map((r) => r.maquina || r.machine).filter(Boolean))
    return setMaq.size > 0 ? Array.from(setMaq).sort() : MAQUINAS
  }, [data, state.familias, state.componentes])

  // 4. CARACTERÍSTICAS: Filtra únicamente las características de las Familias, Componentes y Máquina seleccionados
  const caracOptions = useMemo(() => {
    if (!data || !data.length) return []

    const dataMaq = data.filter((r) => {
      const pasaFam = !state.familias || state.familias.length === 0 || state.familias.includes(r.familia)
      const pasaComp = !state.componentes || state.componentes.length === 0 || state.componentes.includes(r.componente)
      const valMaq = r.maquina || r.machine
      const pasaMaq = !state.maquina || state.maquina === "Todas" || valMaq === state.maquina
      return pasaFam && pasaComp && pasaMaq
    })

    const sel = new Set(dataMaq.map((r) => r.caracteristica).filter(Boolean))
    return Array.from(sel).sort()
  }, [data, state.familias, state.componentes, state.maquina])

  // Handlers con limpieza automática al cambiar un nivel superior
  const handleFamiliaChange = (nuevasFamilias) => {
    set({
      familias: nuevasFamilias,
      componentes: [],      // Limpia componentes al cambiar familia
      maquina: "Todas",     // Resetea máquina
      caracteristicas: []   // Limpia características
    })
  }

  const handleComponenteChange = (nuevosComponentes) => {
    set({
      componentes: nuevosComponentes,
      maquina: "Todas",     // Resetea máquina al cambiar componente
      caracteristicas: []   // Limpia características
    })
  }

  const handleMaquinaChange = (nuevaMaquina) => {
    set({
      maquina: nuevaMaquina,
      caracteristicas: []   // Limpia características al cambiar máquina
    })
  }

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

          <MultiSelect
            label="Familia"
            options={opcionesFamilias}
            value={state.familias}
            onChange={handleFamiliaChange}
            placeholder="Todas"
          />

          <MultiSelect
            label="Componente"
            options={opcionesComponentes}
            value={state.componentes}
            onChange={handleComponenteChange}
            placeholder="Todos"
          />

          {/* Selector de Máquina en Cascada */}
          <div className="field">
            <label>Máquina</label>
            <select value={state.maquina || "Todas"} onChange={(e) => handleMaquinaChange(e.target.value)}>
              <option value="Todas">Todas</option>
              {opcionesMaquinas.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

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

/* Estado inicial por defecto */
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

/* Aplica los filtros a un arreglo de registros */
export function applyFilters(rows, state) {
  if (!rows || !rows.length) return []

  return rows.filter((r) => {
    if (state.familias && state.familias.length > 0 && !state.familias.includes(r.familia)) {
      return false
    }

    if (state.componentes && state.componentes.length > 0 && !state.componentes.includes(r.componente)) {
      return false
    }

    if (state.maquina && state.maquina !== "Todas") {
      const valorMaquina = r.maquina || r.machine
      if (valorMaquina !== state.maquina) return false
    }

    if (state.caracteristicas && state.caracteristicas.length > 0 && !state.caracteristicas.includes(r.caracteristica)) {
      return false
    }

    if (state.desde && r.fecha < state.desde) return false
    if (state.hasta && r.fecha > state.hasta) return false

    if (r.hora) {
      if (state.horaDesde && r.hora < state.horaDesde) return false
      if (state.horaHasta && r.hora > state.horaHasta) return false
    }

    return true
  })
}