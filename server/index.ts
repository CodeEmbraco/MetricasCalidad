import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api', (req, res) =>{
    res.json({ status: 'ok', mensaje: 'El Backend si funciona :D'})
});

app.listen(PORT, () => {
    console.log(`El Backend funciona en: http;//localhost:${PORT} :D`)
})