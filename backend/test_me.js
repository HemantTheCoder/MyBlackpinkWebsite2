require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('./models/User');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const user = await User.findOne({ username: 'banhae' });
    if (!user) return console.log("User not found");

    const rawToken = user.token || 'notoken';
    console.log("Token:", rawToken);

    // Simulate /api/me logic
    let validCards = [];
    const fs = require('fs');
    const path = require('path');
    try {
      const allCards = JSON.parse(fs.readFileSync(path.join(__dirname, 'cards.json'), 'utf8'));
      const validUrls = new Set(allCards.map(c => c.url));
      if (user.photocards) {
        validCards = user.photocards.filter(c => validUrls.has(c.url));
      }
    } catch(e) {
      console.log("Error in fs/filter:", e);
      validCards = user.photocards || [];
    }

    const payload = {
      username: user.username,
      email: user.email,
      bias: user.bias,
      photocardsLength: validCards.length
    };
    
    console.log("Payload:", payload);
  } catch (e) {
    console.error("500 Server error:", e);
  } finally {
    mongoose.connection.close();
  }
}
test();
