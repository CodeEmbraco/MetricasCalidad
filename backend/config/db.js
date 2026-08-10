/* ============================================================
   config/db.js
   Pool de conexiones a SQL Server compartido entre todas las rutas.
   ============================================================ */

import dotenv from "dotenv";
import sql from "mssql";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  server: process.env.DB_SERVER,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT !== "false",
  },
  pool: {
    max: 10,       // máximo de conexiones concurrentes
    min: 2,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 15000,
  requestTimeout: 30000,
};

const infinityConfig = {
  server: process.env.InfinityQS_SERVER,
  port: Number(process.env.InfinityQS_PORT),
  database: process.env.InfinityQS_NAME,
  user: process.env.InfinityQS_USER,
  password: process.env.InfinityQS_PASSWORD,
  options: {
    encrypt: process.env.InfinityQS_ENCRYPT === "true",
    trustServerCertificate: process.env.InfinityQS_TRUST_CERT !== "false",
  },
  pool: {
    max: 10,       // máximo de conexiones concurrentes
    min: 2,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 15000,
  requestTimeout: 30000,
};

// Pool singleton — reutilizado en toda la app
let poolDB;
let poolInfinity;

try {
  const poolDBInstance = new sql.ConnectionPool(config);
  poolDB = await poolDBInstance.connect();
  console.log("[DB] Conexión a SQL Server establecida (APP_WEB_CPK).");
} catch (err) {
  console.error("[DB] Error al conectar con SQL Server:", err.message);
  process.exit(1);
}
try {
  const poolInfinityInstance = new sql.ConnectionPool(infinityConfig);
  poolInfinity = await poolInfinityInstance.connect();
  console.log("[InfinityQS] Conexión a SQL Server establecida (NidecGA_InfinityQS).");
} catch (err) {
  console.error("[InfinityQS] Error al conectar con SQL Server:", err.message);
  process.exit(1);
}
export { poolDB, poolInfinity, sql };

