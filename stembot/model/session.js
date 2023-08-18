const mongoose = require('mongoose');
const { Schema } = mongoose;

const sessionSchema = new Schema({
  _id: String, // WhatsApp user ID
  _serialized: String, // Serialized client instance
  server: String, // WebSocket server URL
  clientToken: String, // Client token
  clientID: String, // Client ID
  clientData: {
    WABrowserId: String,
    WASecretBundle: {
      key: String,
      encKey: String,
      macKey: String,
    },
    withUser: String,
    phone: {
      country: String,
      phone: String,
    },
    clientID: String,
    serverToken: String,
  },
});

module.exports = mongoose.model('sessionSchema', sessionSchema);

