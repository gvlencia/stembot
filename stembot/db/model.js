const mongoose = require('mongoose');
const { Schema } = mongoose;



const pertanyaanumum= new Schema ({
    pertanyaan : String,
    jawaban : String
})

// const timelineakademik= new Schema ({
//     pertanyaan : String,
//     jawaban : String
// })

// const periodepembayaran= new Schema ({
//     pertanyaan : String,
//     jawaban : String
// })

// const seputarlms= new Schema ({
//     pertanyaan : String,
//     jawaban : String
// })

// const seputarsap= new Schema ({
//     pertanyaan : String,
//     jawaban : String
// })

// module.exports = mongoose.model('timelineakademik', timelineakademik);
module.exports = mongoose.model('pertanyaanumum', pertanyaanumum);
// module.exports = mongoose.model('periodepembayaran', periodepembayaran);
// module.exports = mongoose.model('seputarlms', seputarlms);
// module.exports = mongoose.model('seputarsap', seputarsap);
