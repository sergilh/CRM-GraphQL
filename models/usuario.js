import mongoose from 'mongoose';

const usuariosSchema = mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true,
    },
    apellido: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        trim: true,
    },
    creado: {
        type: Date,
        default: Date.now,
    },
});
// Crear el modelo basado en el esquema
const Usuario = mongoose.model('Usuario', usuariosSchema);

export default Usuario;
