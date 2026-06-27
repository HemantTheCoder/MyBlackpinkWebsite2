const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  creator: { type: String, required: true },
  offeredCard: { type: Object, required: true }, // The card they are putting in escrow
  requestedRarity: { type: String, required: true }, // 'Any', 'Rare', 'Epic', 'Legendary'
  status: { type: String, default: 'Open' }, // 'Open', 'Completed', 'Cancelled'
  acceptedBy: { type: String, default: null },
  dateCreated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Trade', tradeSchema);
