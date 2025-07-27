const dotenv = require('dotenv');
// Cargar variables de entorno PRIMERO
dotenv.config();

const mongoose = require('mongoose');
const app = require('./app.js');

// Conectar a la base de datos
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Conectado...');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};
connectDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT} y API docs en http://localhost:${PORT}/api-docs`));