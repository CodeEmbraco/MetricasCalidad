"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mssql_1 = __importDefault(require("mssql"));
const db_1 = require("../config/db");
const router = (0, express_1.Router)();
router.get('/getCpk', async (req, res) => {
    try {
        const { componente, fechaInicio, fechaFin } = req.query;
        const pool = await (0, db_1.getDbConnection)();
        let tInicio = fechaInicio
            ? Math.floor(new Date(`${fechaInicio}T00:00:00`).getTime() / 1000)
            : Math.floor(Date.now() / 1000) - (14 * 24 * 60 * 60);
        let tFin = fechaFin
            ? Math.floor(new Date(`${fechaFin}T23:59:59`).getTime() / 1000)
            : Math.floor(Date.now() / 1000);
        // Ejecutamos el Stored Procedure compilado
        const result = await pool.request()
            .input('Componente', mssql_1.default.VarChar(200), componente || null)
            .input('TInicio', mssql_1.default.Int, tInicio)
            .input('TFin', mssql_1.default.Int, tFin)
            .execute('sp_ObtenerCpkPorComponente');
        const cpkData = result.recordset
            .filter((row) => row.USL !== null && row.LSL !== null && Math.abs(row.USL) < 900)
            .map((row) => {
            const rawCpk = Number(row.CpkCalculado) || 0;
            const cpkSanitizado = rawCpk < 0 ? 0 : rawCpk > 10 ? 10 : rawCpk;
            return {
                familia: row.Familia,
                componente: row.Componente,
                caracteristica: row.Caracteristica,
                maquina: row.Maquina || "-",
                cpk: Number(cpkSanitizado.toFixed(3)),
                cp: Number(cpkSanitizado.toFixed(3)),
                les: Number(row.USL) || 0,
                lei: Number(row.LSL) || 0,
                media: Number(row.Media) || 0,
                desviacion: Number(row.DesviacionEstandar) || 0,
                totalMuestras: row.TotalMediciones,
                fecha: row.FechaReal,
                muestras: []
            };
        });
        return res.json(cpkData);
    }
    catch (error) {
        console.error('Error al ejecutar sp_ObtenerCpkPorComponente:', error);
        return res.status(500).json({ error: 'No se pudo obtener el cálculo de Cpk' });
    }
});
exports.default = router;
