"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDbConnection = void 0;
const mssql_1 = __importDefault(require("mssql"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME_INFINITY,
    options: {
        encrypt: false, // Desactivado para red local / IP directa
        trustServerCertificate: true, // Permite certificados autofirmados
        enableArithAbort: true
    },
    requestTimeout: 60000,
    connectionTimeout: 15000,
};
let pool = null;
const getDbConnection = async () => {
    if (!pool) {
        pool = await mssql_1.default.connect(dbConfig);
    }
    return pool;
};
exports.getDbConnection = getDbConnection;
// export const getDbConnection = async (): Promise<mssql.ConnectionPool> => {
//   return await mssql.connect(dbConfig);
// };
