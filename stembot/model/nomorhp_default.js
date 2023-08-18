const mongoose = require('mongoose');
const { Schema } = mongoose;

const nomorhpdefault= new Schema ({
    phonenumber : String,
})

module.exports = mongoose.model('nomorhpdefault', nomorhpdefault);