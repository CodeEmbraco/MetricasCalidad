import { Router, Request, Response } from 'express';
import mssql from 'mssql';
import { getDbConnection } from '../config/db';

const router = Router();

// POST /api/frecuencias
router.post('/guardarRegistro', async (req: Request, res: Response) => {
  try {
    const {
      fecha,
      familia,
      componente,
      maquina,
      caracteristica,
      volumen,
      horas,
      minutos,
      tamanoMuestra,
      frecuencia,
      medicionesInfinity,
      totalMuestras,
      porcentaje,
      estado
    } = req.body;

    const pool = await getDbConnection();

    // Guardado explícito en la base de datos de la App
    await pool.request()
      .input('Fecha', mssql.Date, fecha)
      .input('Familia', mssql.VarChar, familia)
      .input('Componente', mssql.VarChar, componente)
      .input('Maquina', mssql.VarChar, maquina)
      .input('Caracteristica', mssql.VarChar, caracteristica)
      .input('Volumen', mssql.Int, Number(volumen))
      .input('HorasReales', mssql.Decimal(5, 2), Number(horas) + Number(minutos) / 60)
      .input('TamanoMuestra', mssql.Int, Number(tamanoMuestra))
      .input('FrecuenciaMeta', mssql.Int, Number(frecuencia))
      .input('MedicionesInfinity', mssql.Int, Number(medicionesInfinity))
      .input('TotalMuestras', mssql.Int, Number(totalMuestras))
      .input('PorcentajeCumplimiento', mssql.Decimal(5, 2), Number(porcentaje))
      .input('EstadoSemaforo', mssql.VarChar, estado)
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

  } catch (error) {
    console.error('Error al guardar en BD App:', error);
    return res.status(500).json({ error: 'No se pudo guardar la captura en SQL Server' });
  }
});

router.get('/historial', async (_req: Request, res: Response) => {
  try {
    const pool = await getDbConnection();
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
  } catch (error) {
    console.error('Error al consultar historial:', error);
    return res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
});

export default router;