const mongoose = require('mongoose');
const { Schema } = mongoose;

const clientSchema = new Schema({
  channelSKU: { type: String, unique: true },
  mainSKU: { type: String },
  size: { type: String }
});

exports.clientModel = mongoose.model('Client', clientSchema);