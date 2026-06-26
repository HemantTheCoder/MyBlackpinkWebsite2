const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

// Utility to read data
function readData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading data:", error);
    return { wallMessages: [], leaderboard: [] };
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

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
