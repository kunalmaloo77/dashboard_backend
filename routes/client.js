const express = require('express');
const clientController = require('../controller/client.js')
console.log(clientController);

const clientRouter = express.Router();

clientRouter
.post('/', clientController.createClient)
.get('/', clientController.getAllClients)
.get('/:id', clientController.getClient)
.put('/:id', clientController.replaceClient)
.patch('/:id', clientController.updateClient)
.delete('/:id', clientController.deleteClient)

module.exports = clientRouter;