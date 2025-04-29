import mongoose from 'mongoose';
import 'dotenv/config';

const { DB_MONGO } = process.env;
console.log('Valor de DB_MONGO:', DB_MONGO);

const connectDB = async () => {
    try {
        await mongoose.connect(DB_MONGO);
        console.log('Base de datos conectada✅');
    } catch (error) {
        console.log('Hay un error');
    }
};

export default connectDB;
