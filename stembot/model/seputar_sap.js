const mongoose = require('mongoose');
const { Schema } = mongoose;

const seputarsap= new Schema ({
    pertanyaan : String,
    jawaban : String
})

module.exports = mongoose.model('seputarsap', seputarsap);