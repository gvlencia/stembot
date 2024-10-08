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
    origin: 'http://localhost:3000'
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


const backtomenu = '0. Kembali ke menu utama';

let kalimatAwal = 'Silahkan pilih salah satu layanan yang anda inginkan: ';
let pilihantimeline = 'Berikut ini pertanyaan seputar TimeLine Akademik:';
let pilihanpembayaran = 'Berikut ini pertanyaan seputar Pembayaran:';
let pilihansap = 'Berikut ini pertanyaan seputar SAP:';
let pilihanlms = 'Berikut ini pertanyaan seputar LMS';

let qrstring 
let contactnumber;
let client;
let client1;
let status_socket = false;


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


const ceknomor = nomorhpdefault.findOne({});
ceknomor.then(async (data) => {
    if(data){
        console.log(data.phonenumber + ' data ditemukan')
        loadWhatsappSession(data.phonenumber)
    } else {
        console.log("Need Login")
    }
})

const createWhatsappSession = (nomorhp, socket) => {
    console.log('bikin client baru')
    client = new Client({
        authStrategy : new LocalAuth({
            clientId: nomorhp
        }),
        puppeteer : {
            headless : true
        }, 
    });
    

    client.on('qr', qr => {
        console.log("bikin QR")
        qrstring = qr
        socket.emit('qr', {qrstring});
    });

    client.on('authenticated', () => {
        console.log('Client authenticated using saved session!')
    });

    client.on('ready', () => {
        const connected = "Connect!!!"
        socket.emit('status', {connected})
        const newData = new nomorhpdefault({
            phonenumber : nomorhpinput,
        });
        newData.save()
    });
    client.initialize();

    chatWhatsApp(client);
}

const loadWhatsappSession = (nomorhp, socket) => {
    console.log("Loading client")
    client = new Client({
        authStrategy : new LocalAuth({
            clientId: nomorhp
        }),
        puppeteer : {
            headless : true
        }, 
    });

    client.on('authenticated', () => {
        status_socket = true
        console.log('Client authenticated using saved session!')
    });

    client.on('ready', () => {
        const connected = "Connect!!!"
        if(socket){
            socket.emit('status', {connected})
        }
    });

    client.initialize();
    chatWhatsApp(client);
}

const singoutWhatsappSession = (socket) => {
    const ceknomor = nomorhpdefault.findOne({})
        let nomorhphapus;
        ceknomor.then(async (data) => {
            nomorhphapus = data.phonenumber.toString()
            console.log(nomorhphapus)
            await nomorhpdefault.deleteOne({phonenumber: nomorhphapus})
        })

    client.on('disconnected', (reason) => {
        console.log('disconnet whatsapp-bot', reason);
    });
    client.destroy().then(() => {
        console.log('Client disconnected successfully.');
      })
      .catch((error) => {
        console.error('Error while disconnecting:', error);
      });

    const logoutdone = "LogOut!!!"
    socket.emit('logoutdone', {logoutdone}) 
}

io.on('connection', (socket) => {
    console.log(`Socket ${socket.id} connected`);

    if(status_socket){
        const connected = "Connect!!!"
        socket.emit('status', {connected})
    }

    const ceknomor = nomorhpdefault.findOne({});
    ceknomor.then(async (data) => {
        if(data){
            console.log(data.phonenumber + ' data ditemukan')
            const nomorlogin = data.phonenumber
            socket.emit('nomorlogin', {nomorlogin})
        }
    })

    socket.on('login', (nomorhp) => {
        nomorhpinput = nomorhp.nomorhp;
        const ceknomor = nomorhpdefault.findOne({phonenumber : nomorhpinput});
        ceknomor.then(async (data) => {
            if(data){
                console.log(nomorhpinput + ' data ditemukan')
                loadWhatsappSession(nomorhpinput, socket)
            } else {
                createWhatsappSession(nomorhpinput, socket)
            }
        })
        
    })

    socket.on('loginbroadcast', (nomorhp) => {
        nomorhpbroadcast = nomorhp.nomorhpbroadcast
        loadWhatsappSession(nomorhpbroadcast, socket)
    })

    socket.on('broadcast', async (phonenumbers) => {
        WhatsappBroadcast(phonenumbers);
    })

    socket.on('signout', async (signout) => {
        singoutWhatsappSession(socket);
    })
})

