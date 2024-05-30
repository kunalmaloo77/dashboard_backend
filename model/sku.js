const mongoose = require('mongoose');
const { Schema } = mongoose;

const skuSchema = new Schema({
  channelSKU: { type: String, unique: true },
  mainSKU: { type: String },
  size: { type: String }
});

exports.skuModel = mongoose.model('Sku', skuSchema);