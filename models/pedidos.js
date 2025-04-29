import mongoose from 'mongoose';

const pedidosSchema = mongoose.Schema({
    pedido: {
        type: Array,
        required: true,
    },
    total: {
        type: Number,
        required: true,
    },
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Cliente',
    },
    vendedor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Usuario',
    },
    estado: {
        type: String,
        default: 'PENDIENTE',
    },
    creado: {
        type: Date,
        default: Date.now,
    },
});
// Crear el modelo basado en el esquema
const Pedido = mongoose.model('Pedido', pedidosSchema);

export default Pedido;
