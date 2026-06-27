require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

async function test() {
  try {
    console.log("URI:", process.env.MONGODB_URI ? "Loaded" : "Missing");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");
    const user = await User.findOne({ username: 'banhae' });
    console.log("Found user:", user ? user.username : "No user");
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    mongoose.connection.close();
  }
}
test();
