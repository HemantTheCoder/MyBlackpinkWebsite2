require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ username: 'banhae' });
    
    let cards = require('./cards.json');
    const roll = Math.random() * 100;
    let rarity = 'Common';
    if (roll > 95) rarity = 'Legendary';
    else if (roll > 80) rarity = 'Epic';
    else if (roll > 55) rarity = 'Rare';
    
    const pool = cards.filter(c => c.rarity === rarity);
    const finalPool = pool.length > 0 ? pool : cards;
    const pulledCard = finalPool[Math.floor(Math.random() * finalPool.length)];
    
    console.log("Pulled card:", pulledCard);
    
    // Simulate push
    user.photocards.push(pulledCard);
    user.lastPullDate = new Date();
    user.markModified('photocards');
    await user.save();
    
    console.log("Successfully saved to user.");
  } catch(e) {
    console.error("Error:", e);
  } finally {
    mongoose.connection.close();
  }
}
test();
