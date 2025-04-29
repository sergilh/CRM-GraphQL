import Usuario from '../models/usuario.js';
import Producto from '../models/productos.js';
import Cliente from '../models/clientes.js';
import Pedido from '../models/pedidos.js';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const { SECRET } = process.env;

const createToken = (user, secret, expiresIn) => {
    console.log(user);
    const { id, email, nombre, apellido } = user;

    return jwt.sign({ id, email, nombre, apellido }, secret, { expiresIn });
};
//Resolvers
const resolvers = {
    Query: {
        obtenerUsuario: async (_, {}, ctx) => {
            return ctx.usuario;
        },
        obtenerProductos: async () => {
            try {
                const listaProductos = await Producto.find({});
                return listaProductos;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerProducto: async (_, { id }) => {
            //Revisar si el producto existe
            const producto = await Producto.findById(id);
            if (!producto) {
                throw new Error('Producto no encontrado');
            }
            return producto;
        },
        obtenerClientes: async () => {
            try {
                const clientes = await Cliente.find({});
                return clientes;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerClientesVendedor: async (_, {}, ctx) => {
            try {
                const clientes = await Cliente.find({
                    vendedor: ctx.usuario.id.toString(),
                });
                return clientes;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerCliente: async (_, { id }, ctx) => {
            //Revisar si el cliente existe o no
            const cliente = await Cliente.findById(id);
            if (!cliente) {
                throw new Error('Cliente no encontrado');
            }
            //Solo puede verlo quien lo crea
            if (cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }
            return cliente;
        },
        obtenerPedidos: async () => {
            try {
                const pedidos = await Pedido.find({});
                return pedidos;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerPedidosVendedor: async (_, {}, ctx) => {
            try {
                const pedidos = await Pedido.find({
                    vendedor: ctx.usuario.id,
                }).populate('cliente');
                return pedidos;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerPedido: async (_, { id }, ctx) => {
            //Verificar si el pedido existe
            const pedido = await Pedido.findById(id);
            if (!pedido) {
                throw new Error('Pedido no encontrado');
            }

            //Solo quien lo creó puede verlo
            if (pedido.vendedor.toString() !== ctx.usuario.id) {
                throw new Error(
                    'No tienes las credenciales necesarias para ver este pedido'
                );
            }
            //Retornar resultado
            return pedido;
        },
        obtenerPedidosEstado: async (_, { estado }, ctx) => {
            const pedidos = await Pedido.find({
                vendedor: ctx.usuario.id,
                estado,
            });
            return pedidos;
        },
        mejoresClientes: async () => {
            const clientes = await Pedido.aggregate([
                { $match: { estado: 'COMPLETADO' } },
                {
                    $group: {
                        _id: '$cliente',
                        total: { $sum: '$total' },
                    },
                },
                {
                    $lookup: {
                        from: 'clientes',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'cliente',
                    },
                },
                {
                    $limit: 10,
                },
                {
                    $sort: { total: -1 },
                },
            ]);
            return clientes;
        },
        mejoresVendedores: async () => {
            const vendedores = await Pedido.aggregate([
                { $match: { estado: 'COMPLETADO' } },
                {
                    $group: {
                        _id: '$vendedor',
                        total: { $sum: '$total' },
                    },
                },
                {
                    $lookup: {
                        from: 'usuarios',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'vendedor',
                    },
                },
                {
                    $limit: 3,
                },
                {
                    $sort: { total: -1 },
                },
            ]);
            return vendedores;
        },
        buscarProducto: async (_, { texto }) => {
            const productos = await Producto.find({
                $text: { $search: texto },
            }).limit(10);
            return productos;
        },
    }, //Resolvers Usuario
    Mutation: {
        nuevoUsuario: async (_, { input }) => {
            const { email, password } = input;
            //Revisar si el usuario ya está registrado
            const existeUsuario = await Usuario.findOne({ email });
            if (existeUsuario) {
                throw new Error('El usuario ya está registrado');
            }
            console.log(existeUsuario);

            //Hashear contraseña
            input.password = await bcrypt.hash(password, 10);
            //Guardar usuario en la BBDD
            try {
                const usuario = new Usuario(input);
                await usuario.save();
                return usuario;
            } catch (error) {
                console.log(error);
            }
        },
        loginUsuario: async (_, { input }) => {
            const { email, password } = input;
            //Revisar si el usuario existe
            const existeUsuario = await Usuario.findOne({ email });
            if (!existeUsuario) {
                throw new Error('El usuario no existe');
            }
            //Revisar si la contraseña es correcta
            const passwordCheck = await bcrypt.compare(
                password,
                existeUsuario.password
            );
            if (!passwordCheck) {
                throw new Error('La contraseña no es correcta');
            }

            //Crear token
            return {
                token: createToken(existeUsuario, SECRET, '1h'),
            };
        },
        nuevoProducto: async (_, { input }) => {
            try {
                const producto = new Producto(input);

                //Guardar en la BBDD
                const resultado = await producto.save();

                return resultado;
            } catch (error) {
                console.log(error);
            }
        },
        actualizarProducto: async (_, { id, input }) => {
            try {
                //Revisar si el producto existe
                let producto = await Producto.findById(id);
                if (!producto) {
                    throw new Error('Producto no encontrado');
                }
                //Guardar en la BBDD
                producto = await Producto.findOneAndUpdate({ _id: id }, input, {
                    new: true,
                });
                return producto;
            } catch (error) {
                console.log(error);
            }
        },
        eliminarProducto: async (_, { id }) => {
            //Revisar si el producto existe
            let producto = await Producto.findById(id);
            if (!producto) {
                throw new Error('Producto no encontrado');
            }

            //Eliminar producto
            await Producto.findOneAndDelete({ _id: id });
            return 'Producto eliminado';
        },
        nuevoCliente: async (_, { input }, ctx) => {
            console.log(ctx);
            const { email } = input;
            //Verificar que el cliente existe
            const clienteExiste = await Cliente.findOne({ email });
            if (clienteExiste) {
                throw new Error('Ya existe este cliente');
            }
            const clienteNuevo = new Cliente(input);
            //Asignar vendedor
            clienteNuevo.vendedor = ctx.usuario.id;
            try {
                //Guardar en la BBDD
                const resultado = await clienteNuevo.save();
                return resultado;
            } catch (error) {
                console.log(error);
            }
        },
        actualizarCliente: async (_, { id, input }, ctx) => {
            //Revisar si existe Cliente
            let cliente = await Cliente.findById(id);

            if (!cliente) {
                throw new Error('Este cliente no existe');
            }

            //Verificar si es el vendedor logueado el que quiere actualizar
            if (cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }
            //Guardar cliente en la BBDD
            cliente = await Cliente.findOneAndUpdate({ _id: id }, input, {
                new: true,
            });
            return cliente;
        },
        eliminarCliente: async (_, { id }, ctx) => {
            //Revisar si existe Cliente
            let cliente = await Cliente.findById(id);

            if (!cliente) {
                throw new Error('Este cliente no existe');
            }

            //Verificar si es el vendedor logueado el que quiere eliminar
            if (cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }

            //Eliminar cliente en la BBDD
            cliente = await Cliente.findOneAndDelete({ _id: id });
            return 'Cliente eliminado con éxito';
        },
        nuevoPedido: async (_, { input }, ctx) => {
            const { cliente } = input;
            //Verificar cliente existe
            let clienteExiste = await Cliente.findById(cliente);

            if (!clienteExiste) {
                throw new Error('Este cliente no existe');
            }
            //Verificar si cliente es del vendedor
            if (clienteExiste.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }
            //Revisar el stock del producto
            for await (const articulo of input.pedido) {
                const { id } = articulo;

                const producto = await Producto.findById(id);

                if (articulo.cantidad > producto.existencia) {
                    throw new Error(
                        `El artículo ${producto.nombre} excede la cantidad disponible`
                    );
                } else {
                    //Restar la cantidad al stock disponible
                    producto.existencia =
                        producto.existencia - articulo.cantidad;
                    await producto.save();
                }
            }

            //Crear nuevo pedido
            const nuevoPedido = new Pedido(input);

            //Asignar un vendedor
            nuevoPedido.vendedor = ctx.usuario.id;

            //Guardar pedido en la BBDD
            const resultado = await nuevoPedido.save();
            return resultado;
        },
        actualizarPedido: async (_, { id, input }, ctx) => {
            const { cliente } = input;
            //Revisar si existe pedido
            const pedidoExiste = await Pedido.findById(id);
            if (!pedidoExiste) {
                throw new Error('El pedido no existe');
            }

            //Verificar si el cliente existe
            const existeCliente = await Cliente.findById(cliente);
            if (!existeCliente) {
                throw new Error('El cliente no existe');
            }
            //Verificar si el cliente y pedido pertenecen al vendedor
            if (existeCliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }

            //Revisar stock
            if (input.pedido) {
                for await (const articulo of input.pedido) {
                    const { id } = articulo;

                    const producto = await Producto.findById(id);

                    if (articulo.cantidad > producto.existencia) {
                        throw new Error(
                            `El artículo ${producto.nombre} excede la cantidad disponible`
                        );
                    } else {
                        //Restar la cantidad al stock disponible
                        producto.existencia =
                            producto.existencia - articulo.cantidad;
                        await producto.save();
                    }
                }
            }
            //Guardar pedido
            const resultado = await Pedido.findOneAndUpdate(
                { _id: id },
                input,
                { new: true }
            );
            return resultado;
        },
        eliminarPedido: async (_, { id }, ctx) => {
            //Revisar si existe pedido
            let pedido = await Pedido.findById(id);
            if (!pedido) {
                throw new Error('El pedido no existe');
            }

            //Verificar si es el vendedor logueado el que quiere eliminar
            if (pedido.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }

            //Eliminar pedido en la BBDD
            pedido = await Pedido.findOneAndDelete({ _id: id });
            return 'Se ha eliminado el pedido correctamente';
        },
    },
};

export default resolvers;
