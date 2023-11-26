const mercadopago = require('mercadopago');
const {MP_TOKEN, DB_HOST, PORT, CLIENT_HOST, SERVER} = process.env
const { Order_detail , Order, Payments, Users, Projects } = require('../db.js');
const paymentsServices = require('../services/payment.js');
const {Sequelize} = require('sequelize');

// Configura las credenciales de MercadoPago
const paymenntsControllers = {
    // Función para crear una preferencia de pago en MercadoPago
    createPaymentPreference:  async function(req, res )  {
      mercadopago.configure({
          access_token: MP_TOKEN,
      });
      const lastOrderNumber = await Payments.findAll({
          attributes: [Sequelize.fn('max', Sequelize.col('orderNumber'))],
          raw: true
      })
  
      const orderNumber = lastOrderNumber[0].max+1
      let items = req.body
      for (let i in items) {
          const { unit_price, id, buyer, concept, status } = items[i]
          const createOrder = await Payments.create({
              paymentAmount: unit_price,
              orderNumber: orderNumber,
              product: id,
              buyer: buyer,
              concept: concept? concept : 'venta', //venta, donacion o devolucion
              status: status? status : 'created',
          })
      }
      const totalPrecio = req.body.reduce((acumulador, producto) =>
          acumulador + parseFloat(producto.unit_price), 0);
  
      const preference = {
          items,
          total_amount: totalPrecio,
          external_reference : `${orderNumber}`,
          payer: await Users.findOne({
              where: {id: items[0].buyer},
              attributes: ['name', 'email'],
              raw: true
          }),
          back_urls: {
              success: `${SERVER}/payment/success`,
              pending: `${SERVER}/error`,
              failure: `https://proj-unity.vercel.app`,
          },
          notification_url: "https://3eb3-181-29-72-133.ngrok.io/webhook",
          auto_return: "approved",
      };
      try {
          const response = await mercadopago.preferences.create(preference);
          //console.log(response.body);
          global.id = response.body.id;
          init_point = response.body.init_point;
          projects = response.body.items.map(e=>{
              return{
              id:e.id,
              price:e.unit_price
              }
          })
          for (let i in projects) {
              await Payments.update({
                  paymentId: global.id,
                  status:"processing",
              },
              {where: {
                  orderNumber: orderNumber,
                  product: projects[i].id
              }
              });
          }
          const queryOrder = await Payments.findAll({where: {orderNumber: orderNumber}, raw: true})
          let itemsDb = []
          for (let i in queryOrder) {
              let { product, paymentAmount} = queryOrder[i]
              let productName = await Projects.findOne({where: {id: product}, attributes: ['name'], raw: true})
              itemsDb = [
              ...itemsDb,
                  {
                      id: product,
                      title: productName.name,
                      unit_price: paymentAmount,
                      quantity: 1
                  }
              ] 
          }
          res.json({id: global.id, init_point: response.body.init_point, itemsDb})
      } catch (error) {
          console.log(error);
      }
  },
  successPayment: async function (req,res) {
    try {
      const { 
        collection_id,
        collection_status,
        payment_id,
        status,
        external_reference,
        payment_type,
        merchant_account_id
      } = req.query
      const { id } = req.params
      if (status === 'approved') {
        await Payments.update({
          status: 'completed'
        },
        {where: 
          {
            orderNumber: external_reference,
          }
        })
      }
      //res.redirect('https://proj-unity.vercel.app/')
      res.status(200).redirect(`${CLIENT_HOST}/`)
    } catch (error) {
      return error
    }
  },
  getOrdenId: async function(req, res){
  try {
    const {id} = req.params
    const  payment = await paymentsServices.paymentId(id);
        res.status(200).json(payment);
    } catch (error) {
        res.status(500).json(error.message);
    }
  },
  getAllPayment: async function(req, res){
    try {
      const { desde, hasta } = req.query
      const currentTime = new Date()
      let fechaDesde = desde? desde.split('-') : [];
      fechaDesde.length !== 3?         
          fechaDesde = new Date(currentTime.getFullYear(),currentTime.getMonth(),1,0,0,0)
          : fechaDesde = new Date(parseInt(fechaDesde[0]),parseInt(fechaDesde[1])-1,parseInt(fechaDesde[2]),0,0,0); //<<--- si no esta definida la fecha desde, se define por defecto desde el primero del corriente mes
      
      let fechaHasta = hasta? hasta.split('-') : [];
      fechaHasta.length !== 3? 
          fechaHasta = currentTime
          : fechaHasta = new Date(parseInt(fechaHasta[0]),parseInt(fechaHasta[1])-1,parseInt(fechaHasta[2]),0,0,0);
      
          const allPayments = await paymentsServices.allPayments({...req.query, desde: fechaDesde, hasta: fechaHasta});
        res.status(200).json(allPayments)
    } catch (error) {
        res.status(500).json(error.message)
    }
  }
};
        
module.exports =  paymenntsControllers
