const { clientModel } = require('../model/client');
const { skuModel } = require('../model/sku');

//Read all /clients
exports.getAllClients = async (req, res) => {
  const startDate = new Date(req.query.startDate);
  const endDate = new Date(req.query.endDate);
  const query = {
    date: {
      $gte: startDate,
      $lte: endDate
    }
  };

  try {
    const cursor = clientModel.find(query).lean().cursor();

    const orders = [];
    const skuArray = [];

    for (let order = await cursor.next(); order != null; order = await cursor.next()) {
      if (order.address && order.address.includes('"')) {
        order.address = order.address.replace(/"/g, '');
      }
      if (order.sku) {
        skuArray.push(order.sku);
      }
      else {
        skuArray.push("NA");
      }
      orders.push(order);
    }

    const skuPromises = skuArray.map(sku => skuModel.findOne({ channelSKU: sku }).lean());
    const Sku = await Promise.all(skuPromises);

    res.status(200).json({ Sku, orders });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
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
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const Sku = [];
  try {
    const orders = await clientModel.find({ address: { $exists: false } })
      .skip((page - 1) * limit)
      .limit(limit);
    for (let i = 0; i < limit; i++) {
      const item_sku = orders[i]?.sku;
      const res = await skuModel.find({ channelSKU: item_sku });
      Sku.push(res);
    }
    const totalItems = await clientModel.countDocuments({ address: { $exists: false } });
    const totalPages = Math.ceil(totalItems / limit);
    res.json({
      Sku,
      orders,
      totalItems,
      totalPages,
      currentPage: page,
    });
  }
  catch (error) {
    console.log(error);
  }
}

//Read clients with address and without awb
exports.getWithoutAwbOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const Sku = [];
  try {
    const items = await clientModel.find({ address: { $exists: true }, awb: { $exists: false } })
      .skip((page - 1) * limit)
      .limit(limit);
    for (let i = 0; i < limit; i++) {
      const item_sku = items[i]?.sku;
      const res = await skuModel.find({ channelSKU: item_sku });
      Sku.push(res);
    }
    const totalItems = await clientModel.countDocuments({ address: { $exists: true }, awb: { $exists: false } });
    const totalPages = Math.ceil(totalItems / limit);
    res.json({
      Sku,
      items,
      totalItems,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log(error);
  }
}

// get clients with awb
exports.getConfirmedOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const Sku = [];
  try {
    const confirmed = await clientModel.find({ awb: { $exists: true }, status: 'ready_to_ship' })
      .skip((page - 1) * limit)
      .limit(limit);
    for (let i = 0; i < limit; i++) {
      const item_sku = confirmed[i]?.sku;
      const res = await skuModel.find({ channelSKU: item_sku });
      Sku.push(res);
    }
    const totalItems = await clientModel.countDocuments({ awb: { $exists: true }, status: 'ready_to_ship' });
    const totalPages = Math.ceil(totalItems / limit);
    res.json({
      Sku,
      confirmed,
      totalItems,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log(error);
  }
}

//Read clients with awb and status
exports.getShippedOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  try {
    const shipped = await clientModel.find({ status: { $in: ['in-transit'] } })
      .skip((page - 1) * limit)
      .limit(limit);
    const totalItems = await clientModel.countDocuments({ status: { $in: ['in-transit'] } });
    const totalPages = Math.ceil(totalItems / limit);
    res.json({
      shipped,
      totalItems,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log(error);
  }
}

exports.getDeliveredOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  try {
    const delivered = await clientModel.find({ status: "delivered" })
      .skip((page - 1) * limit)
      .limit(limit);
    const totalItems = await clientModel.countDocuments({ status: "delivered" });
    const totalPages = Math.ceil(totalItems / limit);
    res.json({
      delivered,
      totalItems,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log(error);
  }
}

exports.getRtoIntransitOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  try {
    const rtointransit = await clientModel.find({ status: 'return_intransit' })
      .skip((page - 1) * limit)
      .limit(limit);
    const totalItems = await clientModel.countDocuments({ status: "return_intransit" });
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      rtointransit,
      totalItems,
      totalPages,
      currentPage: page,
    });

  } catch (error) {
    console.log(error);
  }
}

exports.getRtoDeliveredOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  try {
    const rtoDelivered = await clientModel.find({ status: 'return_delivered' })
      .skip((page - 1) * limit)
      .limit(limit);
    const totalItems = await clientModel.countDocuments({ status: "return_delivered" });
    const totalPages = Math.ceil(totalItems / limit);
    res.json({
      rtoDelivered,
      totalItems,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log(error);
  }
}

exports.getRtoRecievedOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  try {
    const rtoRecieved = await clientModel.find({ status: 'return_recieved' })
      .skip((page - 1) * limit)
      .limit(limit);
    const totalItems = await clientModel.countDocuments({ status: "return_recieved" });
    const totalPages = Math.ceil(totalItems / limit);
    res.json({
      rtoRecieved,
      totalItems,
      totalPages,
      currentPage: page,
    });
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
    const isHashed = req.query.isHashed;
    let oid = orderid;
    if (isHashed == 0) {
      oid = '#' + orderid;
    }
    console.log(oid);
    const client = await clientModel.findOne({ orderid: oid });
    console.log(client);
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
    console.log(awb);
    const client = await clientModel.findOne({ awb: awb });
    if (!client) {
      return res.status(404).json({ message: "AWB not found" });
    }
    const currentDate = new Date();
    const updatedClient = await clientModel.updateMany({ awb: awb }, {
      "$set": {
        status: "return_recieved",
        return_recieved_date: currentDate
      }
    });
    res.json(updatedClient);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

//Update status GET /clients/orderid/status/:id
exports.updateOrderIdStatus = async (req, res) => {
  try {
    const orderid = req.params.orderid;
    // const oid = '#' + orderid;
    const isHashed = req.query.isHashed;
    console.log(isHashed);
    let oid = orderid;
    if (isHashed == 0) {
      oid = '#' + orderid;
    }
    console.log(oid);
    const client = await clientModel.findOne({ orderid: oid });
    if (!client) {
      return res.status(404).json({ message: "OrderId not found" });
    }
    const currentDate = new Date();
    const updatedClient = await clientModel.updateMany({ orderid: oid }, {
      "$set": {
        status: "return_recieved",
        return_recieved_date: currentDate
      }
    })
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

//Date Filter
exports.dateFilter = async (req, res) => {
  try {
    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate);
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 0);

    const result = await clientModel.aggregate([
      {
        $match: {
          shipped_date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$shipped_date" } },
            status: "$status"
          },
          totalOrder: { $sum: 1 },
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
}

exports.shopifyDateFilter = async (req, res) => {
  try {
    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate);
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 0);

    const result = await clientModel.aggregate([
      {
        $match: {
          shipped_date: { $gte: startDate, $lte: endDate },
          channelname: /shopify/i
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$shipped_date" } },
            status: "$status"
          },
          totalOrder: { $sum: 1 },
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
}

exports.dealshunterDateFilter = async (req, res) => {
  try {
    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate);
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 0);

    const result = await clientModel.aggregate([
      {
        $match: {
          shipped_date: { $gte: startDate, $lte: endDate },
          channelname: /deals/i
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$shipped_date" } },
            status: "$status"
          },
          totalOrder: { $sum: 1 },
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
}

exports.pagazoDateFilter = async (req, res) => {
  try {
    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate);
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 0);

    const result = await clientModel.aggregate([
      {
        $match: {
          shipped_date: { $gte: startDate, $lte: endDate },
          channelname: /pagazo/i
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$shipped_date" } },
            status: "$status"
          },
          totalOrder: { $sum: 1 },
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
}