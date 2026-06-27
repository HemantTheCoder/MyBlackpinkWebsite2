const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  name: { type: String, default: 'Anonymous' },
  type: { type: String, default: 'General' },
  message: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
