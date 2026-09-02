import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import procedureRouter from './services/procedure.router'
import frecuenciasRouter from './services/frecuencias';
import cpkRouter from './services/cpk';


const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api', (req, res) =>{
    res.json({ status: 'ok', mensaje: 'El Backend si funciona :D'})
});

app.use('/api/procedure', procedureRouter);
app.use('/api/frecuencias', frecuenciasRouter);
app.use('/api/cpk', cpkRouter);


app.listen(PORT, () => {
    console.log(`El Backend funciona en: http;//localhost:${PORT} :D`)
})