import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import procedureRouter from './services/procedure.router'
import frecuenciasRouter from './services/frecuencias';
import cpkRouter from './services/cpk';
import whrsRouter from './services/Whours';


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
app.use('/api', whrsRouter);


app.listen(PORT, () => {
    console.log(`El Backend funciona en: http;//localhost:${PORT} :D`)
})