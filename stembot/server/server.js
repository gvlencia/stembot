const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, {
  cors: {
    origin: 'https://simantap.kaospoloskato.com'
}
});

dotenv.config();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());


io.on('connection', (socket) => {
  console.log(`Socket ${socket.id} connected`);

  socket.on('sendMessage', (message) => {
    io.emit('message', {name: 'tis', message:'tis' });
    console.log(message)
  });

  socket.on('disconnect', () => {
    console.log(`Socket ${socket.id} disconnected`);
  });
});

// Start server


// Socket.IO

try {
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
} catch (error) {
  console.log(error)
}
