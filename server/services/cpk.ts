import { Router, Request, Response } from 'express';
import mssql from 'mssql';
import { getDbConnection } from '../config/db';

const router = Router();

router.get('/getCpk', async (req: Request, res: Response) => {
  try {
    const { componente, fechaInicio, fechaFin } = req.query;
    const pool = await getDbConnection();

    let tInicio = fechaInicio 
      ? Math.floor(new Date(`${fechaInicio}T00:00:00`).getTime() / 1000)
      : Math.floor(Date.now() / 1000) - (14 * 24 * 60 * 60);

    let tFin = fechaFin 
      ? Math.floor(new Date(`${fechaFin}T23:59:59`).getTime() / 1000)
      : Math.floor(Date.now() / 1000);

    // Ejecutamos el Stored Procedure compilado
    const result = await pool.request()
      .input('Componente', mssql.VarChar(200), (componente as string) || null)
      .input('TInicio', mssql.Int, tInicio)
      .input('TFin', mssql.Int, tFin)
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
  } catch (error) {
    console.error('Error al ejecutar sp_ObtenerCpkPorComponente:', error);
    return res.status(500).json({ error: 'No se pudo obtener el cálculo de Cpk' });
  }
});

export default router; 