const mongoose = require('mongoose');
const { Schema } = mongoose;

const pertanyaanumum= new Schema ({
    pertanyaan : String,
    jawaban : String,
    layanan : String
})

module.exports = mongoose.model('pertanyaanumum', pertanyaanumum);