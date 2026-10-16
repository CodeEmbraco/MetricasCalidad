import { useTheme } from "../context/ThemeContext.jsx"
import { Gauge, Activity, FileBarChart, Sun, Moon, LogOut } from "lucide-react"

const MODULES = [
  { id: "frecuencia", label: "Frecuencia de Medición", icon: Gauge },
  { id: "cpk", label: "Análisis de CPK", icon: Activity },
  { id: "reportes", label: "Reportes Consolidados", icon: FileBarChart },
]

const TITLES = {
  frecuencia: { t: "Frecuencia de Medición", s: "Captura y consulta de cumplimiento de mediciones" },
  cpk: { t: "Análisis de CPK", s: "Análisis estadístico avanzado de capacidad de proceso" },
  reportes: { t: "Reportes Consolidados", s: "Analítica unificada para la toma de decisiones" },
}

export default function Layout({ active, onChange, children, onLogout, isAuthenticated }) {
  const { theme, toggle } = useTheme()
  const title = TITLES[active]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-mark">N</div>
          <div className="brand-text">
            <strong>Métricas de Calidad</strong>
            <span>Nidec Appliance</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Módulos</div>
          {MODULES.map((m) => {
            const Icon = m.icon
            return (
              <button
                key={m.id}
                className={`nav-item ${active === m.id ? "active" : ""}`}
                onClick={() => onChange(m.id)}
              >
                <Icon size={18} />
                {m.label}
              </button>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          © 2026 Nidec ACIM Embraco Mty. Todos los derechos reservados. Departamento TI COLD MÉXICO
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div>
            <h1>{title.t}</h1>
            <div className="topbar-sub">{title.s}</div>
          </div>
          
          {/* Contenedor derecho de la Topbar */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button className="theme-toggle" onClick={toggle} aria-label="Cambiar tema">
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              {theme === "light" ? "Modo Oscuro" : "Modo Claro"}
            </button>

            {/* Botón de Cerrar Sesión (Solo aparece si está autenticado) */}
            {isAuthenticated && (
              <button 
                className="theme-toggle" 
                onClick={onLogout} 
                aria-label="Cerrar sesión"
                style={{ color: "var(--sem-red)", borderColor: "var(--border)" }}
                title="Cerrar sesión"
              >
                <LogOut size={16} />
                <span>Salir</span>
              </button>
            )}
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}