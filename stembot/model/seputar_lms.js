const mongoose = require('mongoose');
const { Schema } = mongoose;

const seputarlms= new Schema ({
    pertanyaan : String,
    jawaban : String
})

module.exports = mongoose.model('seputarlms', seputarlms);