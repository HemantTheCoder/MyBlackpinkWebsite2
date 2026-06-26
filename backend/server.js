const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Utility to read data
function readData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading data:", error);
    return { wallMessages: [], leaderboard: [], feedback: [], users: [] };
  }
}

// Utility to write data
function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error("Error writing data:", error);
  }
}

// --- Blink Wall Endpoints ---

// Get all messages
app.get('/api/wall', (req, res) => {
  const data = readData();
  res.json(data.wallMessages);
});

// Post a new message
app.post('/api/wall', (req, res) => {
  const { author, message, bias } = req.body;
  
  if (!author || !message) {
    return res.status(400).json({ error: 'Author and message are required' });
  }

  const data = readData();
  const newMessage = {
    id: Date.now().toString(),
    author,
    message,
    bias: bias || 'OT4',
    date: new Date().toISOString()
  };
  
  data.wallMessages.push(newMessage);

  // If token is provided, increment user's comment count for Stan Level
  const token = req.headers['authorization'];
  if (token) {
    const rawToken = token.replace('Bearer ', '');
    const user = (data.users || []).find(u => u.token === rawToken);
    if (user) {
      user.commentsCount = (user.commentsCount || 0) + 1;
    }
  }

  writeData(data);
  
  res.status(201).json(newMessage);
});

// --- Leaderboard Endpoints (Trivia Game) ---

// Get top 100 leaderboard
app.get('/api/leaderboard', (req, res) => {
  const data = readData();
  // Sort descending by score
  const sorted = data.leaderboard.sort((a, b) => b.score - a.score).slice(0, 100);
  res.json(sorted);
});

// Submit a new score
app.post('/api/leaderboard', (req, res) => {
  const { username, score } = req.body;
  
  if (!username || typeof score !== 'number') {
    return res.status(400).json({ error: 'Username and numeric score are required' });
  }

  const data = readData();
  
  // Update if exists, else push new
  const existing = data.leaderboard.find(entry => entry.username === username);
  if (existing) {
    if (score > existing.score) {
      existing.score = score;
      existing.date = new Date().toISOString();
    }
  } else {
    data.leaderboard.push({
      id: Date.now().toString(),
      username,
      score,
      date: new Date().toISOString()
    });
  }
  
  writeData(data);
  res.status(201).json({ success: true });
});

// --- Feedback Endpoints ---

// Get all feedback (Admin only logically, but endpoint can be hit if needed. Let's not protect GET for simplicity, admin UI handles it)
app.get('/api/feedback', (req, res) => {
  const data = readData();
  res.json(data.feedback || []);
});

// Submit feedback
app.post('/api/feedback', (req, res) => {
  const { name, type, message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const data = readData();
  if (!data.feedback) data.feedback = [];
  
  const newFeedback = {
    id: Date.now().toString(),
    name: name || 'Anonymous',
    type: type || 'General',
    message,
    date: new Date().toISOString()
  };
  
  data.feedback.push(newFeedback);
  writeData(data);
  
  res.status(201).json(newFeedback);
});

// --- User Accounts ---
app.post('/api/register', (req, res) => {
  const { username, password, bias, dob } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const data = readData();
  if (!data.users) data.users = [];

  const existing = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Username already taken' });
  }

  const hash = crypto.createHash('sha256').update(password).digest('hex');
  const token = crypto.randomBytes(16).toString('hex');
  
  const newUser = {
    id: Date.now().toString(),
    username,
    passwordHash: hash,
    bias: bias || 'OT4',
    dob: dob || '',
    playlist: [],
    playCount: 0,
    commentsCount: 0,
    photocards: [],
    lastPullDate: null,
    token: token,
    joined: new Date().toISOString()
  };

  data.users.push(newUser);
  writeData(data);
  
  // Return user info and token (do not return hash)
  res.status(201).json({ token, username: newUser.username, bias: newUser.bias, playlist: newUser.playlist });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

  const data = readData();
  if (!data.users) data.users = [];
  
  const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const hash = crypto.createHash('sha256').update(password).digest('hex');
  if (user.passwordHash !== hash) return res.status(401).json({ error: 'Invalid credentials' });

  // Generate a new token on login for better security
  user.token = crypto.randomBytes(16).toString('hex');
  writeData(data);

  res.json({ token: user.token, username: user.username, bias: user.bias, playlist: user.playlist });
});

// Middleware to authenticate user
function verifyUser(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  const rawToken = token.replace('Bearer ', '');
  const data = readData();
  const user = (data.users || []).find(u => u.token === rawToken);
  
  if (user) {
    req.user = user;
    next();
  } else {
    res.status(403).json({ error: 'Invalid token' });
  }
}

app.get('/api/me', verifyUser, (req, res) => {
  res.json({
    username: req.user.username,
    bias: req.user.bias,
    dob: req.user.dob,
    playlist: req.user.playlist,
    playCount: req.user.playCount || 0,
    commentsCount: req.user.commentsCount || 0,
    joined: req.user.joined
  });
});

app.post('/api/me/play', verifyUser, (req, res) => {
  const data = readData();
  const user = data.users.find(u => u.id === req.user.id);
  user.playCount = (user.playCount || 0) + 1;
  writeData(data);
  res.json({ success: true, playCount: user.playCount });
});

