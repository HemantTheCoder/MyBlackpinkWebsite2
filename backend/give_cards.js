require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('./models/User');

async function giveAllCards() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log("Fetching banhae user...");
    const user = await User.findOne({ username: { $regex: /^banhae$/i } });
    
    if (!user) {
      console.log("User 'banhae' not found in database.");
      process.exit(1);
    }
    
    console.log("Loading all cards from cards.json...");
    const cardsRaw = fs.readFileSync(path.join(__dirname, 'cards.json'), 'utf8');
    const allCards = JSON.parse(cardsRaw);
    
    console.log(`Giving ${allCards.length} cards to banhae...`);
    user.photocards = allCards;
    user.markModified('photocards');
    user.isAdmin = true; // Make sure banhae is admin
    await user.save();
    
    console.log("Success! banhae has all photocards now.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

giveAllCards();