const WhatsappBroadcast = async (phonenumbers) => {
    for (let i = 0; i < phonenumbers.phonenumbers.length; i++) {
        const number = phonenumbers.phonenumbers[i];
        try{
            const number_details = await client.getNumberId(number);
            await client.sendMessage(number_details._serialized, phonenumbers.message);
            console.log('Message sent successfully to', number);
        } catch (error) {
            console.error('Error sending message to', number, error);
        }

        await sleep(delay);
    }
}

const chatWhatsApp = (client) => {
    client.on('message', async (message) => {
    
        contactnumber = message.from;
        console.log(contactnumber);
        console.log(message.body);
    
        const query = progresswa.findOne({ nohp : contactnumber});
        query.then(async (data) => {
            console.log('Data:', data);
            if(!data || data.status == false){
                if ((message.body).toLowerCase().includes('halo stembot')){
                    // if(message.body == "Halo STEMBot"){
                    if (!data){
                        kalimatAwal = 'Silahkan pilih salah satu layanan yang anda inginkan: ';
                        const pertanyaan = pertanyaanumum.find({});
                        pertanyaan.then((data) => {
                            data.forEach((item, index) => {
                                kalimatAwal += `\n${index + 1}. ${item.pertanyaan}`;
                            })
                        })
                        const newData = new progresswa({
                            nohp : contactnumber,
                            layanan : "Begin",
                            status : true,
                        });
                        newData.save()
                        .then(() => {
                            client.sendMessage(message.from, 'Halo, Selamat Datang di layanan Akademik STEM Prasetiya Mulya');
                            client.sendMessage(message.from, kalimatAwal); 
                        })
                        .catch((err) => {
                            console.error(err);
                        });
                    } else if (data.status == false){
                        kalimatAwal = 'Silahkan pilih salah satu layanan yang anda inginkan: ';
                        const pertanyaan = pertanyaanumum.find({});
                        pertanyaan.then((data) => {
                            data.forEach((item, index) => {
                                kalimatAwal += `\n${index + 1}. ${item.pertanyaan}`;
                            })
                        })
                        progresswa.updateOne(
                            {nohp : contactnumber},
                            { $set : {layanan : "Begin", status : true} },
                        ) .then(() => {
                            client.sendMessage(message.from, 'Halo, Selamat Datang di layanan Akademik STEM Prasetiya Mulya');
                            client.sendMessage(message.from, kalimatAwal); 
                        })
                        .catch((err) => {
                            console.error(err);
                        });
                    } else {
                        kalimatAwal = 'Silahkan pilih salah satu layanan yang anda inginkan: ';
                        const pertanyaan = pertanyaanumum.find({});
                        pertanyaan.then((data) => {
                            data.forEach((item, index) => {
                                kalimatAwal += `\n${index + 1}. ${item.pertanyaan}`;
                            })
                        })
                        progresswa.updateOne(
                            {nohp : contactnumber},
                            { $set : {layanan : "Begin", status : true} },
                        ) .then(() => {
                            client.sendMessage(message.from, 'Halo, Selamat Datang di layanan Akademik STEM Prasetiya Mulya');
                            client.sendMessage(message.from, kalimatAwal); 
                        })
                        .catch((err) => {
                            console.error(err);
                        });
                    }
                } else {
                    client.sendMessage(message.from, "Anda dapat memanggil ChatBot STEM dengan mengirimkan pesan: Halo STEMBot ")
                }
            }
            else if (data.layanan == "Begin"){
                console.log(data.layanan)
                const pertanyaan = pertanyaanumum.find({});
                let shouldSkip = false;
                let norespon = false;
                pertanyaan.then((data) => {
                    data.forEach((item, index) => {
                        if(shouldSkip){
                            return;
                        }
                        if (message.body == index+1){
                            norespon = false;
                            shouldSkip = true;
                            message.reply(item.jawaban);
                            if(message.body == 1){
                                pilihantimeline = 'Berikut ini pertanyaan seputar TimeLine Akademik:';
                                const timeline = timelineakademik.find({});
                                timeline.then((data) => {
                                    
                                    data.forEach((item, index) => {
                                        pilihantimeline += `\n${index + 1}. ${item.pertanyaan}`;
                                    })
                                })
                                norespon = false;
                                shouldSkip = true;
                                progresswa.updateOne(
                                    {nohp : contactnumber},
                                    { $set : {layanan : "TimeLine"} },
                                ) .then(() => {
                                    client.sendMessage(message.from, pilihantimeline + '\n' + backtomenu);
                                })
                                .catch((err) => {
                                    console.error(err);
                                });
                            }
                            else if(message.body == 2){
                                pilihanpembayaran = 'Berikut ini pertanyaan seputar Pembayaran:';
                                const pembayaran = periodepembayaran.find({});
                                pembayaran.then((data) => {
                                    data.forEach((item, index) => {
                                        pilihanpembayaran += `\n${index + 1}. ${item.pertanyaan}`;
                                    })
                                })
                                norespon = false;
                                shouldSkip = true;
                                // localStorage.setItem(contact.number, "Pembayaran")
                                progresswa.updateOne(
                                    {nohp : contactnumber},
                                    { $set : {layanan : "Pembayaran"} },
                                ) .then(() => {
                                    client.sendMessage(message.from, pilihanpembayaran+ '\n' + backtomenu);
                                })
                                .catch((err) => {
                                    console.error(err);
                                });
                            }
                            else if(message.body == 3){
                                norespon = false;
                                shouldSkip = true;
                                // localStorage.setItem(contact.number, "Ending")
                                progresswa.updateOne(
                                    {nohp : contactnumber},
                                    { $set : {layanan : "Ending"} },
                                ).then(() => {
                                    client.sendMessage(message.from, 'Apakah ada yang bisa dibantu lagi? \n\nBalas dengan Ya atau Tidak');
                                })
                                .catch((err) => {
                                    console.error(err);
                                });  
                            }  
                            else if(message.body == 4){
                                pilihansap = 'Berikut ini pertanyaan seputar SAP:';
                                const sap = seputarsap.find({});
                                sap.then((data) => {
                                    data.forEach((item, index) => {
                                        pilihansap += `\n${index + 1}. ${item.pertanyaan}`;
                                    })
                                })
                                norespon = false;
                                shouldSkip = true;
                                // localStorage.setItem(contact.number, "SAP")
                                progresswa.updateOne(
                                    {nohp : contactnumber},
                                    { $set : {layanan : "SAP"} },
                                ).then(() => {
                                    client.sendMessage(message.from, pilihansap+ '\n' + backtomenu);
                                })
                                .catch((err) => {
                                    console.error(err);
                                });  
                            }
                            else if(message.body == 5){
                                pilihanlms = 'Berikut ini pertanyaan seputar LMS';
                                const lms = seputarlms.find({});
                                lms.then((data) => {
                                    data.forEach((item, index) => {
                                        pilihanlms += `\n${index + 1}. ${item.pertanyaan}`;
                                    })
                                })
                                norespon = false;
                                shouldSkip = true;
                                // localStorage.setItem(contact.number, "LMS")
                                progresswa.updateOne(
                                    {nohp : contactnumber},
                                    { $set : {layanan : "LMS"} },
                                ).then(() => {
                                    client.sendMessage(message.from, pilihanlms+ '\n' + backtomenu);
                                })
                                .catch((err) => {
                                    console.error(err);
                                }); 
                            }
                            else if(message.body == 6){
                                norespon = false;
                                shouldSkip = true;
                                // localStorage.setItem(contact.number, "Ending")
                                progresswa.updateOne(
                                    {nohp : contactnumber},
                                    { $set : {layanan : "Ending"} },
                                ).then(() => {
                                    client.sendMessage(message.from, 'Apakah ada yang bisa dibantu lagi? \n\nBalas dengan Ya atau Tidak');
                                })
                                .catch((err) => {
                                    console.error(err);
                                }); 
                            }  
                            else if(message.body == 7){
                                norespon = false;
                                shouldSkip = true;
                                // localStorage.setItem(contact.number, "Ending")
                                progresswa.updateOne(
                                    {nohp : contactnumber},
                                    { $set : {layanan : "Ending"} },
                                ).then(() => {
                                    client.sendMessage(message.from, 'Apakah ada yang bisa dibantu lagi? \n\nBalas dengan Ya atau Tidak');
                                })
                                .catch((err) => {
                                    console.error(err);
                                }); 
                            }
                        }
                        else {
                            console.log("masuk sini")
                            norespon = true;
                        }
                    });
                    if(norespon == true) {
                        norespon = false;
                        client.sendMessage(message.from, 'Mohon maaf kami tidak memahami respon anda.');
                        kalimatAwal = 'Silahkan pilih salah satu layanan yang anda inginkan: ';
                        const pertanyaan = pertanyaanumum.find({});
                        pertanyaan.then((data) => {
                            data.forEach((item, index) => {
                                kalimatAwal += `\n${index + 1}. ${item.pertanyaan}`;
                            })
                            client.sendMessage(message.from, kalimatAwal);
                        })
                        
                    }
                });
    
            }
            // else if (localStorage.getItem(contact.number) == "TimeLine"){
            else if (data.layanan == "TimeLine" && data.status == true){
                if (message.body == '0'){
                    kalimatAwal = 'Silahkan pilih salah satu layanan yang anda inginkan: ';
                        const pertanyaan = pertanyaanumum.find({});
                        pertanyaan.then((data) => {
                            data.forEach((item, index) => {
                                kalimatAwal += `\n${index + 1}. ${item.pertanyaan}`;
                            })
                        })
                    progresswa.updateOne(
                        {nohp : contactnumber},
                        { $set : {layanan : "Begin"} },
                    ).then(() => {
                        norespon = false;
                        client.sendMessage(message.from, kalimatAwal);
                    })
                    .catch((err) => {
                        console.error(err);
                    }); 
                } else {
                    let shouldSkip = false;
                    let norespon = false;
                    const timeline = timelineakademik.find({});
                    timeline.then((data) => {
                        data.forEach((item, index) => {
                            if (shouldSkip) {
                                return;
                            }
                            if(message.body == index+1){
                                norespon = false;
                                shouldSkip = true;
                                                    
                                progresswa.updateOne(
                                    {nohp : contactnumber},
                                    { $set : {layanan : "Ending"} },
                                ).then(() => {
                                    client.sendMessage(message.from, item.jawaban);
                                    client.sendMessage(message.from, 'Apakah ada yang bisa dibantu lagi? \n\nBalas dengan Ya atau Tidak');
                                })
                                .catch((err) => {
                                    console.error(err);
                                }); 
                            }
                            else {
                                norespon = true;
                                console.log(norespon)
                            }
                        });
                        if (norespon == true){
                            norespon = false;
                            client.sendMessage(message.from, 'Mohon maaf kami tidak memahami respon anda. \nSilahkan kembali memilih berdasarkan pilihan tersebut yey:');
                            pilihantimeline = 'Berikut ini pertanyaan seputar TimeLine Akademik:';
                            const timeline = timelineakademik.find({});
                            timeline.then((data) => {
                                data.forEach((item, index) => {
                                    pilihantimeline += `\n${index + 1}. ${item.pertanyaan}`;
                                })
                                client.sendMessage(message.from, pilihantimeline + '\n' + backtomenu);
                            })
                            
                            
                        }
                    });
                }
            }
        
            // else if (localStorage.getItem(contact.number) == "Pembayaran"){
            else if (data.layanan == "Pembayaran" && data.status == true){
                if (message.body == '0'){
                    kalimatAwal = 'Silahkan pilih salah satu layanan yang anda inginkan: ';
                        const pertanyaan = pertanyaanumum.find({});
                        pertanyaan.then((data) => {
                            data.forEach((item, index) => {
                                kalimatAwal += `\n${index + 1}. ${item.pertanyaan}`;
                            })
                        })
                    // localStorage.setItem(contact.number, "Begin")
                    progresswa.updateOne(
                        {nohp : contactnumber},
                        { $set : {layanan : "Begin"} },
                    ).then (() => {
                        norespon = false;
                        client.sendMessage(message.from, kalimatAwal);
                        
                    })
                    .catch((err) => {
                        console.error(err);
                    }); 
                    
                } else {
                    let shouldSkip = false;
                    let norespon = false;
                    const pembayaran = periodepembayaran.find({});
                    pembayaran.then((data) => {
                        data.forEach((item, index) => {
                            if (shouldSkip) {
                                return;
                            }
                            if(message.body == index+1){
                                norespon = false;
                                shouldSkip = true;
                                progresswa.updateOne(
                                    {nohp : contactnumber},
                                    { $set : {layanan : "Ending"} },
                                ).then(() => {
                                    client.sendMessage(message.from, item.jawaban);
                                    client.sendMessage(message.from, 'Apakah ada yang bisa dibantu lagi? \n\nBalas dengan Ya atau Tidak');
                                })
                                .catch((err) => {
                                    console.error(err);
                                }); 
                            }
                            else {
                                norespon = true;
                            }
                        });
                        if (norespon === true){
                            norespon = false;
                            client.sendMessage(message.from, 'Mohon maaf kami tidak memahami respon anda. \nSilahkan kembali memilih berdasarkan pilihan tersebut:');
                            pilihanpembayaran = 'Berikut ini pertanyaan seputar Pembayaran:';
                                const pembayaran = periodepembayaran.find({});
                                pembayaran.then((data) => {
                                    data.forEach((item, index) => {
                                        pilihanpembayaran += `\n${index + 1}. ${item.pertanyaan}`;
                                    })
                                    client.sendMessage(message.from, pilihanpembayaran + '\n' + backtomenu);
                                })
                            
                        }
                    });
    
                }
            }
        
            // else if (localStorage.getItem(contact.number) == "SAP"){
            else if (data.layanan == "SAP" && data.status == true){
                if (message.body == '0'){
                    kalimatAwal = 'Silahkan pilih salah satu layanan yang anda inginkan: ';
                        const pertanyaan = pertanyaanumum.find({});
                        pertanyaan.then((data) => {
                            data.forEach((item, index) => {
                                kalimatAwal += `\n${index + 1}. ${item.pertanyaan}`;
                            })
                        })
                    // localStorage.setItem(contact.number, "Begin")
                    progresswa.updateOne(
                        {nohp : contactnumber},
                        { $set : {layanan : "Begin"} },
                    ).then(() => {
                        client.sendMessage(message.from, kalimatAwal);
                        norespon = false;
                    })
                    .catch((err) => {
                        console.error(err);
                    });
                } else {
                    let shouldSkip = false;
                    let norespon = false;
                    const sap = seputarsap.find({});
                    sap.then((data) => {
                        data.forEach((item, index) => {
                            if (shouldSkip) {
                                return;
                            }
                            if(message.body == index+1){
                                norespon = false;
                                shouldSkip = true;
                                // localStorage.setItem(contact.number, "Ending")
                                progresswa.updateOne(
                                    {nohp : contactnumber},
                                    { $set : {layanan : "Ending"} },
                                ).then(() => {
                                    client.sendMessage(message.from, item.jawaban);
                                    client.sendMessage(message.from, 'Apakah ada yang bisa dibantu lagi? \n\nBalas dengan Ya atau Tidak'); 
                                })
                                .catch((err) => {
                                    console.error(err);
                                });
                            }
                            else {
                                norespon = true;
                            }
                        });
                        if (norespon == true){
                            norespon = false;
                            client.sendMessage(message.from, 'Mohon maaf saya tidak memahami respon anda.\nSilahkan kembali memilih berdasarkan pilihan tersebut:');
                            pilihansap = 'Berikut ini pertanyaan seputar SAP:';
                                const sap = seputarsap.find({});
                                sap.then((data) => {
                                    data.forEach((item, index) => {
                                        pilihansap += `\n${index + 1}. ${item.pertanyaan}`;
                                    })
                                    client.sendMessage(message.from, pilihansap + '\n' + backtomenu);
                                })
                        }
                    });
                }
            }
            else if (data.layanan == "LMS" && data.status == true){
                if (message.body == '0'){
                    kalimatAwal = 'Silahkan pilih salah satu layanan yang anda inginkan: ';
                        const pertanyaan = pertanyaanumum.find({});
                        pertanyaan.then((data) => {
                            data.forEach((item, index) => {
                                kalimatAwal += `\n${index + 1}. ${item.pertanyaan}`;
                            })
                        })
                    progresswa.updateOne(
                        {nohp : contactnumber},
                        { $set : {layanan : "Begin"} },
                    ).then(() => {
                        norespon = false;
                        client.sendMessage(message.from, kalimatAwal);
                    })
                    .catch((err) => {
                        console.error(err);
                    });
                } else {
                    let shouldSkip = false;
                    let norespon = false;
                    const lms = seputarlms.find({});
                    lms.then((data) => {
                        data.forEach((item, index) => {
                            if (shouldSkip) {
                                return;
                            }
                            if(message.body == index+1){
                                shouldSkip = true;
                                norespon = false;
                                progresswa.updateOne(
                                    {nohp : contactnumber},
                                    { $set : {layanan : "Ending"} },
                                ).then(() => {
                                    client.sendMessage(message.from, item.jawaban);
                                    client.sendMessage(message.from, 'Apakah ada yang bisa dibantu lagi? \n\nBalas dengan Ya atau Tidak');
                                })
                                .catch((err) => {
                                    console.error(err);
                                });
                            }
                            else {
                                norespon = true;
                            }
                        });
                        if (norespon == true){
                            norespon = false;
                            client.sendMessage(message.from, 'Mohon maaf saya tidak memahami respon anda.\nSilahkan kembali memilih berdasarkan pilihan tersebut:');
                            pilihanlms = 'Berikut ini pertanyaan seputar LMS';
                                const lms = seputarlms.find({});
                                lms.then((data) => {
                                    data.forEach((item, index) => {
                                        pilihanlms += `\n${index + 1}. ${item.pertanyaan}`;
                                    })
                                    client.sendMessage(message.from, pilihanlms + '\n' + backtomenu);
                                })
                            
                        }
                    });
                }
            }
        
            // else if(localStorage.getItem(contact.number) == "Ending"){
            else if (data.layanan == "Ending" && data.status == true){
                if ((message.body).toLowerCase().includes('ya')){
                    kalimatAwal = 'Silahkan pilih salah satu layanan yang anda inginkan: ';
                        const pertanyaan = pertanyaanumum.find({});
                        pertanyaan.then((data) => {
                            data.forEach((item, index) => {
                                kalimatAwal += `\n${index + 1}. ${item.pertanyaan}`;
                            })
                        })
                    // localStorage.setItem(contact.number, "Begin")
                    progresswa.updateOne(
                        {nohp : contactnumber},
                        { $set : {layanan : "Begin"} },
                    ).then(() => {
                        client.sendMessage(message.from, kalimatAwal);
                    })
                    .catch((err) => {
                        console.error(err);
                    });
                }
                else if ((message.body).toLowerCase().includes('tidak')){
                    
                    // localStorage.removeItem(contact.number)
                    progresswa.updateOne(
                        {nohp : contactnumber},
                        { $set : {status : false} },
                    ).then(()=> {
                        client.sendMessage(message.from, 'Terima kasih sudah menghubungi layanan Akademik STEM Prasetiya Mulya');
                    })
                    .catch((err) => {
                        console.error(err);
                    });
                } else {
                    client.sendMessage(message.from, 'Mohon maaf saya tidak memahami respon anda.\nSilahkan kembali memilih berdasarkan pilihan tersebut:');
                    client.sendMessage(message.from, 'Apakah ada yang bisa dibantu lagi? \n\nBalas dengan Ya atau Tidak');
                }
            }
           
        })
            .catch((err) => {
                console.error(err);
        });
    });
}




