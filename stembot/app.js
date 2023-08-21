const { Client, LocalAuth, MessageMedia, RemoteAuth} = require('whatsapp-web.js');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const app = express();
const { MongoStore } = require('wwebjs-mongo');
const schedule = require('node-schedule');

const server = require('http').Server(app);
const io = require('socket.io')(server, {
  cors: {
    origin: 'https://simantap.kaospoloskato.com/',
    methods: ["GET", "POST"]
}
});

//halo

dotenv.config();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

const qrcode = require('qrcode-terminal');


const progresswa = require('./model/progress_wa');
const pertanyaanumum = require('./model/pertanyaan_umum')
const timelineakademik = require('./model/timeline_akademik')
const periodepembayaran = require('./model/periode_pembayaran')
const seputarlms = require('./model/seputar_lms')
const seputarsap = require('./model/seputar_sap');
const nomorhpdefault = require('./model/nomorhp_default')
const nomorhpbroadcast = require('./model/nomorhp_broadcast')


const backtomenu = '0. Kembali ke menu utama';

let kalimatAwal = 'Silahkan pilih salah satu layanan yang anda inginkan: ';
let pilihantimeline = 'Berikut ini pertanyaan seputar TimeLine Akademik:';
let pilihanpembayaran = 'Berikut ini pertanyaan seputar Pembayaran:';
let pilihansap = 'Berikut ini pertanyaan seputar SAP:';
let pilihanlms = 'Berikut ini pertanyaan seputar LMS';

let qrstring 
let contactnumber;
let client;
let clientbroadcast;
let status_socket = false;

let store;


const databaseUrl = process.env.DATABASE_URL;
mongoose.connect(databaseUrl).then(() => {
    store = new MongoStore({ mongoose : mongoose });
});
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

const createWhatsappSession = (nomorhp, socket) => {
    console.log('bikin client baru')
    client = new Client({
        authStrategy : new RemoteAuth({
            store: store,
            backupSyncIntervalMs: 300000,
            clientId: nomorhp // Setting clientId using the nomorhp value
        })
    });
    
    client.on('qr', qr => {
        qrstring = qr
        socket.emit('qr', {qrstring});
    });

    client.on('authenticated', () => {
        console.log('Client authenticated using remote session!')
    });

    client.on('remote_session_saved', () => {
        console.log("remote_session_saved");
     })

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
        authStrategy: new RemoteAuth({
            store: store,
            backupSyncIntervalMs: 300000,
            clientId: nomorhp // Setting clientId using the nomorhp value
        })
    });

    client.on('qr', qr => {
        console.log("bikin QR")
        qrstring = qr
        socket.emit('qr', {qrstring});
    });

    client.on('authenticated', () => {
        console.log('Client authenticated using remote session!')
        
    });

    client.on('ready', () => {
        const connected = "Connect!!!"
        if(socket){
            socket.emit('status', {connected})
        }
    });
    client.on('remote_session_saved', () => {
        console.log("remote_session_saved");
     })

    client.initialize();
    chatWhatsApp(client);
}

const createWhatsappSessionBroadcast = (nomorhp, socket) => {
    console.log('bikin client baru')
    clientbroadcast = new Client({
        authStrategy : new LocalAuth({
            clientId: nomorhp
        }),
    });
    

    clientbroadcast.on('qr', qr => {
        qrstring = qr
        socket.emit('qr', {qrstring});
    });

    clientbroadcast.on('authenticated', () => {
        console.log('Client authenticated using saved session!')
    });

    clientbroadcast.on('ready', () => {
        const connected = "Connect!!!"
        socket.emit('status', {connected})
        const newData = new nomorhpbroadcast({
            phonenumber : nomorhpinput,
        });
        newData.save()
    });
    clientbroadcast.initialize();

}

const loadWhatsappSessionBroadcast = (nomorhp, socket) => {
    console.log("Loading client")
    clientbroadcast = new Client({
        authStrategy : new LocalAuth({
            clientId: nomorhp
        }),
 
    });

    clientbroadcast.on('authenticated', () => {
        status_socket = true
        console.log('Client authenticated using saved session!')
    });

    clientbroadcast.on('ready', () => {
        const connected = "Connect!!!"
        if(socket){
            socket.emit('status', {connected})
        }
    });

    clientbroadcast.initialize();
}

