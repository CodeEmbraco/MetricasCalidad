/* ============================================================
   db/migrate.js
   Crea las tablas de metricas de calidad en SQL Server si no existen.
   Ejecutar con: npm run migrate
   ============================================================ */

import { poolDB } from "../config/db.js"

async function migrate() {
  try {
    await poolDB
    console.log("[migrate] Conexión establecida. Creando tablas...")

    const request = poolDB.request()

    await request.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.tables WHERE name = 'Familia'
      )
      BEGIN
        CREATE TABLE Familia (
          Id               INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
          Nombre           NVARCHAR(100)   NOT NULL UNIQUE
        )
        PRINT 'Tabla Familia creada.'
      END
      ELSE
        PRINT 'Tabla Familia ya existe.'
    `)


    await request.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.tables WHERE name = 'Maquina'
      )
      BEGIN
        CREATE TABLE Maquina (
          Id               INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
          InfinityId       INT            NOT NULL,
          Texto           NVARCHAR(100)   NOT NULL,
          FamiliaId        INT            NOT NULL FOREIGN KEY REFERENCES Familia(Id)
        )
        PRINT 'Tabla Maquina creada.'
      END
      ELSE
        PRINT 'Tabla Maquina ya existe.'
    `)

    await request.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.tables WHERE name = 'Componente'
      )
      BEGIN
        CREATE TABLE Componente (
          Id               INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
          FamiliaId        INT             NOT NULL,
          Nombre           NVARCHAR(100)   NOT NULL,
          FOREIGN KEY (FamiliaId) REFERENCES Familia(Id)
        )
        PRINT 'Tabla Componente creada.'
      END
      ELSE
        PRINT 'Tabla Componente ya existe.'
    `)

    await request.query(`
      IF NOT EXISTS (
      SELECT 1 FROM sys.tables WHERE name = 'SKU'
      )
      BEGIN 
        CREATE TABLE SKU (
        Id               INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        ComponenteId     INT             NOT NULL,
        SKUInfinity      NVARCHAR(50)   NOT NULL UNIQUE,
        CONSTRAINT FK_SKU_Componente FOREIGN KEY (ComponenteId) REFERENCES Componente(Id)
        )
        PRINT 'Tabla SKU creada.'
      END
      ELSE
        PRINT 'Tabla SKU ya existe.'
    `)

    await request.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.tables WHERE name = 'Caracteristica'
      )
      BEGIN
        CREATE TABLE Caracteristica (
          Id               INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
          ComponenteId     INT             NOT NULL,
          MaquinaId        INT             NOT NULL,
          Texto            NVARCHAR(200)   NOT NULL,
          IdInfinity       INT             NOT NULL,
          FOREIGN KEY (ComponenteId) REFERENCES Componente(Id),
          FOREIGN KEY (MaquinaId) REFERENCES Maquina(Id)
        )
        PRINT 'Tabla Caracteristica creada.'
      END
      ELSE
        PRINT 'Tabla Caracteristica ya existe.'
    `)
    /* ── Tabla Frecuencia ──────────────────────────────────── */
    await request.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.tables WHERE name = 'Frecuencia'
      )
      BEGIN
        CREATE TABLE Frecuencia (
          Id               NVARCHAR(20)   NOT NULL PRIMARY KEY,
          FamiliaId        INT            NOT NULL FOREIGN KEY REFERENCES Familia(Id),
          ComponenteId     INT            NOT NULL FOREIGN KEY REFERENCES Componente(Id),
          MaquinaId        INT            NOT NULL FOREIGN KEY REFERENCES Maquina(Id),
          CaracteristicaId INT            NOT NULL FOREIGN KEY REFERENCES Caracteristica(Id),
          Fecha            DATE           NOT NULL,
          Volumen          INT            NOT NULL DEFAULT 0,
          Horas            INT            NOT NULL DEFAULT 0,
          Minutos          INT            NOT NULL DEFAULT 0,
          HorasDec         FLOAT          NOT NULL DEFAULT 0,
          Rate             FLOAT          NOT NULL DEFAULT 0,
          TamanoMuestra    INT            NOT NULL DEFAULT 0,
          Frecuencia       INT            NOT NULL DEFAULT 0,
          PiezasHora       FLOAT          NOT NULL DEFAULT 0,
          TotalMuestras    INT            NOT NULL DEFAULT 0,
          MedicionesInfinity INT          NOT NULL DEFAULT 0,
          Porcentaje       FLOAT          NOT NULL DEFAULT 0,
          CreadoEn         DATETIME2      NOT NULL DEFAULT GETDATE()
        )
        PRINT 'Tabla Frecuencia creada.'
      END
      ELSE
        PRINT 'Tabla Frecuencia ya existe.'
    `)

    /* ── Tabla CPK ─────────────────────────────────────────── */
    await request.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.tables WHERE name = 'CPK'
      )
      BEGIN
        CREATE TABLE CPK (
          Id               NVARCHAR(20)   NOT NULL PRIMARY KEY,
          FamiliaId        INT            NOT NULL FOREIGN KEY REFERENCES Familia(Id),
          ComponenteId     INT            NOT NULL FOREIGN KEY REFERENCES Componente(Id),
          MaquinaId        INT            NOT NULL FOREIGN KEY REFERENCES Maquina(Id),
          CaracteristicaId INT            NOT NULL FOREIGN KEY REFERENCES Caracteristica(Id),
          Fecha            DATE           NOT NULL,
          Hora             NVARCHAR(5)    NOT NULL DEFAULT '00:00',
          Cp               FLOAT          NOT NULL DEFAULT 0,
          Cpk              FLOAT          NOT NULL DEFAULT 0,
          Lei              FLOAT          NOT NULL DEFAULT 0,
          Obj              FLOAT          NOT NULL DEFAULT 0,
          Les              FLOAT          NOT NULL DEFAULT 0,
          PiezasMedidas    INT            NOT NULL DEFAULT 0,
          Porcentaje       FLOAT          NOT NULL DEFAULT 0,
          Rate             FLOAT          NOT NULL DEFAULT 0,
          Muestras         NVARCHAR(MAX)  NOT NULL DEFAULT '[]',
          CreadoEn         DATETIME2      NOT NULL DEFAULT GETDATE()
        )
        PRINT 'Tabla CPK creada.'
      END
      ELSE  
        PRINT 'Tabla CPK ya existe.'
    `)

    console.log("[migrate] ✅ Migración completada correctamente.")
  } catch (err) {
    console.error("[migrate] ❌ Error durante la migración:", err.message)
    process.exit(1)
  } finally {
    await poolDB.close()
    process.exit(0)
  }
}

migrate()
