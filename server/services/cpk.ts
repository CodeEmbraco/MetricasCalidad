import { Router, Request, Response } from 'express';
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

    const sqlQuery = `
      WITH SubgruposRecientes AS (
          SELECT 
              F_SGRP, F_PART, F_PRCS, F_CRTM,
              -- Convertir Timestamp UNIX a fecha real YYYY-MM-DD
              CONVERT(VARCHAR(10), DATEADD(s, F_CRTM, '1970-01-01'), 120) AS FechaReal
          FROM SGRP_INF WITH (NOLOCK)
          WHERE F_CRTM >= ${tInicio} AND F_CRTM <= ${tFin}
      ),
      MedicionesConLimites AS (
          SELECT 
              SR.FechaReal,
              P.F_NAME AS Componente,
              T.F_NAME AS Caracteristica,
              PR.F_NAME AS Maquina,
              ST.F_VAL AS ValorMedido,
              SL.F_USL AS USL,
              SL.F_LSL AS LSL
          FROM SubgruposRecientes SR
          INNER JOIN SGRP_TST ST WITH (NOLOCK) ON SR.F_SGRP = ST.F_SGRP
          INNER JOIN PART_DAT P  WITH (NOLOCK) ON SR.F_PART = P.F_PART
          INNER JOIN TEST_DAT T  WITH (NOLOCK) ON ST.F_TEST = T.F_TEST
          INNER JOIN PRCS_DAT PR WITH (NOLOCK) ON SR.F_PRCS = PR.F_PRCS
          LEFT JOIN SPEC_LIM SL  WITH (NOLOCK) ON T.F_TEST = SL.F_TEST AND (SL.F_PART = P.F_PART OR SL.F_PART = 0)
          WHERE T.F_NAME NOT LIKE '%duration%'
      )
      SELECT 
          FechaReal,
          Componente,
          Caracteristica,
          Maquina,
          USL,
          LSL,
          COUNT(ValorMedido) AS TotalMediciones,
          ROUND(AVG(ValorMedido), 4) AS Media,
          ROUND(STDEV(ValorMedido), 4) AS DesviacionEstandar,
          CASE 
              WHEN STDEV(ValorMedido) IS NULL OR STDEV(ValorMedido) = 0 THEN 0
              ELSE ROUND(
                  (SELECT MIN(v) FROM (VALUES 
                      ((USL - AVG(ValorMedido)) / NULLIF(3 * STDEV(ValorMedido), 0)),
                      ((AVG(ValorMedido) - LSL) / NULLIF(3 * STDEV(ValorMedido), 0))
                  ) AS Value(v)), 3)
          END AS CpkCalculado
      FROM MedicionesConLimites
      GROUP BY 
          FechaReal, Componente, Caracteristica, Maquina, USL, LSL
      HAVING 
          COUNT(ValorMedido) > 1
      ORDER BY 
          FechaReal, Componente, Caracteristica;
    `;

    const result = await pool.request().query(sqlQuery);

    const cpkData = result.recordset
      .filter((row) => row.USL !== null && row.LSL !== null && Math.abs(row.USL) < 900)
      .map((row) => {
        const rawCpk = Number(row.CpkCalculado) || 0;
        const cpkSanitizado = rawCpk < 0 ? 0 : rawCpk > 10 ? 10 : rawCpk;

        return {
          familia: row.Componente,
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
          fecha: row.FechaReal, // FECHA REAL DEL DÍA DE MEDICIÓN
          muestras: []
        };
      });

    return res.json(cpkData);
  } catch (error) {
    console.error('Error al consultar Cpk de InfinityQS:', error);
    return res.status(500).json({ error: 'No se pudo obtener el cálculo de Cpk' });
  }
});

export default router;