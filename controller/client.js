const { clientModel } = require('../model/client');

//Read all /clients
exports.getAllClients = async (req, res) => {
  try {
    const orders = await clientModel.find({});
    res.status(200).json(orders);
  }
  catch (error) {
    console.log(error);
    res.status(500);
  }
};
//Read GET /clients/:id
exports.getClient = async (req, res) => {
  const id = req.params.id;
  try {
    const doc = await clientModel.findOne({ orderid: id })
    res.status(201).json(doc);
  }
  catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
};

//Read clients without address
exports.getOrders = async (req, res) => {
  try {
    const orders = await clientModel.find({ address: { $exists: false } });
    res.json(orders);
  }
  catch (error) {
    console.log(error);
  }
}

//Read clients with address and without awb
exports.getWithoutAwbOrders = async (req, res) => {
  try {
    const withoutawb = await clientModel.find({ address: { $exists: true }, awb: { $exists: false } });
    res.json(withoutawb);
  } catch (error) {
    console.log(error);
  }
}

// get clients with awb
exports.getConfirmedOrders = async (req, res) => {
  try {
    const confirmed = await clientModel.find({ awb: { $exists: true }, status: 'ready_to_ship' });
    res.json(confirmed);
  } catch (error) {
    console.log(error);
  }
}

//Read clients with awb and status
exports.getShippedOrders = async (req, res) => {
  try {
    const shipped = await clientModel.find({ status: { $in: ['shipped', 'out_for_delivery'] } });
    res.json(shipped);
  } catch (error) {
    console.log(error);
  }
}

exports.getDeliveredOrders = async (req, res) => {
  try {
    const delivered = await clientModel.find({ status: "delivered" });
    res.json(delivered);
  } catch (error) {
    console.log(error);
  }
}

exports.getRtoIntransitOrders = async (req, res) => {
  try {
    const rtointransit = await clientModel.find({ status: 'return_intransit' });
    res.json(rtointransit);
  } catch (error) {
    console.log(error);
  }
}

exports.getRtoDeliveredOrders = async (req, res) => {
  try {
    const rtoDelivered = await clientModel.find({ status: 'return_delivered' });
    res.json(rtoDelivered);
  } catch (error) {
    console.log(error);
  }
}

exports.getRtoRecievedOrders = async (req, res) => {
  try {
    const rtoRecieved = await clientModel.find({ status: 'return_recieved' });
    res.json(rtoRecieved);
  } catch (error) {
    console.log(error);
  }
}

//Read single GET /clients/awb/single/:awb
exports.getClientAwb = async (req, res) => {
  try {
    const awb = req.params.awb;
    const client = await clientModel.findOne({ awb: awb });
    if (!client) {
      return res.status(404).json({ message: "AWB not found" });
    }
    const updatedClient = await clientModel.updateMany({ awb: awb }, { "$set": { status: "shipped" } })
    res.json(updatedClient);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// single GET /clients/orderid/single/:orderid
exports.getClientOrderid = async (req, res) => {
  try {
    const orderid = req.params.orderid;
    const oid = '#' + orderid;
    const client = await clientModel.findOne({ orderid: oid });
    if (!client) {
      return res.status(404).json({ message: "OrderId not found" });
    }
    const updatedClient = await clientModel.updateMany({ orderid: oid }, { "$set": { status: "shipped" } })
    res.json(updatedClient);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

//Update status GET /clients/awb/status/:id
exports.updateAwbStatus = async (req, res) => {
  try {
    const awb = req.params.awb;
    const client = await clientModel.findOne({ awb: awb });
    if (!client) {
      return res.status(404).json({ message: "AWB not found" });
    }
    const updatedClient = await clientModel.updateOne({ awb: awb }, { "$set": { status: "return_recieved" } });
    res.json(updatedClient);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

//Update status GET /clients/orderid/status/:id
exports.updateOrderIdStatus = async (req, res) => {
  try {
    const orderid = req.params.orderid;
    const oid = '#' + orderid;
    const client = await clientModel.findOne({ orderid: oid });
    if (!client) {
      return res.status(404).json({ message: "OrderId not found" });
    }
    const updatedClient = await clientModel.updateMany({ orderid: oid }, { "$set": { status: "return_recieved" } })
    res.json(updatedClient);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

//Create POST /clients
exports.createClient = async (req, res) => {
  try {
    const clientDoc = new clientModel(req.body);
    const doc = await clientDoc.save();
    console.log(doc);
    res.status(201).json(doc);
  }
  catch (error) {
    console.error(error);
    res.status(400).json(error);
  }
};

// Replace PUT /clients/:id
exports.replaceClient = async (req, res) => {
  const id = req.params.id;
  try {
    const doc = await clientModel.findOneAndReplace({ _id: id }, req.body, { new: true })
    res.status(201).json(doc);
  }
  catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
};

//Update PATCH /clients/:id
exports.updateClient = async (req, res) => {
  const id = req.params.id;
  try {
    const doc = await clientModel.updateMany({ orderid: id }, req.body, { new: true })
    res.status(201).json(doc);
  }
  catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
};


//Update awb PATCH /clients/awb/:id
exports.updateManyClients = async (req, res) => {
  const awb = req.body.awb;
  const orderid = req.params.id;

  try {
    const doc = await clientModel.updateMany({ orderid: orderid }, { $set: { awb: awb } });
    res.status(201).json(doc);
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
}

//Delete DELETE /clients/:id
exports.deleteClient = async (req, res) => {
  const id = req.params.id;
  try {
    const doc = await clientModel.findOneAndDelete({ _id: id })
    res.status(201).json(doc);
  }
  catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
};