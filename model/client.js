const mongoose = require('mongoose');
const { Schema } = mongoose;

const clientSchema = new Schema({
  orderid: { type: String },
  name: { type: String },
  mobilenumber: { type: String },
  address: { type: String },
  postalcode: { type: String },
  city: { type: String },
  state: { type: String },
  sku: { type: String },
  quantity: { type: String },
  amount: { type: String },
  totalamount: { type: String },
  awb: { type: String },
  status: { type: String },
  channelname: { type: String },
  email: { type: String },
  paymenttype: { type: String },
  date: { type: String },
  delivered_date: { type: String },
  shipped_date: { type: String },
});

clientSchema.index({ orderid: 1, sku: 1 }, { unique: true });

exports.clientModel = mongoose.model('Client', clientSchema);