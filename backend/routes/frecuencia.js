/* ============================================================
   routes/frecuencia.js
   GET    /api/frecuencia        → lista todos los registros
   POST   /api/frecuencia        → crea un nuevo registro
   DELETE /api/frecuencia/:id    → elimina por ID
   ============================================================ */

import express from "express";
import { poolDB as pool, sql } from "../config/db.js";
const router = express.Router();

/* ── GET — Listar todos ─────────────────────────────────── */
router.get("/", async (_req, res, next) => {
  try {
    const result = await pool
      .request()
      .query("SELECT * FROM Frecuencia ORDER BY fecha DESC, created_at DESC")

    // Devolver los campos con los mismos nombres que el frontend espera
    res.json(result.recordset)
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

    // Generar ID si no viene del cliente
    const id = r.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 7))

    await pool
      .request()
      .input("id",                sql.NVarChar(20),  id)
      .input("familia",           sql.NVarChar(100), r.familia)
      .input("componente",        sql.NVarChar(100), r.componente)
      .input("caracteristica",    sql.NVarChar(200), r.caracteristica)
      .input("maquina",           sql.NVarChar(100), r.maquina || "-")
      .input("fecha",             sql.Date,          new Date(r.fecha))
      .input("volumen",           sql.Int,           r.volumen           || 0)
      .input("horas",             sql.Int,           r.horas             || 0)
      .input("minutos",           sql.Int,           r.minutos           || 0)
      .input("horasDec",          sql.Float,         r.horasDec          || 0)
      .input("rate",              sql.Float,         r.rate              || 0)
      .input("tamanoMuestra",     sql.Int,           r.tamanoMuestra     || 0)
      .input("frecuencia",        sql.Int,           r.frecuencia        || 0)
      .input("piezasHora",        sql.Float,         r.piezasHora        || 0)
      .input("totalMuestras",     sql.Int,           r.totalMuestras     || 0)
      .input("medicionesInfinity",sql.Int,           r.medicionesInfinity|| 0)
      .input("porcentaje",        sql.Float,         r.porcentaje        || 0)
      .query(`
        INSERT INTO Frecuencia
          (id, familia, componente, caracteristica, maquina, fecha,
           volumen, horas, minutos, horasDec, rate,
           tamanoMuestra, frecuencia, piezasHora, totalMuestras,
           medicionesInfinity, porcentaje)
        VALUES
          (@id, @familia, @componente, @caracteristica, @maquina, @fecha,
           @volumen, @horas, @minutos, @horasDec, @rate,
           @tamanoMuestra, @frecuencia, @piezasHora, @totalMuestras,
           @medicionesInfinity, @porcentaje)
      `)

    res.status(201).json({ id, message: "Registro creado correctamente." })
  } catch (err) {
    next(err)
  }
})

/* ── DELETE — Eliminar por ID ───────────────────────────── */
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params

    const result = await pool
      .request()
      .input("id", sql.NVarChar(20), id)
      .query("DELETE FROM Frecuencia WHERE id = @id")

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: `Registro con id "${id}" no encontrado.` })
    }

    res.json({ message: `Registro ${id} eliminado.` })
  } catch (err) {
    next(err)
  }
})

export default router;
