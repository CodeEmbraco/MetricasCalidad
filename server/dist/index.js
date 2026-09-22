"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const procedure_router_1 = __importDefault(require("./services/procedure.router"));
const frecuencias_1 = __importDefault(require("./services/frecuencias"));
const cpk_1 = __importDefault(require("./services/cpk"));
const Whours_1 = __importDefault(require("./services/Whours"));
const app = (0, express_1.default)();
const PORT = 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/api', (req, res) => {
    res.json({ status: 'ok', mensaje: 'El Backend si funciona :D' });
});
app.use('/api/procedure', procedure_router_1.default);
app.use('/api/frecuencias', frecuencias_1.default);
app.use('/api/cpk', cpk_1.default);
app.use('/api', Whours_1.default);
app.listen(PORT, () => {
    console.log(`El Backend funciona en: http;//localhost:${PORT} :D`);
});
