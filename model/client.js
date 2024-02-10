const mongoose = require('mongoose');
const { Schema } = mongoose;
const skuSchema = new Schema({
    sku : String, 
    quantity: Number, 
    amount: Number
})
const clientSchema = new Schema({
    clientcode: {type: String, unique: true},
    fname: {type: String},
    lname: {type: String},
    mobilenumber : {type : String},
    address : {type : String},
    postalcode : {type : Number},
    city: {type : String},
    state: {type : String},
    skus:{type : [skuSchema], default : undefined},
    awb:{type: String},
    status:{type:String}, 
});

exports.clientModel = mongoose.model('Client', clientSchema);