/* ============================================================
   db/seed.js
   Inicializa los datos de catálogo de producción (Familia, Maquina,
   Componente, Caracteristica).
   Es idempotente: no inserta si la tabla Familia ya contiene datos.
   Ejecutar con: npm run seed
   ============================================================ */

import { poolDB as pool, sql } from "../config/db.js";

/* ── CONFIGURACIÓN DEL CATÁLOGO ──────────────────────────── */

const FAMILIAS = [
  "Compresores ES",
  "Cooling",
  "ECM Fan Insinkerator",
  "Rotor Wet",
  "Electronics"
];

const COMPONENTES = ["Crankcase", "Piston", "Crankshaft"];

// Configuración de Máquinas con su respectivo Epoch ID de InfinityQS
const MAQUINAS_CONFIG = [
  { texto: "MX3MANCAL040", infinityId: 0 }, // Reemplazar con Epoch real
  { texto: "MX3CILINDRO040", infinityId: 0 },
  { texto: "MX3CSH030", infinityId: 0 },
  { texto: "MX3PISTON020", infinityId: 0 },
  { texto: "MX3CS010", infinityId: 0 },
  { texto: "MX3CS020", infinityId: 0 },
  { texto: "L2CSH015", infinityId: 0 },
  { texto: "MX3CSH040", infinityId: 0 },
  { texto: "MX3CSH050", infinityId: 0 },
  { texto: "MX3CSH035", infinityId: 0 },
  { texto: "MX3CS030", infinityId: 0 },
  { texto: "MX3PH020", infinityId: 0 },

];

// Características de la familia Compresores ES
const CARACTERISTICAS_ES = {
  Crankcase: {
    MX3MANCAL040: [
      { texto: "Circularidad Mancal ES 2mm", idInfinity: 0 },
      { texto: "Circularidad Mancal ES 10mm", idInfinity: 0 },
      { texto: "Circularidad Mancal ES 28mm", idInfinity: 0 },
      { texto: "Circularidad Mancal ES 33.5mm", idInfinity: 0 },
      { texto: "Cilindricidad Mancal ES", idInfinity: 0 },
      { texto: "Rugosidad Mancal ES", idInfinity: 0 }
    ],
    MX3CILINDRO040: [
      { texto: "Circularidad Cilindro Recto 8mm", idInfinity: 0 },
      { texto: "Rugosidad Cilindro ES", idInfinity: 0 },
      { texto: "Perpendicularidad Cil vs Top", idInfinity: 0 },
      { texto: "Perpendicularidad Cil vs Mancal", idInfinity: 0 },
      { texto: "Chaflán de Cilindro ES", idInfinity: 0 }
    ]
  },
  Piston: {
    MX3PISTON020: [
      { texto: "Perpendicularidad Orificio vs Diámetro", idInfinity: 0 },
      { texto: "Diámetro Barreno Piston L1 ES", idInfinity: 0 },
      { texto: "Diámetro Barreno Piston L2 ES", idInfinity: 0 },
      { texto: "Rugosidad de Topo ES", idInfinity: 0 },
      { texto: "Circularidad Piston Topo ES", idInfinity: 0 },
      { texto: "Circularidad Pistón Saia ES", idInfinity: 0 },
      { texto: "Espesor Piston", idInfinity: 0 }
    ]
  },
  Crankshaft: {
    MX3CSH030: [
      { texto: "Circularidad Cuerpo ES 8mm", idInfinity: 0 },
      { texto: "Circularidad Cuerpo ES 45mm", idInfinity: 0 },
      { texto: "Cilindricidad Cuerpo ES", idInfinity: 0 },
      { texto: "Rugosidad de Cuerpo ES (Antes)", idInfinity: 0 },
      { texto: "Rugosidad de Cuerpo ES (Después)", idInfinity: 0 },
      { texto: "Circularidad Excentric 11.8 ES", idInfinity: 0 },
      { texto: "Cilindricidad Excéntrico ES", idInfinity: 0 },
      { texto: "Paralelismo Cpo vs Exc", idInfinity: 0 },
      { texto: "Rugosidad Exc. ES (Antes)", idInfinity: 0 },
      { texto: "Rugosidad Exc. ES (Después)", idInfinity: 0 },
      { texto: "Run Out del axial", idInfinity: 0 },
      { texto: "Espesor Eje", idInfinity: 0 }
    ]
  }
};

// Características genéricas para el resto de las familias (Cooling, ECM Fan Insinkerator, Rotor Wet, Electronics)
const CARACTERISTICAS_GENERICO = {
  Crankcase: {
    MX3MANCAL040: [
      { texto: "Circularidad", idInfinity: 0 },
      { texto: "Cilindricidad", idInfinity: 0 },
      { texto: "Rugosidad", idInfinity: 0 },
      { texto: "Perpendicularidad", idInfinity: 0 }
    ],
    MX3CILINDRO040: [
      { texto: "Circularidad", idInfinity: 0 },
      { texto: "Cilindricidad", idInfinity: 0 },
      { texto: "Rugosidad", idInfinity: 0 },
      { texto: "Perpendicularidad", idInfinity: 0 }
    ]
  },
  Piston: {
    MX3PISTON020: [
      { texto: "Diámetro", idInfinity: 0 },
      { texto: "Circularidad", idInfinity: 0 },
      { texto: "Espesor", idInfinity: 0 },
      { texto: "Rugosidad", idInfinity: 0 }
    ]
  },
  Crankshaft: {
    MX3CSH030: [
      { texto: "Circularidad Cuerpo", idInfinity: 0 },
      { texto: "Cilindricidad", idInfinity: 0 },
      { texto: "Run Out", idInfinity: 0 },
      { texto: "Espesor Eje", idInfinity: 0 }
    ]
  }
};

