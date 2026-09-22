import mssql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig: mssql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME_INFINITY,
  options: {
    encrypt: false,               // Desactivado para red local / IP directa
    trustServerCertificate: true, // Permite certificados autofirmados
    enableArithAbort: true
  },
  requestTimeout:60000,
  connectionTimeout:15000,
};


let pool: mssql.ConnectionPool | null = null;

export const getDbConnection = async (): Promise<mssql.ConnectionPool> => {
  if (!pool) {
    pool = await mssql.connect(dbConfig);
  }
  return pool;
};

// export const getDbConnection = async (): Promise<mssql.ConnectionPool> => {
//   return await mssql.connect(dbConfig);
// };