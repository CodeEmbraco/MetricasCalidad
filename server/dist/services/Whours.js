"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
let whrsCache = {};
// 1. ENDPOINT PARA EL FRONTEND
router.get('/getWhrs', (req, res) => {
    const { proceso, dia } = req.query;
    if (!proceso) {
        return res.status(400).json({ error: 'El parámetro "proceso" es obligatorio.' });
    }
    const diaTarget = dia
        ? String(dia).padStart(2, '0')
        : String(new Date().getDate()).padStart(2, '0');
    const key = `${String(proceso).trim().toUpperCase()}_${String(diaTarget).trim()}`;
    const whrsValue = whrsCache[key] ?? 0;
    return res.json({
        proceso,
        dia: diaTarget,
        whrs: whrsValue
    });
});
// 2. ENDPOINT PARA RECIBIR DATOS DESDE GOOGLE APPS SCRIPT
router.post('/syncWhrs', (req, res) => {
    const secretKey = req.headers['x-api-key'];
    // Imprimir en consola para depurar
    console.log('--- Nueva petición de sincronización recibida ---');
    console.log('Header X-API-KEY recibido:', secretKey);
    console.log('MY_SECRET_KEY esperada:', process.env.MY_SECRET_KEY);
    // Validar la API Key
    if (secretKey !== process.env.MY_SECRET_KEY) {
        console.error('❌ Error: La API Key no coincide');
        return res.status(401).json({ error: 'Acceso no autorizado' });
    }
    const { data } = req.body;
    if (!data || !Array.isArray(data)) {
        console.error('❌ Error: El formato del body no es un arreglo válido:', req.body);
        return res.status(400).json({ error: 'Formato de datos inválido' });
    }
    data.forEach((item) => {
        if (item.proceso && item.dia) {
            const key = `${String(item.proceso).trim().toUpperCase()}_${String(item.dia).trim()}`;
            whrsCache[key] = item.whrs;
        }
    });
    console.log('✅ Sincronización exitosa. Registros cargados:', Object.keys(whrsCache).length);
    return res.json({ status: 'success', message: 'Datos actualizados en Node.js' });
});
exports.default = router;
