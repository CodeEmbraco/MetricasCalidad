"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mssql_1 = __importDefault(require("mssql"));
const db_1 = require("../config/db");
const router = (0, express_1.Router)();
// GET /api/mediciones?fecha=YYYY-MM-DD
router.get('/', async (req, res) => {
    try {
        const { fecha } = req.query;
        if (!fecha) {
            return res.status(400).json({ error: 'El parámetro "fecha" es requerido (Formato: YYYY-MM-DD)' });
        }
        const pool = await (0, db_1.getDbConnection)();
        // 1. Ejecutamos el Stored Procedure
        const result = await pool.request()
            .input('FechaBuscada', mssql_1.default.VarChar(10), fecha)
            .execute('dbo.sp_ObtenerReporteMediciones');
        const filasPlanas = result.recordset;
        // 2. Preparamos y segmentamos la información por Familia para el Frontend
        const familias = {};
        filasPlanas.forEach((fila) => {
            const familia = fila.Familia_Producto_PART_GRP || 'Sin Familia';
            if (!familias[familia]) {
                familias[familia] = [];
            }
            familias[familia].push(fila);
        });
        // 3. Enviamos el resultado directo
        return res.json({
            fechaConsulta: fecha,
            totalRegistros: filasPlanas.length,
            familias
        });
    }
    catch (error) {
        console.error('--- ERROR EN BACKEND ---');
        console.error(error);
        return res.status(500).json({
            error: 'Error al consultar la base de datos',
            mensajeReal: error.message, // Esto te dirá la causa exacta en la respuesta HTTP
            detalles: error
        });
    }
});
exports.default = router;
