/* Badge de semáforo reutilizable */
export default function Semaforo({ estado, label }) {
  const text =
    label ??
    { red: "Crítico", yellow: "Alerta", green: "Óptimo" }[estado] ??
    ""
  return (
    <span className={`sem sem-${estado}`}>
      <span className="dot" aria-hidden="true" />
      {text}
    </span>
  )
}
