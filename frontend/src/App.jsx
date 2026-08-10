import { useEffect, useState } from "react"
import Layout from "./components/Layout.jsx"
import { seedIfEmpty } from "./data/store.js"
import FrecuenciaMedicion from "./modules/frecuencia/FrecuenciaMedicion.jsx"
import AnalisisCPK from "./modules/cpk/AnalisisCPK.jsx"
import ReportesConsolidados from "./modules/reportes/ReportesConsolidados.jsx"

export default function App() {
  const [active, setActive] = useState("frecuencia")

  useEffect(() => {
    seedIfEmpty()
  }, [])

  return (
    <Layout active={active} onChange={setActive}>
      {active === "frecuencia" && <FrecuenciaMedicion />}
      {active === "cpk" && <AnalisisCPK />}
      {active === "reportes" && <ReportesConsolidados />}
    </Layout>
  )
}
