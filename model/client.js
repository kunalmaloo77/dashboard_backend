const mongoose = require('mongoose');
const { Schema } = mongoose;

const clientSchema = new Schema({
  unique_id: { type: String },
  orderid: { type: String },
  name: { type: String },
  mobilenumber: { type: String },
  address: { type: String },
  postalcode: { type: String },
  city: { type: String },
  state: { type: String },
  town: { type: String },
  sku: { type: String },
  quantity: { type: String },
  amount: { type: String },
  totalamount: { type: String },
  awb: { type: String },
  status: { type: String },
  channelname: { type: String },
  email: { type: String },
  paymenttype: { type: String },
  date: { type: Date },
  delivered_date: { type: Date },
  shipped_date: { type: Date },
  return_recieved_date: { type: Date },
});

clientSchema.index({ orderid: 1, sku: 1 }, { unique: true });

exports.clientModel = mongoose.model('Client', clientSchema);