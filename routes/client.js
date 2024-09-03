const express = require("express");
const clientController = require("../controller/client.js");
const skuController = require("../controller/skuUpload.js");
const clientRouter = express.Router();

clientRouter
  .get("/", clientController.getAllClients)
  .get("/awb/single/:awb", clientController.getClientAwb)
  .get("/orderid/single/:orderid", clientController.getClientOrderid)
  .get("/orderid/status/:orderid", clientController.updateOrderIdStatus)
  .get("/skuList", skuController.getUnmappedSku)
  .get("/skuListfull", skuController.getfullUnmappedSku)
  .get("/awb/status/:awb", clientController.updateAwbStatus)
  .get("/orders", clientController.getOrders)
  .get("/withoutawb", clientController.getWithoutAwbOrders)
  .get("/confirmed", clientController.getConfirmedOrders)
  .get("/api/date/all", clientController.dateFilter)
  .get("/api/date/dealshunter", clientController.dealshunterDateFilter)
  .get("/api/date/pagazo", clientController.pagazoDateFilter)
  .get("/api/date/shopify", clientController.shopifyDateFilter)
  .get("/shipped", clientController.getShippedOrders)
  .get("/delivered", clientController.getDeliveredOrders)
  .get("/rtointransit", clientController.getRtoIntransitOrders)
  .get("/rtodelivered", clientController.getRtoDeliveredOrders)
  .get("/rtorecieved", clientController.getRtoRecievedOrders)
  .get("/:id", clientController.getClient)
  .get("/mobilenumber/:id", clientController.getMobileClient)
  .post("/", clientController.createClient)
  .put("/:id", clientController.replaceClient)
  .patch("/:id", clientController.updateClient)
  .patch("/awb/:id", clientController.updateAWBClients)
  .delete("/:id", clientController.deleteClient);

module.exports = clientRouter;
