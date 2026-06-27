require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Import Models
const User = require('./models/User');
const WallMessage = require('./models/WallMessage');
const Leaderboard = require('./models/Leaderboard');
const Feedback = require('./models/Feedback');
const GalleryArt = require('./models/GalleryArt');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // For admin.html
app.use(express.static(path.join(__dirname, '..'))); // For the rest of the frontend (index.html, login.html)

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// --- Blink Wall Endpoints ---
app.get('/api/wall', async (req, res) => {
  try {
    const messages = await WallMessage.find().sort({ date: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/wall', async (req, res) => {
  const { author, message, bias } = req.body;
  if (!author || !message) {
    return res.status(400).json({ error: 'Author and message are required' });
  }

  try {
    const newMessage = await WallMessage.create({ author, message, bias: bias || 'OT4' });
    
    const token = req.headers['authorization'];
    if (token) {
      const rawToken = token.replace('Bearer ', '');
      const user = await User.findOne({ token: rawToken });
      if (user) {
        user.commentsCount = (user.commentsCount || 0) + 1;
        await user.save();
      }
    }
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Leaderboard Endpoints ---
app.get('/api/leaderboard', async (req, res) => {
  try {
    const sorted = await Leaderboard.find().sort({ score: -1 }).limit(100);
    res.json(sorted);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/leaderboard', async (req, res) => {
  const { username, score } = req.body;
  if (!username || typeof score !== 'number') {
    return res.status(400).json({ error: 'Username and numeric score are required' });
  }

  try {
    const existing = await Leaderboard.findOne({ username });
    if (existing) {
      if (score > existing.score) {
        existing.score = score;
        existing.date = new Date();
        await existing.save();
      }
    } else {
      await Leaderboard.create({ username, score });
    }
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Feedback Endpoints ---
app.get('/api/feedback', async (req, res) => {
  try {
    const feedback = await Feedback.find().sort({ date: -1 });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/feedback', async (req, res) => {
  const { name, type, message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const newFeedback = await Feedback.create({
      name: name || 'Anonymous',
      type: type || 'General',
      message
    });
    res.status(201).json(newFeedback);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- User Accounts ---
app.post('/api/register', async (req, res) => {
  const { username, email, password, bias, dob } = req.body;
  
  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Username, email and password required' });
  }

  try {
    const existingUser = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
    if (existingUser) return res.status(400).json({ error: 'Username already taken' });
    
    const existingEmail = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (existingEmail) return res.status(400).json({ error: 'Email already registered' });

    const hash = crypto.createHash('sha256').update(password).digest('hex');
    const token = crypto.randomBytes(16).toString('hex');
    
    const newUser = await User.create({
      username,
      email,
      passwordHash: hash,
      bias: bias || 'OT4',
      dob: dob || '',
      token
    });

    res.status(201).json({ token, username: newUser.username, bias: newUser.bias, playlist: newUser.playlist });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

  try {
    const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const hash = crypto.createHash('sha256').update(password).digest('hex');
    if (user.passwordHash !== hash) return res.status(401).json({ error: 'Invalid credentials' });

    user.token = crypto.randomBytes(16).toString('hex');
    await user.save();

    res.json({ token: user.token, username: user.username, bias: user.bias, playlist: user.playlist });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Middleware to authenticate user
async function verifyUser(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  const rawToken = token.replace('Bearer ', '');
  try {
    const user = await User.findOne({ token: rawToken });
    if (user) {
      req.user = user;
      next();
    } else {
      res.status(403).json({ error: 'Invalid token' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}

app.get('/api/me', verifyUser, (req, res) => {
  let validCards = [];
  try {
    const allCards = JSON.parse(fs.readFileSync(path.join(__dirname, 'cards.json'), 'utf8'));
    const validUrls = new Set(allCards.map(c => c.url));
    if (req.user.photocards) {
      validCards = req.user.photocards.filter(c => validUrls.has(c.url));
      // In a real app we'd save back to DB, but let's keep it simple
    }
  } catch(e) {
    validCards = req.user.photocards || [];
  }

  res.json({
    username: req.user.username,
    email: req.user.email,
    bias: req.user.bias,
    dob: req.user.dob,
    playlist: req.user.playlist,
    playCount: req.user.playCount || 0,
    commentsCount: req.user.commentsCount || 0,
    joined: req.user.joined,
    photocards: validCards,
    lastPullDate: req.user.lastPullDate
  });
});

app.post('/api/me/play', verifyUser, async (req, res) => {
  try {
    req.user.playCount = (req.user.playCount || 0) + 1;
    await req.user.save();
    res.json({ success: true, playCount: req.user.playCount });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/me', verifyUser, async (req, res) => {
  const { bias, dob } = req.body;
  if (bias) req.user.bias = bias;
  if (dob !== undefined) req.user.dob = dob;
  
  try {
    await req.user.save();
    res.json({ success: true, bias: req.user.bias, dob: req.user.dob });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/me/playlist', verifyUser, async (req, res) => {
  const { playlist } = req.body;
  if (!Array.isArray(playlist)) return res.status(400).json({ error: 'Playlist must be an array' });
  
  try {
    req.user.playlist = playlist;
    await req.user.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Root ---
app.get('/', (req, res) => {
  res.send('<h1>🖤💖 Blackpink API is running!</h1><p>Visit the <a href="/admin.html">Admin Dashboard</a></p>');
});

// --- Admin APIs ---
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'secret-admin-token-99';

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASS) res.json({ token: ADMIN_TOKEN });
  else res.status(401).json({ error: 'Unauthorized' });
});

function verifyAdmin(req, res, next) {
  const token = req.headers['authorization'];
  if (token === `Bearer ${ADMIN_TOKEN}`) next();
  else res.status(403).json({ error: 'Forbidden' });
}

app.get('/api/admin/users', verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({}, 'username email bias dob playlist joined photocards').lean();
    const safeUsers = users.map(u => ({
      id: u._id,
      username: u.username,
      email: u.email,
      bias: u.bias,
      dob: u.dob,
      playlistCount: u.playlist ? u.playlist.length : 0,
      joined: u.joined,
      photocardsCollected: u.photocards ? u.photocards.length : 0 // Added for requirement
    }));
    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/users/:id', verifyAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/wall/:id', verifyAdmin, async (req, res) => {
  try {
    await WallMessage.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/leaderboard/:id', verifyAdmin, async (req, res) => {
  try {
    await Leaderboard.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/feedback/:id', verifyAdmin, async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Fan Art Gallery ---
app.get('/api/gallery', async (req, res) => {
  try {
    const gallery = await GalleryArt.find().sort({ date: -1 });
    res.json(gallery);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/gallery', async (req, res) => {
  const { url, caption, author } = req.body;
  if (!url || !caption) return res.status(400).json({ error: 'URL and caption required' });
  try {
    const newArt = await GalleryArt.create({ url, caption, author: author || 'Anonymous' });
    res.status(201).json(newArt);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Photocard Endpoints ---
app.get('/api/cards', (req, res) => {
  try {
    const cards = JSON.parse(fs.readFileSync(path.join(__dirname, 'cards.json'), 'utf8'));
    res.json(cards);
  } catch(e) {
    res.json([]);
  }
});

app.post('/api/me/pull', verifyUser, async (req, res) => {
  const today = new Date().toDateString();
  const lastPull = req.user.lastPullDate ? new Date(req.user.lastPullDate).toDateString() : null;
  
  if (lastPull === today) {
    return res.status(400).json({ error: 'You have already pulled your daily card today! Come back tomorrow.' });
  }
  
  let cards = [];
  try {
    cards = JSON.parse(fs.readFileSync(path.join(__dirname, 'cards.json'), 'utf8'));
  } catch(e) {}
  
  if (cards.length === 0) return res.status(500).json({ error: 'No cards available' });
  
  const roll = Math.random() * 100;
  let rarity = 'Common';
  if (roll > 95) rarity = 'Legendary';
  else if (roll > 80) rarity = 'Epic';
  else if (roll > 55) rarity = 'Rare';
  
  const pool = cards.filter(c => c.rarity === rarity);
  const finalPool = pool.length > 0 ? pool : cards;
  const pulledCard = finalPool[Math.floor(Math.random() * finalPool.length)];
  
  try {
    req.user.photocards.push(pulledCard);
    req.user.lastPullDate = new Date();
    req.user.markModified('photocards');
    await req.user.save();
    res.json({ success: true, card: pulledCard });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/gallery/:id/like', verifyUser, async (req, res) => {
  try {
    const art = await GalleryArt.findById(req.params.id);
    if (!art) return res.status(404).json({ error: 'Art not found' });
    
    const userIndex = art.likes.indexOf(req.user.id);
    if (userIndex > -1) art.likes.splice(userIndex, 1);
    else art.likes.push(req.user.id);
    
    await art.save();
    res.json({ success: true, likes: art.likes });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
