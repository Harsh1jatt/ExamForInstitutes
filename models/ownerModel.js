const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ownerSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email:{
        type:String,
        required: true
    },
    secCode: {
        type: String,
        required: true
    }
}, {timestamps: true})

const owner = mongoose.model('owner', ownerSchema);
module.exports = owner;