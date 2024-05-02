const express = require('express');
const clientController = require('../controller/client.js')

const clientRouter = express.Router();

clientRouter
  .get('/', clientController.getAllClients)
  .get('/awb/single/:awb', clientController.getClientAwb)
  .get('/orderid/single/:orderid', clientController.getClientOrderid)
  .get('/orders', clientController.getOrders)
  .get('/confirmed', clientController.getConfirmedOrders)
  .get('/withoutawb', clientController.getWithoutAwbOrders)
  .get('/shipped', clientController.getShippedOrders)
  .get('/delivered', clientController.getDeliveredOrders)
  .get('/:id', clientController.getClient)
  .post('/', clientController.createClient)
  .put('/:id', clientController.replaceClient)
  .patch('/:id', clientController.updateClient)
  .patch('/awb/:id', clientController.updateManyClients)
  .delete('/:id', clientController.deleteClient)

module.exports = clientRouter;