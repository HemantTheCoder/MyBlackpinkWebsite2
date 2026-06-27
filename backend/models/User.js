const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // Added email based on new requirement
  bias: { type: String, default: 'OT4' },
  dob: { type: String, default: '' },
  playlist: { type: Array, default: [] },
  playCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  photocards: { type: Array, default: [] },
  duplicates: { type: Array, default: [] },
  lastPullDate: { type: Date, default: null },
  token: { type: String },
  joined: { type: Date, default: Date.now },
  isAdmin: { type: Boolean, default: false } // Adding isAdmin flag just in case for the admin page
});

module.exports = mongoose.model('User', userSchema);
