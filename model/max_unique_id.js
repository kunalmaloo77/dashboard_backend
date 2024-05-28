const mongoose = require('mongoose');
const { Schema } = mongoose;

const maxUniqueIdSchema = new Schema({
  source: { type: String },
  maxID: { type: String, default: 1 },
});

exports.maxUniqueIdModel = mongoose.model('MaxUniqueID', maxUniqueIdSchema);