const signoutWhatsappSession = (socket) => {
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

const signoutWhatsappSessionBroadcast = (nomorhp, socket) => {
    const ceknomor = nomorhpbroadcast.findOne({})
        let nomorhphapus;
        ceknomor.then(async (data) => {
            nomorhphapus = data.phonenumber.toString()
            console.log(nomorhphapus)
            await nomorhpbroadcast.deleteOne({phonenumber: nomorhphapus})
        })

    clientbroadcast.on('disconnected', (reason) => {
        console.log('disconnet whatsapp-bot', reason);
    });
    clientbroadcast.destroy().then(() => {
        console.log('Client disconnected successfully.');
      })
      .catch((error) => {
        console.error('Error while disconnecting:', error);
      });

    const logoutdone = "LogOut!!!"
    socket.emit('logoutdone', {logoutdone}) 
}

io.on('connection', (socket) => {

    if(status_socket){
        const connected = "Connect!!!"
        socket.emit('status', {connected})
    }

    const ceknomor = nomorhpdefault.findOne({});
    ceknomor.then(async (data) => {
        if(data){
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
        nomorhpinput = nomorhp.nomorhp;
        const ceknomor = nomorhpdefault.findOne({phonenumber : nomorhpinput});
        ceknomor.then(async (data) => {
            if(data){
                console.log(nomorhpinput + ' data ditemukan')
                loadWhatsappSessionBroadcast(nomorhpinput, socket)
            } else {
                createWhatsappSessionBroadcast(nomorhpinput, socket)
            }
        })
    })

    socket.on('broadcast', async (phonenumbers) => {
        const date = new Date(phonenumbers.jadwal)
        console.log(`Broadcast scheduled for : ${date}`)
        const job = schedule.scheduleJob(date, async () => {
            WhatsappBroadcast(phonenumbers, socket)
        });
    })

    socket.on('signout', async (signout) => {
        signoutWhatsappSession(socket);
    })
    socket.on('signoutbroadcast', async (signout) => {
        signoutWhatsappSessionBroadcast(socket);
    })
})

const WhatsappBroadcast = async (phonenumbers, socket) => {
    for (let i = 0; i < phonenumbers.phonenumbers.length; i++) {
        const number = phonenumbers.phonenumbers[i];
        const percent = ((i+1)/phonenumbers.phonenumbers.length)*100
        try{
            const number_details = await client.getNumberId(number.value);
            if (phonenumbers.media){
                const media = await MessageMedia.fromUrl(phonenumbers.media);
                await chat.sendMessage(number_details._serialized, media)
            }
            await client.sendMessage(number_details._serialized, phonenumbers.message);
            console.log('Message sent successfully to', number.label);
            const nama = number.label
            socket.emit('sendsuccess', (nama))
            socket.emit('percen', (percent))
        } catch (error) {
            console.error('Error sending message to', number.label, error);
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
                    
                    if (!data){
                        kalimatAwal = 'Silahkan pilih salah satu layanan yang anda inginkan: ';
                        try {
                            const pertanyaan = await pertanyaanumum.find({}); 
                        
                            pertanyaan.then((data) => {
                                data.forEach((item, index) => {
                                    kalimatAwal += `\n${index + 1}. ${item.pertanyaan}`;
                                })
                            })
                        
                            const newData = new progresswa({
                                nohp: contactnumber,
                                layanan: 'Begin',
                                status: true,
                            });
                        
                            await newData.save();
                        
                            await client.sendMessage(message.from, 'Halo, Selamat Datang di layanan Akademik STEM Prasetiya Mulya');
                            await client.sendMessage(message.from, kalimatAwal);
                        } catch (err) {
                            console.error(err);
                        }
                    } else if (data.status == false){
                        kalimatAwal = 'Silahkan pilih salah satu layanan yang anda inginkan: ';
                        try{
                            const pertanyaan = pertanyaanumum.find({});
                            pertanyaan.then((data) => {
                                data.forEach((item, index) => {
                                    kalimatAwal += `\n${index + 1}. ${item.pertanyaan}`;
                                })
                            })
                            await progresswa.updateOne(
                                {nohp : contactnumber},
                                { $set : {layanan : "Begin", status : true} },
                            );

                            await client.sendMessage(message.from, 'Halo, Selamat Datang di layanan Akademik STEM Prasetiya Mulya');
                            await client.sendMessage(message.from, kalimatAwal); 
                            
                        } catch (err) {
                            console.error(err);
                        }
                    } else {
                        kalimatAwal = 'Silahkan pilih salah satu layanan yang anda inginkan: ';
                        try{
                            const pertanyaan = pertanyaanumum.find({});
                            pertanyaan.then((data) => {
                                data.forEach((item, index) => {
                                    kalimatAwal += `\n${index + 1}. ${item.pertanyaan}`;
                                })
                            });

                            await progresswa.updateOne(
                                {nohp : contactnumber},
                                { $set : {layanan : "Begin", status : true} },
                            );

                            await client.sendMessage(message.from, 'Halo, Selamat Datang di layanan Akademik STEM Prasetiya Mulya');
                            await client.sendMessage(message.from, kalimatAwal); 
                        } catch (err) {
                            console.error(err);
                        }
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
                pertanyaan.then(async (data) => {
                    data.forEach(async (item, index) => {
                        if(shouldSkip){
                            return;
                        }
                        if (message.body == index+1){
                            norespon = false;
                            shouldSkip = true;
                            message.reply(item.jawaban);

                            if(message.body == 1){
                                pilihantimeline = 'Berikut ini pertanyaan seputar TimeLine Akademik:';
                                try{
                                    const timeline = timelineakademik.find({});
                                    timeline.then((data) => {
                                        data.forEach((item, index) => {
                                            pilihantimeline += `\n${index + 1}. ${item.pertanyaan}`;
                                        })
                                    })

                                    norespon = false;
                                    shouldSkip = true;
                                    
                                    await progresswa.updateOne(
                                        {nohp : contactnumber},
                                        { $set : {layanan : "TimeLine"} },
                                    )

                                    await client.sendMessage(message.from, pilihantimeline + '\n' + backtomenu);
                                    
                                } catch (err) {
                                    console.error(err);
                                } 
                            }
                            else if(message.body == 2){
                                pilihanpembayaran = 'Berikut ini pertanyaan seputar Pembayaran:';
                                try{
                                    const pembayaran = periodepembayaran.find({});
                                    pembayaran.then((data) => {
                                        data.forEach((item, index) => {
                                            pilihanpembayaran += `\n${index + 1}. ${item.pertanyaan}`;
                                        })
                                    })

                                    norespon = false;
                                    shouldSkip = true;
                                    await progresswa.updateOne(
                                        {nohp : contactnumber},
                                        { $set : {layanan : "Pembayaran"} },
                                    ) 

                                    await client.sendMessage(message.from, pilihanpembayaran+ '\n' + backtomenu);

                                } catch (err) {
                                    console.error(err);
                                } 
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
                                try{
                                    const sap = seputarsap.find({});
                                    sap.then((data) => {
                                        data.forEach((item, index) => {
                                            pilihansap += `\n${index + 1}. ${item.pertanyaan}`;
                                        })
                                    })
                                    norespon = false;
                                    shouldSkip = true;

                                    await progresswa.updateOne(
                                        {nohp : contactnumber},
                                        { $set : {layanan : "SAP"} },
                                    );

                                    await client.sendMessage(message.from, pilihansap+ '\n' + backtomenu);

                                } catch (err) {
                                    console.error(err);
                                } 
                            }
                            else if(message.body == 5){
                                pilihanlms = 'Berikut ini pertanyaan seputar LMS';
                                try{
                                    const lms = seputarlms.find({});
                                    lms.then((data) => {
                                        data.forEach((item, index) => {
                                            pilihanlms += `\n${index + 1}. ${item.pertanyaan}`;
                                        })
                                    });
                                    norespon = false;
                                    shouldSkip = true;

                                    await progresswa.updateOne(
                                        {nohp : contactnumber},
                                        { $set : {layanan : "LMS"} },
                                    );
                                    await client.sendMessage(message.from, pilihanlms+ '\n' + backtomenu);

                                } catch (err) {
                                    console.error(err);
                                }  
                            }
                            else if(message.body == 6){
                                norespon = false;
                                shouldSkip = true;
                    
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
                        try{
                            const pertanyaan = pertanyaanumum.find({});
                            pertanyaan.then(async (data) => {
                                data.forEach((item, index) => {
                                    kalimatAwal += `\n${index + 1}. ${item.pertanyaan}`;
                                })
                                await client.sendMessage(message.from, kalimatAwal);
                            })
                            

                        }catch (err) {
                            console.error(err);
                        }   
                    }
                });
    
            }
            // else if (localStorage.getItem(contact.number) == "TimeLine"){
            else if (data.layanan == "TimeLine" && data.status == true){
                if (message.body == 0){
                    kalimatAwal = 'Silahkan pilih salah satu layanan yang anda inginkan: ';
                    try{
                        const pertanyaan = pertanyaanumum.find({});
                        await pertanyaan.then((data) => {
                            data.forEach((item, index) => {
                                kalimatAwal += `\n${index + 1}. ${item.pertanyaan}`;
                            })
                        })
                        await progresswa.updateOne(
                            {nohp : contactnumber},
                            { $set : {layanan : "Begin"} },
                        ).then(async () => {
                            norespon = false;
                            await client.sendMessage(message.from, kalimatAwal);
                        });
                    } catch (err) {
                        console.error(err);
                    }   
                } else {
                    let shouldSkip = false;
                    let norespon = false;
                    const timeline = timelineakademik.find({});
                    await timeline.then(async (data) => {
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
                            try{
                                const timeline = timelineakademik.find({});
                                await timeline.then(async (data) => {
                                    data.forEach((item, index) => {
                                        pilihantimeline += `\n${index + 1}. ${item.pertanyaan}`;
                                    })
                                    await client.sendMessage(message.from, pilihantimeline + '\n' + backtomenu);
                                })
                            } catch (err) {
                                console.error(err);
                            }   
                        }
                    });
                }
            }
        
            // else if (localStorage.getItem(contact.number) == "Pembayaran"){
            else if (data.layanan == "Pembayaran" && data.status == true){
                if (message.body == 0){
                    kalimatAwal = 'Silahkan pilih salah satu layanan yang anda inginkan: ';
                    try{
                        const pertanyaan = pertanyaanumum.find({});
                        await pertanyaan.then((data) => {
                            data.forEach((item, index) => {
                                kalimatAwal += `\n${index + 1}. ${item.pertanyaan}`;
                            })
                        })
                        await progresswa.updateOne(
                            {nohp : contactnumber},
                            { $set : {layanan : "Begin"} },
                        ).then (async () => {
                            norespon = false;
                            await client.sendMessage(message.from, kalimatAwal);
                        })
                    } catch (err) {
                        console.error(err);
                    }     
                } else {
                    let shouldSkip = false;
                    let norespon = false;
                    const pembayaran = periodepembayaran.find({});
                    await pembayaran.then(async (data) => {
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
                                await pembayaran.then(async (data) => {
                                    data.forEach((item, index) => {
                                        pilihanpembayaran += `\n${index + 1}. ${item.pertanyaan}`;
                                    })
                                    await client.sendMessage(message.from, pilihanpembayaran + '\n' + backtomenu);
                                })
                        }
                    });
    
                }
            }
        
            // else if (localStorage.getItem(contact.number) == "SAP"){
            else if (data.layanan == "SAP" && data.status == true){
                if (message.body == 0){
                    kalimatAwal = 'Silahkan pilih salah satu layanan yang anda inginkan: ';
                        const pertanyaan = pertanyaanumum.find({});
                        await pertanyaan.then((data) => {
                            data.forEach((item, index) => {
                                kalimatAwal += `\n${index + 1}. ${item.pertanyaan}`;
                            })
                        })
                    // localStorage.setItem(contact.number, "Begin")
                    await progresswa.updateOne(
                        {nohp : contactnumber},
                        { $set : {layanan : "Begin"} },
                    ).then(async () => {
                       await client.sendMessage(message.from, kalimatAwal);
                        norespon = false;
                    })
                    .catch((err) => {
                        console.error(err);
                    });
                } else {
                    let shouldSkip = false;
                    let norespon = false;
                    const sap = seputarsap.find({});
                    await sap.then(async (data) => {
                        data.forEach(async (item, index) => {
                            if (shouldSkip) {
                                return;
                            }
                            if(message.body == index+1){
                                norespon = false;
                                shouldSkip = true;
                                // localStorage.setItem(contact.number, "Ending")
                                await progresswa.updateOne(
                                    {nohp : contactnumber},
                                    { $set : {layanan : "Ending"} },
                                ).then(async () => {
                                    await client.sendMessage(message.from, item.jawaban);
                                    await client.sendMessage(message.from, 'Apakah ada yang bisa dibantu lagi? \n\nBalas dengan Ya atau Tidak'); 
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
                                await sap.then(async (data) => {
                                    data.forEach((item, index) => {
                                        pilihansap += `\n${index + 1}. ${item.pertanyaan}`;
                                    })
                                    await client.sendMessage(message.from, pilihansap + '\n' + backtomenu);
                                })
                        }
                    });
                }
            }
            else if (data.layanan == "LMS" && data.status == true){
                if (message.body == 0){
                    kalimatAwal = 'Silahkan pilih salah satu layanan yang anda inginkan: ';
                        const pertanyaan = pertanyaanumum.find({});
                        await pertanyaan.then((data) => {
                            data.forEach((item, index) => {
                                kalimatAwal += `\n${index + 1}. ${item.pertanyaan}`;
                            })
                        })
                    await progresswa.updateOne(
                        {nohp : contactnumber},
                        { $set : {layanan : "Begin"} },
                    ).then(async () => {
                        norespon = false;
                        await client.sendMessage(message.from, kalimatAwal);
                    })
                    .catch((err) => {
                        console.error(err);
                    });
                } else {
                    let shouldSkip = false;
                    let norespon = false;
                    const lms = seputarlms.find({});
                    await lms.then(async (data) => {
                        data.forEach(async (item, index) => {
                            if (shouldSkip) {
                                return;
                            }
                            if(message.body == index+1){
                                shouldSkip = true;
                                norespon = false;
                                await progresswa.updateOne(
                                    {nohp : contactnumber},
                                    { $set : {layanan : "Ending"} },
                                ).then(async () => {
                                    await client.sendMessage(message.from, item.jawaban);
                                    await client.sendMessage(message.from, 'Apakah ada yang bisa dibantu lagi? \n\nBalas dengan Ya atau Tidak');
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
                            await lms.then(async (data) => {
                                data.forEach((item, index) => {
                                    pilihanlms += `\n${index + 1}. ${item.pertanyaan}`;
                                });
                                await client.sendMessage(message.from, pilihanlms + '\n' + backtomenu);
                            });
                        }
                    });
                }
            }

            else if (data.layanan == "Ending" && data.status == true){
                if ((message.body).toLowerCase() == 'ya'){
                    kalimatAwal = 'Silahkan pilih salah satu layanan yang anda inginkan: ';

                    const pertanyaan = pertanyaanumum.find({});
                    await pertanyaan.then((data) => {
                        data.forEach((item, index) => {
                            kalimatAwal += `\n${index + 1}. ${item.pertanyaan}`;
                        });
                    });
            
                    await progresswa.updateOne(
                        {nohp : contactnumber},
                        { $set : {layanan : "Begin"} },
                    ).then(async () => {
                        await client.sendMessage(message.from, kalimatAwal);
                    })
                    .catch((err) => {
                        console.error(err);
                    });
                }
                else if ((message.body).toLowerCase() == 'tidak'){
                    
                    progresswa.updateOne(
                        {nohp : contactnumber},
                        { $set : {status : false} },
                    ).then(async ()=> {
                        await client.sendMessage(message.from, 'Terima kasih sudah menghubungi layanan Akademik STEM Prasetiya Mulya');
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