app.put('/api/me', verifyUser, (req, res) => {
  const { bias, dob } = req.body;
  const data = readData();
  const user = data.users.find(u => u.id === req.user.id);
  
  if (bias) user.bias = bias;
  if (dob !== undefined) user.dob = dob;
  
  writeData(data);
  res.json({ success: true, bias: user.bias, dob: user.dob });
});

app.put('/api/me/playlist', verifyUser, (req, res) => {
  const { playlist } = req.body; // array of URLs or track objects
  if (!Array.isArray(playlist)) return res.status(400).json({ error: 'Playlist must be an array' });
  
  const data = readData();
  const user = data.users.find(u => u.id === req.user.id);
  user.playlist = playlist;
  writeData(data);
  
  res.json({ success: true });
});

// --- Root / Welcome Route ---
app.get('/', (req, res) => {
  res.send('<h1>🖤💖 Blackpink API is running!</h1><p>Visit the <a href="/admin.html">Admin Dashboard</a></p>');
});

// --- Admin APIs ---
const ADMIN_PASS = 'admin123';
const ADMIN_TOKEN = 'secret-admin-token-99';

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASS) {
    res.json({ token: ADMIN_TOKEN });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Middleware to check admin token
function verifyAdmin(req, res, next) {
  const token = req.headers['authorization'];
  if (token === `Bearer ${ADMIN_TOKEN}`) {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
}

// Get all users for admin
app.get('/api/admin/users', verifyAdmin, (req, res) => {
  const data = readData();
  const safeUsers = (data.users || []).map(u => ({
    id: u.id,
    username: u.username,
    bias: u.bias,
    dob: u.dob,
    playlistCount: u.playlist ? u.playlist.length : 0,
    joined: u.joined
  }));
  res.json(safeUsers);
});

app.delete('/api/admin/users/:id', verifyAdmin, (req, res) => {
  const data = readData();
  if (!data.users) data.users = [];
  data.users = data.users.filter(u => u.id !== req.params.id);
  writeData(data);
  res.json({ success: true });
});

app.delete('/api/wall/:id', verifyAdmin, (req, res) => {
  const data = readData();
  data.wallMessages = data.wallMessages.filter(m => m.id !== req.params.id);
  writeData(data);
  res.json({ success: true });
});

app.delete('/api/leaderboard/:id', verifyAdmin, (req, res) => {
  const data = readData();
  data.leaderboard = data.leaderboard.filter(l => l.id !== req.params.id);
  writeData(data);
  res.json({ success: true });
});

app.delete('/api/feedback/:id', verifyAdmin, (req, res) => {
  const data = readData();
  if (!data.feedback) data.feedback = [];
  data.feedback = data.feedback.filter(f => f.id !== req.params.id);
  writeData(data);
  res.json({ success: true });
});


app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

// --- Fan Art Gallery ---
app.get('/api/gallery', (req, res) => {
  const data = readData();
  res.json(data.gallery || []);
});

app.post('/api/gallery', (req, res) => {
  const { url, caption, author } = req.body;
  if (!url || !caption) return res.status(400).json({ error: 'URL and caption required' });
  const data = readData();
  if (!data.gallery) data.gallery = [];
  const newArt = { id: Date.now().toString(), url, caption, author: author || 'Anonymous', date: new Date().toISOString() };
  data.gallery.unshift(newArt);
  writeData(data);
  res.status(201).json(newArt);
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

app.post('/api/me/pull', verifyUser, (req, res) => {
  const data = readData();
  const user = data.users.find(u => u.id === req.user.id);
  const today = new Date().toDateString();
  if (user.lastPullDate === today) {
    return res.status(400).json({ error: 'You already pulled a card today!' });
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
  
  if (!user.photocards) user.photocards = [];
  user.photocards.push(pulledCard);
  user.lastPullDate = today;
  writeData(data);
  res.json({ success: true, card: pulledCard });
});

// --- Gallery Likes ---
app.post('/api/gallery/:id/like', verifyUser, (req, res) => {
  const data = readData();
  if (!data.gallery) data.gallery = [];
  const art = data.gallery.find(a => a.id === req.params.id);
  if (!art) return res.status(404).json({ error: 'Art not found' });
  
  if (!art.likes) art.likes = [];
  const userIndex = art.likes.indexOf(req.user.id);
  if (userIndex > -1) {
    art.likes.splice(userIndex, 1);
  } else {
    art.likes.push(req.user.id);
  }
  writeData(data);
  res.json({ success: true, likes: art.likes });
});

// --- CHEAT FOR DEMO ---
app.get('/api/cheat_banhae', (req, res) => {
  const data = readData();
  let user = (data.users || []).find(u => u.username === 'banhae');
  if (!user) {
    user = { id: Date.now().toString(), username: 'banhae', photocards: [], playlist: [] };
    if(!data.users) data.users = [];
    data.users.push(user);
  }
  let cards = [];
  try {
    cards = JSON.parse(fs.readFileSync(path.join(__dirname, 'cards.json'), 'utf8'));
  } catch(e) {}
  user.photocards = cards;
  user.passwordHash = crypto.createHash('sha256').update('password').digest('hex');
  writeData(data);
  res.send('<h1>Success!</h1><p>User banhae now has all cards and password is set to "password". You can now <a href="/">go back and log in</a>.</p>');
});
