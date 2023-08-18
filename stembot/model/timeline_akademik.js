const mongoose = require('mongoose');
const { Schema } = mongoose;

const timelineakademik= new Schema ({
    pertanyaan : String,
    jawaban : String
})

module.exports = mongoose.model('timelineakademik', timelineakademik);