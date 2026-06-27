require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const User = require('./models/User');
const WallMessage = require('./models/WallMessage');
const Leaderboard = require('./models/Leaderboard');
const Feedback = require('./models/Feedback');

const DATA_FILE = path.join(__dirname, 'data.json');

async function migrateData() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const rawData = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(rawData);

    // 1. Migrate Users
    console.log("Migrating Users...");
    if (data.users && data.users.length > 0) {
      for (const u of data.users) {
        const existing = await User.findOne({ username: u.username });
        if (!existing) {
          // Provide a dummy email if none exists since we require it now
          const email = u.email || `${u.username.toLowerCase()}@example.com`;
          const dummyHash = '0000000000000000000000000000000000000000000000000000000000000000'; // 64 chars
          await User.create({
            username: u.username,
            passwordHash: u.passwordHash || dummyHash,
            email: email,
            bias: u.bias,
            dob: u.dob,
            playlist: u.playlist,
            playCount: u.playCount,
            commentsCount: u.commentsCount,
            photocards: u.photocards,
            lastPullDate: u.lastPullDate,
            token: u.token,
            joined: u.joined ? new Date(u.joined) : new Date(),
            isAdmin: u.username.toLowerCase() === 'banhae' // give admin to the creator
          });
        }
      }
    }

    // 2. Migrate Wall Messages
    console.log("Migrating Wall Messages...");
    if (data.wallMessages && data.wallMessages.length > 0) {
      for (const msg of data.wallMessages) {
        await WallMessage.create({
          author: msg.author,
          message: msg.message,
          bias: msg.bias,
          date: msg.date ? new Date(msg.date) : new Date()
        });
      }
    }

    // 3. Migrate Leaderboard
    console.log("Migrating Leaderboard...");
    if (data.leaderboard && data.leaderboard.length > 0) {
      for (const entry of data.leaderboard) {
        await Leaderboard.create({
          username: entry.username,
          score: entry.score,
          date: entry.date ? new Date(entry.date) : new Date()
        });
      }
    }

    // 4. Migrate Feedback
    console.log("Migrating Feedback...");
    if (data.feedback && data.feedback.length > 0) {
      for (const fb of data.feedback) {
        await Feedback.create({
          name: fb.name,
          type: fb.type,
          message: fb.message,
          date: fb.date ? new Date(fb.date) : new Date()
        });
      }
    }

    console.log("Migration complete!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateData();
