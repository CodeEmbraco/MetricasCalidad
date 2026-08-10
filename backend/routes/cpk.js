/* ============================================================
   routes/cpk.js
   GET  /api/cpk        → lista todos los registros
   POST /api/cpk        → crea un nuevo registro
   ============================================================ */

import express from "express";
import { poolDB as pool, sql } from "../config/db.js";
const router = express.Router();

/* ── GET — Listar todos ─────────────────────────────────── */
router.get("/", async (_req, res, next) => {
  try {
    const result = await pool
      .request()
      .query("SELECT * FROM CPK ORDER BY fecha DESC, created_at DESC")

    // Deserializar el campo muestras (JSON string → array)
    const records = result.recordset.map((r) => ({
      ...r,
      muestras: (() => {
        try { return JSON.parse(r.muestras || "[]") }
        catch { return [] }
      })(),
    }))

    res.json(records)
  } catch (err) {
    next(err)
  }
})

/* ── POST — Crear registro ──────────────────────────────── */
router.post("/", async (req, res, next) => {
  try {
    const r = req.body

    // Validación mínima
    if (!r.familia || !r.componente || !r.caracteristica || !r.fecha) {
      return res.status(400).json({ error: "Campos requeridos faltantes: familia, componente, caracteristica, fecha." })
    }

    const id = r.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 7))
    const muestrasJson = Array.isArray(r.muestras) ? JSON.stringify(r.muestras) : (r.muestras || "[]")

    await pool
      .request()
      .input("id",           sql.NVarChar(20),       id)
      .input("familia",      sql.NVarChar(100),       r.familia)
      .input("componente",   sql.NVarChar(100),       r.componente)
      .input("caracteristica", sql.NVarChar(200),     r.caracteristica)
      .input("maquina",      sql.NVarChar(100),       r.maquina || "-")
      .input("fecha",        sql.Date,                new Date(r.fecha))
      .input("hora",         sql.NVarChar(5),         r.hora || "00:00")
      .input("cp",           sql.Float,               r.cp           || 0)
      .input("cpk",          sql.Float,               r.cpk          || 0)
      .input("lei",          sql.Float,               r.lei          || 0)
      .input("obj",          sql.Float,               r.obj          || 0)
      .input("les",          sql.Float,               r.les          || 0)
      .input("piezasMedidas",sql.Int,                 r.piezasMedidas|| 0)
      .input("porcentaje",   sql.Float,               r.porcentaje   || 0)
      .input("rate",         sql.Float,               r.rate         || 0)
      .input("muestras",     sql.NVarChar(sql.MAX),   muestrasJson)
      .query(`
        INSERT INTO CPK
          (id, familia, componente, caracteristica, maquina, fecha, hora,
           cp, cpk, lei, obj, les, piezasMedidas, porcentaje, rate, muestras)
        VALUES
          (@id, @familia, @componente, @caracteristica, @maquina, @fecha, @hora,
           @cp, @cpk, @lei, @obj, @les, @piezasMedidas, @porcentaje, @rate, @muestras)
      `)

    res.status(201).json({ id, message: "Registro CPK creado correctamente." })
  } catch (err) {
    next(err)
  }
})

export default router;
