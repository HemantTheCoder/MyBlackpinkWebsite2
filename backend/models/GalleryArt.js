const mongoose = require('mongoose');

const galleryArtSchema = new mongoose.Schema({
  url: { type: String, required: true },
  caption: { type: String, required: true },
  author: { type: String, default: 'Anonymous' },
  date: { type: Date, default: Date.now },
  likes: { type: Array, default: [] }
});

module.exports = mongoose.model('GalleryArt', galleryArtSchema);
