import mongoose from 'mongoose';

const productosSchema = mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true,
    },
    existencia: {
        type: Number,
        required: true,
    },
    precio: {
        type: Number,
        required: true,
        trim: true,
    },
    creado: {
        type: Date,
        default: Date.now(),
    },
});

productosSchema.index({ nombre: 'text' });

// Crear el modelo basado en el esquema
const Producto = mongoose.model('Productos', productosSchema);

export default Producto;
