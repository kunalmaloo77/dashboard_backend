const express = require('express');
const clientController = require('../controller/client.js')
console.log(clientController);

const clientRouter = express.Router();

clientRouter
.post('/', clientController.createClient)
.get('/', clientController.getAllClients)
.get('/:id', clientController.getClient)
.put('/:id', clientController.updateClient)
.patch('/:id', clientController.replaceClient)
.delete('/:id', clientController.deleteClient)

module.exports = clientRouter;