/* ============================================================
   server.js — Punto de entrada del backend
   ============================================================ */

import express from "express";
import cors from "cors";
import { poolDB } from "./config/db.js";

import frecuenciaRouter from "./routes/frecuencia.js";
import cpkRouter from "./routes/cpk.js";

const app = express()
const PORT = process.env.PORT || 3001

/* ── Middlewares ─────────────────────────────────────────── */
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origen (curl, Postman, mismo servidor)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`CORS bloqueado para el origen: ${origin}`))
      }
    },
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
)

app.use(express.json())

/* ── Health check ────────────────────────────────────────── */
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

/* ── Rutas ───────────────────────────────────────────────── */
app.use("/api/frecuencia", frecuenciaRouter)
app.use("/api/cpk", cpkRouter)

/* ── Manejador de errores global ─────────────────────────── */
app.use((err, _req, res, _next) => {
  console.error("[API Error]", err.message)
  res.status(500).json({ error: err.message || "Error interno del servidor" })
})

/* ── Arrancar el servidor ───────────────────────────────── */
app.listen(PORT, () => {
  console.log(`[API] Servidor corriendo en http://localhost:${PORT}`)
})
