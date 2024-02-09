const mongoose = require('mongoose');
const { Schema } = mongoose;
const skuSchema = new Schema({
    sku : String, 
    quantity: Number, 
    amount: Number
})
const clientSchema = new Schema({
    clientcode: { type: String, required: true, unique: true},
    fname: { type: String, required: true },
    lname: { type: String, required: true },
    mobilenumber : {type : String, required : true},
    address : {type : String, required: true},
    postalcode : {type : Number, required : true},
    city: {type : String, required: true},
    state: {type : String, required: true},
    skus:{type : [skuSchema], default : undefined}, 
});

exports.clientModel = mongoose.model('Client', clientSchema);