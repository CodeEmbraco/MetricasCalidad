import { useEffect, useState, useCallback } from "react"
import Layout from "./components/Layout.jsx"
import LoginModal from "./components/loginModal.jsx"
import { seedIfEmpty } from "./data/store.js"
import FrecuenciaMedicion from "./modules/frecuencia/FrecuenciaMedicion.jsx"
import AnalisisCPK from "./modules/cpk/AnalisisCPK.jsx"
import ReportesConsolidados from "./modules/reportes/ReportesConsolidados.jsx"

const TIEMPO_INACTIVIDAD = 15 * 60 * 1000; // 15 minutos

export default function App() {
  const [active, setActive] = useState("frecuencia")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const handleLogout = useCallback(() => {
    localStorage.removeItem("nidec_auth_token")
    localStorage.removeItem("nidec_username")
    setIsAuthenticated(false)
  }, [])

  useEffect(() => {
    seedIfEmpty()
    const token = localStorage.getItem("nidec_auth_token")
    if (token) {
      setIsAuthenticated(true)
    }
    setCheckingAuth(false)
  }, [])

  // Timer de inactividad opcional
  useEffect(() => {
    if (!isAuthenticated) return;
    let timeoutId;
    const reiniciarTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        alert("Tu sesión ha expirado por inactividad.");
        handleLogout();
      }, TIEMPO_INACTIVIDAD);
    };

    const eventos = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    eventos.forEach((evento) => window.addEventListener(evento, reiniciarTimer));
    reiniciarTimer();

    return () => {
      clearTimeout(timeoutId);
      eventos.forEach((evento) => window.removeEventListener(evento, reiniciarTimer));
    };
  }, [isAuthenticated, handleLogout]);

  if (checkingAuth) return null

  return (
    <>
      {!isAuthenticated && (
        <LoginModal 
          onLoginSuccess={() => setIsAuthenticated(true)} 
        />
      )}

      <div style={{ 
        filter: !isAuthenticated ? "blur(4px)" : "none", 
        pointerEvents: !isAuthenticated ? "none" : "auto", 
        height: "100%" 
      }}>
        <Layout 
          active={active} 
          onChange={setActive} 
          onLogout={handleLogout}
          isAuthenticated={isAuthenticated}
        >
          {active === "frecuencia" && <FrecuenciaMedicion />}
          {active === "cpk" && <AnalisisCPK />}
          {active === "reportes" && <ReportesConsolidados />}
        </Layout>
      </div>
    </>
  )
}