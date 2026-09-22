"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mssql_1 = __importDefault(require("mssql"));
const db_1 = require("../config/db");
const router = (0, express_1.Router)();
// POST /api/frecuencias
router.post('/guardarRegistro', async (req, res) => {
    try {
        const { fecha, familia, componente, maquina, caracteristica, volumen, horas, minutos, tamanoMuestra, frecuencia, medicionesInfinity, totalMuestras, porcentaje, estado } = req.body;
        const pool = await (0, db_1.getDbConnection)();
        // Guardado explícito en la base de datos de la App
        await pool.request()
            .input('Fecha', mssql_1.default.Date, fecha)
            .input('Familia', mssql_1.default.VarChar, familia)
            .input('Componente', mssql_1.default.VarChar, componente)
            .input('Maquina', mssql_1.default.VarChar, maquina)
            .input('Caracteristica', mssql_1.default.VarChar, caracteristica)
            .input('Volumen', mssql_1.default.Int, Number(volumen))
            .input('HorasReales', mssql_1.default.Decimal(5, 2), Number(horas) + Number(minutos) / 60)
            .input('TamanoMuestra', mssql_1.default.Int, Number(tamanoMuestra))
            .input('FrecuenciaMeta', mssql_1.default.Int, Number(frecuencia))
            .input('MedicionesInfinity', mssql_1.default.Int, Number(medicionesInfinity))
            .input('TotalMuestras', mssql_1.default.Int, Number(totalMuestras))
            .input('PorcentajeCumplimiento', mssql_1.default.Decimal(5, 2), Number(porcentaje))
            .input('EstadoSemaforo', mssql_1.default.VarChar, estado)
            .query(`
        INSERT INTO ${process.env.DB_NAME_APP}.dbo.RegistroFrecuencias (
          Fecha, Familia, Componente, Maquina, Caracteristica, 
          Volumen, HorasReales, TamanoMuestra, FrecuenciaMeta, 
          MedicionesInfinity, TotalMuestras, PorcentajeCumplimiento, EstadoSemaforo
        ) VALUES (
          @Fecha, @Familia, @Componente, @Maquina, @Caracteristica, 
          @Volumen, @HorasReales, @TamanoMuestra, @FrecuenciaMeta, 
          @MedicionesInfinity, @TotalMuestras, @PorcentajeCumplimiento, @EstadoSemaforo
        )
      `);
        return res.status(201).json({ success: true, message: 'Registro guardado exitosamente' });
    }
    catch (error) {
        console.error('Error al guardar en BD App:', error);
        return res.status(500).json({ error: 'No se pudo guardar la captura en SQL Server' });
    }
});
router.get('/historial', async (_req, res) => {
    try {
        const pool = await (0, db_1.getDbConnection)();
        const result = await pool.request().query(`
      SELECT 
        Id AS id,
        Fecha AS fecha,
        Familia AS familia,
        Componente AS componente,
        Maquina AS maquina,
        Caracteristica AS caracteristica,
        Volumen AS volumen,
        HorasReales AS horasReales,
        TamanoMuestra AS tamanoMuestra,
        FrecuenciaMeta AS frecuenciaMeta,
        MedicionesInfinity AS medicionesInfinity,
        TotalMuestras AS totalMuestras,
        PorcentajeCumplimiento AS porcentaje,
        EstadoSemaforo AS estado,
        FechaRegistro
      FROM ${process.env.DB_NAME_APP}.dbo.RegistroFrecuencias
      ORDER BY Fecha DESC, Id DESC
    `);
        return res.json(result.recordset);
    }
    catch (error) {
        console.error('Error al consultar historial:', error);
        return res.status(500).json({ error: 'Error al consultar la base de datos' });
    }
});
exports.default = router;
