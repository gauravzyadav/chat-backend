// backend/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room: String,
  username: String,
  message: String,
  time: String,
});

module.exports = mongoose.model('Message', messageSchema);
