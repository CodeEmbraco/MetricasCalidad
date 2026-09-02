import { Router, Request, Response } from 'express';
import mssql from 'mssql';
import { getDbConnection } from '../config/db';

const router = Router();

// GET /api/mediciones?fecha=YYYY-MM-DD
router.get('/', async (req: Request, res: Response) => {
  try {
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({ error: 'El parámetro "fecha" es requerido (Formato: YYYY-MM-DD)' });
    }

    const pool = await getDbConnection();
    
    // 1. Ejecutamos el Stored Procedure
    const result = await pool.request()
      .input('FechaBuscada', mssql.Date, fecha as string)
      .execute('dbo.sp_ObtenerReporteMediciones');

    const filasPlanas = result.recordset;

    // 2. Preparamos y segmentamos la información por Familia para el Frontend
    const familias: Record<string, any[]> = {};

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

  } catch (error) {
    console.error('Error al obtener mediciones:', error);
    return res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
});

export default router;