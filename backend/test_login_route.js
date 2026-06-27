require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('./models/User');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const username = 'banhae';
    const password = 'password';

    const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
    if (!user) return console.log("Invalid credentials 1");

    const hash = crypto.createHash('sha256').update(password).digest('hex');
    if (user.passwordHash !== hash) return console.log("Invalid credentials 2");

    user.token = crypto.randomBytes(16).toString('hex');
    await user.save();
    console.log("Success");
  } catch (e) {
    console.error("500 Server error:", e);
  } finally {
    mongoose.connection.close();
  }
}
test();
