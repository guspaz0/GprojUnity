const { Projects, Payments, Users} = require('../db.js'); // Importa tus modelos de órdenes
const { Op, Sequelize } = require('sequelize');
const {format} = require('date-fns');
const Controllers = require("./index.js");

const paymentsServices = {
    
    allPayments: async function(query) {
        try {
            let {  paymentId, status, paymentAmount, projects, UserId, desde, hasta } = query;

            const {count, rows} = await Payments.findAndCountAll({
                where: {
                    createdAt: {[Op.between]: [desde, hasta]},
                },
                include: {
                    model: Users,
                    attributes: ['name']
                },
                attributes: ['id','paymentId','paymentAmount','status','concept','orderNumber','createdAt','product'],
                order: [['createdAt', 'DESC']],
                raw: true
            });
            const projectsName = await Projects.findAll({attributes: ['id','name'], paranoid: false})

            let payments = []
            for (let i in rows) {
                const { id, paymentId, paymentAmount, status, concept, orderNumber, product, } = rows[i]
                payments = [
                    ...payments,
                    {
                        id: id,
                        paymentId: paymentId,
                        paymentAmount: paymentAmount,
                        status: status,
                        concept: concept,
                        orderNumber: orderNumber,
                        product: projectsName.filter((x) => x.id === product)[0].name,
                        buyer: rows[i]['User.name']? rows[i]['User.name'] : 'undefined',
                        createdAt: format(rows[i].createdAt, 'yyyy-MM-dd hh:mm')
                    }
                ]
            }
            return payments;
        } catch (error) {

            //console.error('Error al obtener payments:', error);
            throw error;
        }
    },

    paymentId: async function(id) {
        try {
            const order = await Payments.findByPk(id);
            return order;
        } catch (error) {

            console.error('Error al obtener la orden por ID:', error);
            throw error;
        }
    }, // el create payment de mercado pago esta realizado desde /controllers/mercadopago.js 
};

module.exports = paymentsServices;
