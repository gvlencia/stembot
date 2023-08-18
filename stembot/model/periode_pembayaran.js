const mongoose = require('mongoose');
const { Schema } = mongoose;

const periodepembayaran= new Schema ({
    pertanyaan : String,
    jawaban : String
})

module.exports = mongoose.model('periodepembayaran', periodepembayaran);