async function seed() {
  try {
    await pool;
    console.log("[seed] Conexión establecida.");

    // 1. Comprobación de idempotencia: Verificar si ya hay familias registradas
    const checkFamilia = await pool.request().query("SELECT COUNT(*) AS cnt FROM Familia");
    const familiaCount = checkFamilia.recordset[0].cnt;

    if (familiaCount > 0) {
      console.log(`[seed] Ya existen registros de catálogo en la base de datos (Familias: ${familiaCount}). Sin cambios.`);
      return;
    }

    console.log("[seed] Iniciando inicialización de catálogo productivo...");

    // 2. Insertar Familias y mapear sus IDs
    const familiaMap = {};
    for (const fam of FAMILIAS) {
      const result = await pool.request()
        .input("nombre", sql.NVarChar(100), fam)
        .query("INSERT INTO Familia (Nombre) OUTPUT INSERTED.Id VALUES (@nombre)");

      const idGenerado = result.recordset[0].Id;
      familiaMap[fam] = idGenerado;
      console.log(`  - Familia insertada: "${fam}" (ID: ${idGenerado})`);
    }

    // 3. Insertar Máquinas para cada familia y mapear sus IDs
    const maquinaMap = {}; // Clave: "FamiliaNombre_MaquinaTexto" -> ID de la base de datos
    for (const fam of FAMILIAS) {
      const familiaId = familiaMap[fam];
      for (const maq of MAQUINAS_CONFIG) {
        const result = await pool.request()
          .input("infinityId", sql.Int, maq.infinityId)
          .input("texto", sql.NVarChar(100), maq.texto)
          .input("familiaId", sql.Int, familiaId)
          .query(`
            INSERT INTO Maquina (InfinityId, Texto, FamiliaId) 
            OUTPUT INSERTED.Id 
            VALUES (@infinityId, @texto, @familiaId)
          `);

        const idGenerado = result.recordset[0].Id;
        const key = `${fam}_${maq.texto}`;
        maquinaMap[key] = idGenerado;
      }
      console.log(`  - Máquinas insertadas para la familia: "${fam}"`);
    }

    // 4. Insertar Componentes para cada familia y mapear sus IDs
    const componenteMap = {}; // Clave: "FamiliaNombre_ComponenteNombre" -> ID de la base de datos
    for (const fam of FAMILIAS) {
      const familiaId = familiaMap[fam];
      for (const comp of COMPONENTES) {
        const result = await pool.request()
          .input("familiaId", sql.Int, familiaId)
          .input("nombre", sql.NVarChar(100), comp)
          .query(`
            INSERT INTO Componente (FamiliaId, Nombre) 
            OUTPUT INSERTED.Id 
            VALUES (@familiaId, @nombre)
          `);

        const idGenerado = result.recordset[0].Id;
        const key = `${fam}_${comp}`;
        componenteMap[key] = idGenerado;
      }
      console.log(`  - Componentes insertados para la familia: "${fam}"`);
    }

    // 5. Insertar Características
    console.log("[seed] Insertando características...");

    for (const fam of FAMILIAS) {
      const config = fam === "Compresores ES" ? CARACTERISTICAS_ES : CARACTERISTICAS_GENERICO;

      for (const [compName, machinesObj] of Object.entries(config)) {
        const compKey = `${fam}_${compName}`;
        const componenteId = componenteMap[compKey];

        for (const [maqTexto, features] of Object.entries(machinesObj)) {
          const maqKey = `${fam}_${maqTexto}`;
          const maquinaId = maquinaMap[maqKey];

          for (const feat of features) {
            await pool.request()
              .input("componenteId", sql.Int, componenteId)
              .input("maquinaId", sql.Int, maquinaId)
              .input("texto", sql.NVarChar(200), feat.texto)
              .input("idInfinity", sql.Int, feat.idInfinity)
              .query(`
                INSERT INTO Caracteristica (ComponenteId, MaquinaId, Texto, IdInfinity)
                VALUES (@componenteId, @maquinaId, @texto, @idInfinity)
              `);
          }
        }
      }
      console.log(`  - Características insertadas para la familia: "${fam}"`);
    }

    console.log("[seed] ✅ Inicialización de catálogo completada correctamente.");
  } catch (err) {
    console.error("[seed] ❌ Error durante la inicialización:", err.message);
    process.exit(1);
  } finally {
    await pool.close();
    process.exit(0);
  }
}

seed();
