const { Client, LocalAuth, MessageMedia, MessageAck } = require('whatsapp-web.js');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const app = express();
const { MongoStore } = require('wwebjs-mongo');

const server = require('http').Server(app);
const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:5173'
}
});

dotenv.config();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

const qrcode = require('qrcode-terminal');
const puppeteer = require('puppeteer')

const progresswa = require('./model/progress_wa');
const pertanyaanumum = require('./model/pertanyaan_umum')
const timelineakademik = require('./model/timeline_akademik')
const periodepembayaran = require('./model/periode_pembayaran')
const seputarlms = require('./model/seputar_lms')
const seputarsap = require('./model/seputar_sap');
const nomorhpdefault = require('./model/nomorhp_default')
const sessions = require('./model/session')
const { response } = require('express');
const { Session } = require('inspector');

const backtomenu = '0. Kembali ke menu utama';

let kalimatAwal = 'Silahkan pilih salah satu layanan yang anda inginkan: ';
let pilihantimeline = 'Berikut ini pertanyaan seputar TimeLine Akademik:';
let pilihanpembayaran = 'Berikut ini pertanyaan seputar Pembayaran:';
let pilihansap = 'Berikut ini pertanyaan seputar SAP:';
let pilihanlms = 'Berikut ini pertanyaan seputar LMS';

let qrstring 
let contactnumber;
let client = new Client({});
let client1;


const databaseUrl = process.env.DATABASE_URL;
mongoose.connect(databaseUrl);
const database = mongoose.connection;

database.once("connected", () => {
    console.log("connected to MongoDB database")
});

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

const delay = 4000;

try {
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
} catch (error) {
    console.log(error)
}

io.on("connection", (socket) => {
    console.log("a user connected", socket.id);
    socket.on("disconnected", () => {
        console.log("user disconnected");
    })
})