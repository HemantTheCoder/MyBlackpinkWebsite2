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
const Poll = require('./models/Poll');
const Trade = require('./models/Trade');

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

// --- Poll Endpoints ---
app.get('/api/poll', async (req, res) => {
  try {
    const polls = await Poll.find();
    res.json(polls);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/poll', async (req, res) => {
  const { choice } = req.body;
  if (!choice) return res.status(400).json({ error: 'Choice is required' });

  try {
    let poll = await Poll.findOne({ option: choice });
    if (poll) {
      poll.votes += 1;
      await poll.save();
    } else {
      poll = await Poll.create({ option: choice, votes: 1 });
    }
    const allPolls = await Poll.find();
    res.status(200).json(allPolls);
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
    res.status(500).json({ error: 'Server error: ' + error.message });
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

app.get('/api/collection/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Return only public data
    res.json({
      username: user.username,
      bias: user.bias,
      photocards: user.photocards || [],
      playCount: user.playCount || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Trade Endpoints ---
app.get('/api/trades', async (req, res) => {
  try {
    const trades = await Trade.find({ status: 'Open' }).sort({ dateCreated: -1 });
    res.json(trades);
  } catch(e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/trades', verifyUser, async (req, res) => {
  const { offeredCardUrl, requestedRarity } = req.body;
  if (!offeredCardUrl || !requestedRarity) return res.status(400).json({ error: 'Missing parameters' });
  
  try {
    // Check if user has card in duplicates
    if (!req.user.duplicates) req.user.duplicates = [];
    const cardIndex = req.user.duplicates.findIndex(c => c.url === offeredCardUrl);
    if (cardIndex === -1) return res.status(400).json({ error: 'You do not own this card in your trade pile' });
    
    const offeredCard = req.user.duplicates[cardIndex];
    
    // Remove card from inventory (Escrow)
    req.user.duplicates.splice(cardIndex, 1);
    req.user.markModified('duplicates');
    await req.user.save();
    
    const trade = await Trade.create({
      creator: req.user.username,
      offeredCard,
      requestedRarity
    });
    
    res.json({ success: true, trade, user: req.user });
  } catch(e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/trades/:id/accept', verifyUser, async (req, res) => {
  const { acceptedCardUrl } = req.body;
  if (!acceptedCardUrl) return res.status(400).json({ error: 'Missing card' });
  
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade || trade.status !== 'Open') return res.status(400).json({ error: 'Trade unavailable' });
    if (trade.creator === req.user.username) return res.status(400).json({ error: 'Cannot accept own trade' });
    
    if (!req.user.duplicates) req.user.duplicates = [];
    const cardIndex = req.user.duplicates.findIndex(c => c.url === acceptedCardUrl);
    if (cardIndex === -1) return res.status(400).json({ error: 'You do not own this card in your trade pile' });
    
    const acceptedCard = req.user.duplicates[cardIndex];
    if (trade.requestedRarity !== 'Any' && acceptedCard.rarity !== trade.requestedRarity) {
      return res.status(400).json({ error: `You must offer a ${trade.requestedRarity} card` });
    }
    
    // Swap
    req.user.duplicates.splice(cardIndex, 1);
    const acceptorHasCard = req.user.photocards.some(c => c.url === trade.offeredCard.url);
    if (acceptorHasCard) {
      req.user.duplicates.push(trade.offeredCard);
    } else {
      req.user.photocards.push(trade.offeredCard);
      req.user.markModified('photocards');
    }
    req.user.markModified('duplicates');
    await req.user.save();
    
    const creatorUser = await User.findOne({ username: trade.creator });
    if (creatorUser) {
      if (!creatorUser.duplicates) creatorUser.duplicates = [];
      const creatorHasCard = (creatorUser.photocards || []).some(c => c.url === acceptedCard.url);
      if (creatorHasCard) {
        creatorUser.duplicates.push(acceptedCard);
      } else {
        creatorUser.photocards.push(acceptedCard);
        creatorUser.markModified('photocards');
      }
      creatorUser.markModified('duplicates');
      await creatorUser.save();
    }
    
    trade.status = 'Completed';
    trade.acceptedBy = req.user.username;
    await trade.save();
    
    res.json({ success: true, user: req.user });
  } catch(e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/trades/:id/cancel', verifyUser, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade || trade.status !== 'Open') return res.status(400).json({ error: 'Trade unavailable' });
    if (trade.creator !== req.user.username) return res.status(403).json({ error: 'Unauthorized' });
    
    // Return card
    if (!req.user.duplicates) req.user.duplicates = [];
    req.user.duplicates.push(trade.offeredCard);
    req.user.markModified('duplicates');
    await req.user.save();
    
    trade.status = 'Cancelled';
    await trade.save();
    
    res.json({ success: true, user: req.user });
  } catch(e) {
    res.status(500).json({ error: 'Server error' });
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
  
  // Check owned cards to determine if duplicate
  const uniqueCollected = new Set((req.user.photocards || []).map(c => c.url));
  
  const roll = Math.random() * 100;
  let rarity = 'Common';
  if (roll > 95) rarity = 'Legendary';
  else if (roll > 80) rarity = 'Epic';
  else if (roll > 55) rarity = 'Rare';
  
  let pool = cards.filter(c => c.rarity === rarity);
  if (pool.length === 0) pool = cards;
  
  const pulledCard = pool[Math.floor(Math.random() * pool.length)];
  const isDuplicate = uniqueCollected.has(pulledCard.url);
  
  try {
    if (isDuplicate) {
      if (!req.user.duplicates) req.user.duplicates = [];
      req.user.duplicates.push(pulledCard);
      req.user.markModified('duplicates');
    } else {
      req.user.photocards.push(pulledCard);
      req.user.markModified('photocards');
    }
    
    req.user.lastPullDate = new Date();
    await req.user.save();
    res.json({ success: true, card: pulledCard, isDuplicate, user: req.user });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
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
