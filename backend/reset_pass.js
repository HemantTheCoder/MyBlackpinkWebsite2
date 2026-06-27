require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('./models/User');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ username: 'banhae' });
    if (user) {
      user.passwordHash = crypto.createHash('sha256').update('password').digest('hex');
      await user.save();
      console.log("Password for banhae reset to 'password'");
    }
  } catch(e) {
    console.error(e);
  } finally {
    mongoose.connection.close();
  }
}
run();
