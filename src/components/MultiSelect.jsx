import { useEffect, useRef, useState } from "react"
import { ChevronDown, Check } from "lucide-react"

/* Selector múltiple con opción "Seleccionar todos".
   value: array de seleccionados; options: array de strings */
export default function MultiSelect({ label, options, value, onChange, placeholder = "Seleccionar..." }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const allSelected = options.length > 0 && value.length === options.length

  function toggleAll() {
    onChange(allSelected ? [] : [...options])
  }

  function toggle(opt) {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt))
    else onChange([...value, opt])
  }

  const summary = allSelected
    ? "Todos"
    : value.length === 0
      ? placeholder
      : value.length === 1
        ? value[0]
        : `${value.length} seleccionados`

  return (
    <div className="field">
      {label && <label>{label}</label>}
      <div className="multiselect" ref={ref}>
        <button type="button" className="multiselect-trigger" onClick={() => setOpen((o) => !o)}>
          <span className={value.length === 0 ? "placeholder" : ""}>{summary}</span>
          <ChevronDown size={16} />
        </button>
        {open && (
          <div className="multiselect-panel">
            <label className="ms-option" style={{ fontWeight: 700 }}>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              Seleccionar todos
            </label>
            <div className="ms-divider" />
            {options.map((opt) => (
              <label className="ms-option" key={opt}>
                <input type="checkbox" checked={value.includes(opt)} onChange={() => toggle(opt)} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {value.includes(opt) && <Check size={13} />}
                  {opt}
                </span>
              </label>
            ))}
            {options.length === 0 && (
              <div style={{ padding: "10px", fontSize: 12, color: "var(--text-faint)" }}>Sin opciones</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
