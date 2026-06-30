import { useState } from "react"
import { PlusCircle, Search } from "lucide-react"
import CapturaForm from "./CapturaForm.jsx"
import ConsultaPanel from "./ConsultaPanel.jsx"

export default function FrecuenciaMedicion() {
  const [tab, setTab] = useState("captura")

  return (
    <div>
      <div className="tabs">
        <button className={`tab ${tab === "captura" ? "active" : ""}`} onClick={() => setTab("captura")}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <PlusCircle size={16} /> Captura
          </span>
        </button>
        <button className={`tab ${tab === "consulta" ? "active" : ""}`} onClick={() => setTab("consulta")}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Search size={16} /> Consulta e Historial
          </span>
        </button>
      </div>

      {tab === "captura" ? <CapturaForm /> : <ConsultaPanel />}
    </div>
  )
}
