/* ===========================================================
   Catálogo jerárquico: Familia -> Componente -> Característica
   =========================================================== */

export const FAMILIAS = [
  "Compresores ES",
  "Cooling",
  "ECM Fan Insinkerator",
  "Rotor Wet",
  "Electronics",
]

export const COMPONENTES = ["Crankcase", "Piston", "Crankshaft"]

/* Catálogo de Máquinas asociadas a las líneas de producción */
export const MAQUINAS = [
  "MX3MANCAL040",
  "MX3CILINDRO040",
  "MX3CSH030",
  "MX3PISTON020",
]

const CARACTERISTICAS_ES = {
  Crankcase: [
    "Circularidad Mancal ES 2mm",
    "Circularidad Mancal ES 10mm",
    "Circularidad Mancal ES 28mm",
    "Circularidad Mancal ES 33.5mm",
    "Cilindricidad Mancal ES",
    "Rugosidad Mancal ES",
    "Circularidad Cilindro Recto 8mm",
    "Rugosidad Cilindro ES",
    "Perpendicularidad Cil vs Top",
    "Perpendicularidad Cil vs Mancal",
    "Chaflán de Cilindro ES",
  ],
  Piston: [
    "Perpendicularidad Orificio vs Diámetro",
    "Diámetro Barreno Piston L1 ES",
    "Diámetro Barreno Piston L2 ES",
    "Rugosidad de Topo ES",
    "Circularidad Piston Topo ES",
    "Circularidad Pistón Saia ES",
    "Espesor Piston",
  ],
  Crankshaft: [
    "Circularidad Cuerpo ES 8mm",
    "Circularidad Cuerpo ES 45mm",
    "Cilindricidad Cuerpo ES",
    "Rugosidad de Cuerpo ES (Antes)",
    "Rugosidad de Cuerpo ES (Después)",
    "Circularidad Excentric 11.8 ES",
    "Cilindricidad Excéntrico ES",
    "Paralelismo Cpo vs Exc",
    "Rugosidad Exc. ES (Antes)",
    "Rugosidad Exc. ES (Después)",
    "Run Out del axial",
    "Espesor Eje",
  ],
}

const CARACTERISTICAS_GENERICO = {
  Crankcase: ["Circularidad", "Cilindricidad", "Rugosidad", "Perpendicularidad"],
  Piston: ["Diámetro", "Circularidad", "Espesor", "Rugosidad"],
  Crankshaft: ["Circularidad Cuerpo", "Cilindricidad", "Run Out", "Espesor Eje"],
}

export function getCaracteristicas(familia, componente) {
  if (!familia || !componente) return []
  if (familia === "Compresores ES") {
    return CARACTERISTICAS_ES[componente] || []
  }
  return CARACTERISTICAS_GENERICO[componente] || []
}

export function getAllCaracteristicas() {
  const set = new Set()
  ;[...Object.values(CARACTERISTICAS_ES), ...Object.values(CARACTERISTICAS_GENERICO)].forEach((arr) =>
    arr.forEach((c) => set.add(c)),
  )
  return Array.from(set)
}
