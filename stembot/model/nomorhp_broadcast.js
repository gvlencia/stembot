const mongoose = require('mongoose');
const { Schema } = mongoose;

const nomorhpbroadcast= new Schema ({
    phonenumber : String,
})

module.exports = mongoose.model('nomorhpbroadcast', nomorhpbroadcast);