// backend/models/Room.js
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now },
  adminId: String,
  adminName: String,
});

module.exports = mongoose.model('Room', roomSchema);
