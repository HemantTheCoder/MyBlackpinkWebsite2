require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Create new user
    const user = new User({
      username: 'testuser123',
      email: 'test@example.com',
      passwordHash: 'dummy',
      bias: 'Lisa'
    });
    await user.save();
    console.log("Created user.");

    // Simulate pull
    const fs = require('fs');
    const path = require('path');
    let cards = [];
    try {
      cards = JSON.parse(fs.readFileSync(path.join(__dirname, 'cards.json'), 'utf8'));
    } catch(e) {}
    
    const uniqueCollected = new Set((user.photocards || []).map(c => c.url));
    if (uniqueCollected.size >= cards.length) {
      console.log("All collected.");
      return;
    }
    
    const roll = Math.random() * 100;
    let rarity = 'Common';
    if (roll > 95) rarity = 'Legendary';
    else if (roll > 80) rarity = 'Epic';
    else if (roll > 55) rarity = 'Rare';
    
    let pool = cards.filter(c => c.rarity === rarity);
    if (pool.length === 0) pool = cards;
    
    let uncollectedPool = pool.filter(c => !uniqueCollected.has(c.url));
    if (uncollectedPool.length === 0) uncollectedPool = pool;
    
    const pulledCard = uncollectedPool[Math.floor(Math.random() * uncollectedPool.length)];
    console.log("Pulled card rarity:", pulledCard.rarity);
    
    user.photocards.push(pulledCard);
    user.lastPullDate = new Date();
    user.markModified('photocards');
    await user.save();
    console.log("Successfully saved card to new user.");
    
    // Cleanup
    await User.deleteOne({ username: 'testuser123' });
    console.log("Cleaned up.");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    mongoose.connection.close();
  }
}
test();
