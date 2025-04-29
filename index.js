import { ApolloServer } from 'apollo-server';
import typeDefs from './db/schema.js';
import resolvers from './db/resolvers.js';
import jwt from 'jsonwebtoken';
import connectDB from './config/db.js';
import 'dotenv/config';
import Usuario from './models/usuario.js';

const { SECRET } = process.env;

const { PORT } = process.env;

//Conectar a la BBDD
connectDB();

//Servidor
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
        console.log(req.headers);

        const token = req.headers['authorization'] || '';
        if (token) {
            try {
                const usuario = jwt.verify(
                    token.replace('Bearer ', ''),
                    SECRET
                );
                console.log(usuario);
                return {
                    usuario,
                };
            } catch (error) {
                console.log(error);
            }
        }
    },
});
//Arrancar el servidor
server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
    console.log(`Servidor escuchando en la URL ${url}`);
});
