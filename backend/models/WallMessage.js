const mongoose = require('mongoose');

const wallMessageSchema = new mongoose.Schema({
  author: { type: String, required: true },
  message: { type: String, required: true },
  bias: { type: String, default: 'OT4' },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WallMessage', wallMessageSchema);
