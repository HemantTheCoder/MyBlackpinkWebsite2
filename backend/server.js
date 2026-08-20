require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { supabaseAdmin, supabaseAuth } = require('./lib/supabase');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // For admin.html
app.use(express.static(path.join(__dirname, '..'))); // For the rest of the frontend (index.html, login.html)

// --- Card shape helper: DB rows already use the same field names the frontend expects ---
function cardShape(card) {
  if (!card) return null;
  return { id: card.id, name: card.name, url: card.url, rarity: card.rarity, banner: card.banner || null };
}

// --- Blink Wall Endpoints ---
app.get('/api/wall', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('wall_messages').select('*').order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: 'Server error' });
  res.json(data.map(m => ({ _id: m.id, author: m.author, message: m.message, bias: m.bias, date: m.created_at })));
});

app.post('/api/wall', async (req, res) => {
  const { author, message, bias } = req.body;
  if (!author || !message) {
    return res.status(400).json({ error: 'Author and message are required' });
  }

  try {
    let userId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const { data: { user } } = await supabaseAuth.auth.getUser(authHeader.replace('Bearer ', ''));
      if (user) {
        userId = user.id;
        const { data: profile } = await supabaseAdmin.from('profiles').select('comments_count').eq('id', user.id).single();
        if (profile) {
          await supabaseAdmin.from('profiles').update({ comments_count: (profile.comments_count || 0) + 1 }).eq('id', user.id);
        }
      }
    }

    const { data: newMessage, error } = await supabaseAdmin
      .from('wall_messages')
      .insert({ author, message, bias: bias || 'OT4', user_id: userId })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ _id: newMessage.id, author: newMessage.author, message: newMessage.message, bias: newMessage.bias, date: newMessage.created_at });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Leaderboard Endpoints ---
app.get('/api/leaderboard', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('leaderboard').select('*').order('score', { ascending: false }).limit(100);
  if (error) return res.status(500).json({ error: 'Server error' });
  res.json(data.map(l => ({ _id: l.id, username: l.username, score: l.score, date: l.created_at })));
});

app.post('/api/leaderboard', async (req, res) => {
  const { username, score } = req.body;
  if (!username || typeof score !== 'number') {
    return res.status(400).json({ error: 'Username and numeric score are required' });
  }

  try {
    const { data: existing } = await supabaseAdmin.from('leaderboard').select('*').eq('username', username).maybeSingle();
    if (existing) {
      if (score > existing.score) {
        await supabaseAdmin.from('leaderboard').update({ score, created_at: new Date().toISOString() }).eq('id', existing.id);
      }
    } else {
      await supabaseAdmin.from('leaderboard').insert({ username, score });
    }
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Poll Endpoints ---
app.get('/api/poll', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('polls').select('*');
  if (error) return res.status(500).json({ error: 'Server error' });
  res.json(data);
});

app.post('/api/poll', async (req, res) => {
  const { choice } = req.body;
  if (!choice) return res.status(400).json({ error: 'Choice is required' });

  try {
    const { data: existing } = await supabaseAdmin.from('polls').select('*').eq('option', choice).maybeSingle();
    if (existing) {
      await supabaseAdmin.from('polls').update({ votes: existing.votes + 1 }).eq('id', existing.id);
    } else {
      await supabaseAdmin.from('polls').insert({ option: choice, votes: 1 });
    }
    const { data: allPolls } = await supabaseAdmin.from('polls').select('*');
    res.status(200).json(allPolls);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Feedback Endpoints ---
app.get('/api/feedback', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('feedback').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Server error' });
  res.json(data.map(f => ({ _id: f.id, name: f.name, type: f.type, message: f.message, date: f.created_at })));
});

app.post('/api/feedback', async (req, res) => {
  const { name, type, message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const { data: newFeedback, error } = await supabaseAdmin
      .from('feedback')
      .insert({ name: name || 'Anonymous', type: type || 'General', message })
      .select()
      .single();
    if (error) throw error;
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
    const { data: existingUsername } = await supabaseAdmin.from('profiles').select('id').ilike('username', username).maybeSingle();
    if (existingUsername) return res.status(400).json({ error: 'Username already taken' });

    const { data: existingEmail } = await supabaseAdmin.from('profiles').select('id').ilike('email', email).maybeSingle();
    if (existingEmail) return res.status(400).json({ error: 'Email already registered' });

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { username }
    });
    if (createErr) return res.status(400).json({ error: createErr.message || 'Registration failed' });

    const newUserId = created.user.id;
    const { error: profileErr } = await supabaseAdmin.from('profiles').insert({
      id: newUserId, username, email, bias: bias || 'OT4', dob: dob || ''
    });
    if (profileErr) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return res.status(400).json({ error: 'Registration failed' });
    }

    const { data: session, error: signInErr } = await supabaseAuth.auth.signInWithPassword({ email, password });
    if (signInErr) return res.status(500).json({ error: 'Account created, but login failed. Please try logging in.' });

    res.status(201).json({
      token: session.session.access_token,
      refresh_token: session.session.refresh_token,
      username, bias: bias || 'OT4', playlist: []
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

  try {
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').ilike('username', username).maybeSingle();
    if (!profile || !profile.email) return res.status(401).json({ error: 'Invalid credentials' });

    const { data: session, error: signInErr } = await supabaseAuth.auth.signInWithPassword({ email: profile.email, password });
    if (signInErr) return res.status(401).json({ error: 'Invalid credentials' });

    const { data: tracks } = await supabaseAdmin.from('playlist_tracks').select('*').eq('user_id', profile.id).order('position', { ascending: true });
    const playlist = (tracks || []).map(t => ({ name: t.name, url: t.video_id }));

    res.json({
      token: session.session.access_token,
      refresh_token: session.session.refresh_token,
      username: profile.username, bias: profile.bias, playlist
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Refresh an expired access token using its refresh token
app.post('/api/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: 'Missing refresh_token' });

  const { data, error } = await supabaseAuth.auth.refreshSession({ refresh_token });
  if (error || !data.session) return res.status(401).json({ error: 'Could not refresh session' });

  res.json({ token: data.session.access_token, refresh_token: data.session.refresh_token });
});

// Forgot password: sends a Supabase Auth recovery email. Always responds success to avoid
// leaking which emails are registered.
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    await supabaseAuth.auth.resetPasswordForEmail(email, {
      redirectTo: `${FRONTEND_URL}/reset-password.html`
    });
  } catch (error) {
    console.error('Password reset error:', error);
  }
  res.json({ success: true });
});

// Middleware to authenticate user via Supabase Auth access token
async function verifyUser(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.replace('Bearer ', '');
  try {
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
    if (error || !user) return res.status(403).json({ error: 'Invalid token' });

    const { data: profile, error: profileErr } = await supabaseAdmin.from('profiles').select('*').eq('id', user.id).single();
    if (profileErr || !profile) return res.status(403).json({ error: 'Invalid token' });

    req.authUser = user;
    req.profile = profile;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}

// Builds the full "current user" payload shared by /api/me and the various actions that
// mutate profile state and hand the fresh snapshot back to the frontend.
async function buildMeResponse(profile) {
  const userId = profile.id;

  const [cardsRes, wishlistRes, notificationsRes, tracksRes] = await Promise.all([
    supabaseAdmin.from('user_cards').select('is_duplicate, cards(*)').eq('user_id', userId),
    supabaseAdmin.from('wishlist_items').select('card_id').eq('user_id', userId),
    supabaseAdmin.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabaseAdmin.from('playlist_tracks').select('*').eq('user_id', userId).order('position', { ascending: true })
  ]);

  const allCards = cardsRes.data || [];
  const photocards = allCards.filter(c => !c.is_duplicate).map(c => cardShape(c.cards));
  const duplicates = allCards.filter(c => c.is_duplicate).map(c => cardShape(c.cards));
  const wishlist = (wishlistRes.data || []).map(w => w.card_id);
  const notifications = (notificationsRes.data || []).map(n => ({
    _id: n.id, message: n.message, read: n.read, date: n.created_at
  }));
  const playlist = (tracksRes.data || []).map(t => ({ name: t.name, url: t.video_id }));

  return {
    username: profile.username,
    email: profile.email,
    bias: profile.bias,
    dob: profile.dob,
    playlist,
    playCount: profile.play_count || 0,
    commentsCount: profile.comments_count || 0,
    joined: profile.created_at,
    photocards,
    duplicates,
    wishlist,
    notifications,
    pullsSinceEpic: profile.pulls_since_epic || 0,
    pullsSinceLegendary: profile.pulls_since_legendary || 0,
    pullsAvailable: profile.pulls_available !== undefined ? profile.pulls_available : 1,
    loginStreak: profile.login_streak || 0,
    lastPullDate: profile.last_pull_date,
    lastLoginDate: profile.last_login_date
  };
}

app.get('/api/me', verifyUser, async (req, res) => {
  let profile = req.profile;

  // Daily Login & Streak Logic
  const today = new Date().toDateString();
  const loginDate = profile.last_login_date ? new Date(profile.last_login_date).toDateString() : null;

  if (loginDate !== today) {
    let loginStreak = profile.login_streak || 0;
    if (loginDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      loginStreak = (loginDate === yesterday.toDateString()) ? loginStreak + 1 : 1;
    } else {
      loginStreak = 1;
    }

    let pullsAvailable = 1;
    if (loginStreak % 3 === 0) pullsAvailable += 1;
    if (loginStreak % 7 === 0) pullsAvailable += 1;

    const { data: updated, error } = await supabaseAdmin
      .from('profiles')
      .update({ login_streak: loginStreak, last_login_date: new Date().toISOString(), pulls_available: pullsAvailable })
      .eq('id', profile.id)
      .select()
      .single();
    if (!error && updated) profile = updated;
  }

  res.json(await buildMeResponse(profile));
});

app.post('/api/me/play', verifyUser, async (req, res) => {
  try {
    const newCount = (req.profile.play_count || 0) + 1;
    await supabaseAdmin.from('profiles').update({ play_count: newCount }).eq('id', req.profile.id);
    res.json({ success: true, playCount: newCount });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/me', verifyUser, async (req, res) => {
  const { bias, dob } = req.body;
  const update = {};
  if (bias) update.bias = bias;
  if (dob !== undefined) update.dob = dob;

  try {
    const { data, error } = await supabaseAdmin.from('profiles').update(update).eq('id', req.profile.id).select().single();
    if (error) throw error;
    res.json({ success: true, bias: data.bias, dob: data.dob });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/me/playlist', verifyUser, async (req, res) => {
  const { playlist } = req.body;
  if (!Array.isArray(playlist)) return res.status(400).json({ error: 'Playlist must be an array' });

  try {
    await supabaseAdmin.from('playlist_tracks').delete().eq('user_id', req.profile.id);
    if (playlist.length > 0) {
      const rows = playlist.map((t, idx) => ({ user_id: req.profile.id, name: t.name, video_id: t.url, position: idx }));
      const { error } = await supabaseAdmin.from('playlist_tracks').insert(rows);
      if (error) throw error;
    }
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
    const { data: profiles, error } = await supabaseAdmin.from('profiles').select('*');
    if (error) throw error;

    const { data: cardCounts } = await supabaseAdmin.from('user_cards').select('user_id, is_duplicate');
    const { data: playlistCounts } = await supabaseAdmin.from('playlist_tracks').select('user_id');

    const safeUsers = profiles.map(p => ({
      id: p.id,
      username: p.username,
      email: p.email,
      bias: p.bias,
      dob: p.dob,
      playlistCount: (playlistCounts || []).filter(t => t.user_id === p.id).length,
      joined: p.created_at,
      photocardsCollected: (cardCounts || []).filter(c => c.user_id === p.id && !c.is_duplicate).length
    }));
    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/users/:id', verifyAdmin, async (req, res) => {
  try {
    await supabaseAdmin.from('profiles').delete().eq('id', req.params.id);
    await supabaseAdmin.auth.admin.deleteUser(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/wall/:id', verifyAdmin, async (req, res) => {
  try {
    await supabaseAdmin.from('wall_messages').delete().eq('id', req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/leaderboard/:id', verifyAdmin, async (req, res) => {
  try {
    await supabaseAdmin.from('leaderboard').delete().eq('id', req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/feedback/:id', verifyAdmin, async (req, res) => {
  try {
    await supabaseAdmin.from('feedback').delete().eq('id', req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Fan Art Gallery ---
app.get('/api/gallery', async (req, res) => {
  const { data: gallery, error } = await supabaseAdmin.from('gallery_art').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Server error' });

  const { data: likes } = await supabaseAdmin.from('gallery_art_likes').select('gallery_art_id, user_id');
  const shaped = gallery.map(g => ({
    _id: g.id, url: g.url, caption: g.caption, author: g.author, date: g.created_at,
    likes: (likes || []).filter(l => l.gallery_art_id === g.id).map(l => l.user_id)
  }));
  res.json(shaped);
});

app.post('/api/gallery', async (req, res) => {
  const { url, caption, author } = req.body;
  if (!url || !caption) return res.status(400).json({ error: 'URL and caption required' });
  try {
    const { data: newArt, error } = await supabaseAdmin
      .from('gallery_art')
      .insert({ url, caption, author: author || 'Anonymous' })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ _id: newArt.id, url: newArt.url, caption: newArt.caption, author: newArt.author, date: newArt.created_at, likes: [] });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/gallery/:id/like', verifyUser, async (req, res) => {
  try {
    const artId = req.params.id;
    const { data: existing } = await supabaseAdmin
      .from('gallery_art_likes').select('*').eq('gallery_art_id', artId).eq('user_id', req.profile.id).maybeSingle();

    if (existing) {
      await supabaseAdmin.from('gallery_art_likes').delete().eq('gallery_art_id', artId).eq('user_id', req.profile.id);
    } else {
      await supabaseAdmin.from('gallery_art_likes').insert({ gallery_art_id: artId, user_id: req.profile.id });
    }

    const { data: likes } = await supabaseAdmin.from('gallery_art_likes').select('user_id').eq('gallery_art_id', artId);
    res.json({ success: true, likes: (likes || []).map(l => l.user_id) });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Photocard Endpoints ---
app.get('/api/cards', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('cards').select('*');
  if (error) return res.status(500).json([]);
  res.json(data.map(cardShape));
});

app.get('/api/collection/:username', async (req, res) => {
  try {
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').ilike('username', req.params.username).maybeSingle();
    if (!profile) return res.status(404).json({ error: 'User not found' });

    const { data: owned } = await supabaseAdmin.from('user_cards').select('cards(*)').eq('user_id', profile.id).eq('is_duplicate', false);

    res.json({
      username: profile.username,
      bias: profile.bias,
      photocards: (owned || []).map(c => cardShape(c.cards)),
      playCount: profile.play_count || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Wishlist Endpoints ---
app.post('/api/wishlist', verifyUser, async (req, res) => {
  const { cardId } = req.body;
  if (!cardId) return res.status(400).json({ error: 'Missing cardId' });

  try {
    const { data: existing } = await supabaseAdmin
      .from('wishlist_items').select('*').eq('user_id', req.profile.id).eq('card_id', cardId).maybeSingle();

    if (existing) {
      await supabaseAdmin.from('wishlist_items').delete().eq('user_id', req.profile.id).eq('card_id', cardId);
    } else {
      await supabaseAdmin.from('wishlist_items').insert({ user_id: req.profile.id, card_id: cardId });
    }

    const { data: wishlistRows } = await supabaseAdmin.from('wishlist_items').select('card_id').eq('user_id', req.profile.id);
    res.json({ success: true, wishlist: (wishlistRows || []).map(w => w.card_id) });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Notification Endpoints ---
app.get('/api/notifications', verifyUser, async (req, res) => {
  const { data } = await supabaseAdmin.from('notifications').select('*').eq('user_id', req.profile.id).order('created_at', { ascending: false });
  res.json((data || []).map(n => ({ _id: n.id, message: n.message, read: n.read, date: n.created_at })));
});

app.post('/api/notifications/read', verifyUser, async (req, res) => {
  try {
    await supabaseAdmin.from('notifications').update({ read: true }).eq('user_id', req.profile.id);
    const { data } = await supabaseAdmin.from('notifications').select('*').eq('user_id', req.profile.id).order('created_at', { ascending: false });
    res.json({ success: true, notifications: (data || []).map(n => ({ _id: n.id, message: n.message, read: n.read, date: n.created_at })) });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Trade Endpoints ---
app.get('/api/trades', async (req, res) => {
  try {
    const { data: trades, error } = await supabaseAdmin.from('trades').select('*').eq('status', 'Open').order('created_at', { ascending: false });
    if (error) throw error;

    const { data: wishlists } = await supabaseAdmin.from('wishlist_items').select('card_id');

    const shaped = trades.map(t => {
      let wantCount = 0;
      if (t.offered_card && t.offered_card.id) {
        wantCount = (wishlists || []).filter(w => w.card_id === t.offered_card.id).length;
      }
      return {
        _id: t.id, creator: t.creator, offeredCard: t.offered_card, requestedRarity: t.requested_rarity,
        status: t.status, acceptedBy: t.accepted_by, dateCreated: t.created_at, wantCount
      };
    });
    res.json(shaped);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/trades', verifyUser, async (req, res) => {
  const { offeredCardUrl, requestedRarity } = req.body;
  if (!offeredCardUrl || !requestedRarity) return res.status(400).json({ error: 'Missing parameters' });

  try {
    const { data: allDupes } = await supabaseAdmin.from('user_cards').select('id, cards(*)').eq('user_id', req.profile.id).eq('is_duplicate', true);
    const match = (allDupes || []).find(c => c.cards && c.cards.url === offeredCardUrl);
    if (!match) return res.status(400).json({ error: 'You do not own this card in your trade pile' });

    const offeredCard = cardShape(match.cards);

    // Remove card from inventory (Escrow)
    await supabaseAdmin.from('user_cards').delete().eq('id', match.id);

    const { data: trade, error: tradeErr } = await supabaseAdmin
      .from('trades')
      .insert({ creator: req.profile.username, offered_card: offeredCard, requested_rarity: requestedRarity })
      .select()
      .single();
    if (tradeErr) throw tradeErr;

    res.json({
      success: true,
      trade: { _id: trade.id, creator: trade.creator, offeredCard: trade.offered_card, requestedRarity: trade.requested_rarity, status: trade.status, dateCreated: trade.created_at },
      user: await buildMeResponse(req.profile)
    });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/trades/:id/accept', verifyUser, async (req, res) => {
  const { acceptedCardUrl } = req.body;
  if (!acceptedCardUrl) return res.status(400).json({ error: 'Missing card' });

  try {
    const { data: trade } = await supabaseAdmin.from('trades').select('*').eq('id', req.params.id).maybeSingle();
    if (!trade || trade.status !== 'Open') return res.status(400).json({ error: 'Trade unavailable' });
    if (trade.creator === req.profile.username) return res.status(400).json({ error: 'Cannot accept own trade' });

    const { data: allDupes } = await supabaseAdmin.from('user_cards').select('id, cards(*)').eq('user_id', req.profile.id).eq('is_duplicate', true);
    const match = (allDupes || []).find(c => c.cards && c.cards.url === acceptedCardUrl);
    if (!match) return res.status(400).json({ error: 'You do not own this card in your trade pile' });

    const acceptedCard = cardShape(match.cards);
    if (trade.requested_rarity !== 'Any' && acceptedCard.rarity !== trade.requested_rarity) {
      return res.status(400).json({ error: `You must offer a ${trade.requested_rarity} card` });
    }

    // Remove acceptor's offered duplicate
    await supabaseAdmin.from('user_cards').delete().eq('id', match.id);

    // Give acceptor the trade's offered card (as owned, or duplicate if already owned)
    const { data: acceptorOwns } = await supabaseAdmin
      .from('user_cards').select('id').eq('user_id', req.profile.id).eq('card_id', trade.offered_card.id).eq('is_duplicate', false).maybeSingle();
    await supabaseAdmin.from('user_cards').insert({ user_id: req.profile.id, card_id: trade.offered_card.id, is_duplicate: !!acceptorOwns });

    // Give creator the accepted card
    const { data: creatorProfile } = await supabaseAdmin.from('profiles').select('id').ilike('username', trade.creator).maybeSingle();
    if (creatorProfile) {
      const { data: creatorOwns } = await supabaseAdmin
        .from('user_cards').select('id').eq('user_id', creatorProfile.id).eq('card_id', acceptedCard.id).eq('is_duplicate', false).maybeSingle();
      await supabaseAdmin.from('user_cards').insert({ user_id: creatorProfile.id, card_id: acceptedCard.id, is_duplicate: !!creatorOwns });

      await supabaseAdmin.from('notifications').insert({
        user_id: creatorProfile.id,
        message: `@${req.profile.username} accepted your trade and sent you a ${acceptedCard.rarity} card!`
      });
    }

    await supabaseAdmin.from('trades').update({ status: 'Completed', accepted_by: req.profile.username }).eq('id', trade.id);

    const { data: freshProfile } = await supabaseAdmin.from('profiles').select('*').eq('id', req.profile.id).single();
    res.json({ success: true, user: await buildMeResponse(freshProfile) });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/trades/:id/cancel', verifyUser, async (req, res) => {
  try {
    const { data: trade } = await supabaseAdmin.from('trades').select('*').eq('id', req.params.id).maybeSingle();
    if (!trade || trade.status !== 'Open') return res.status(400).json({ error: 'Trade unavailable' });
    if (trade.creator !== req.profile.username) return res.status(403).json({ error: 'Unauthorized' });

    // Return card to trade pile
    await supabaseAdmin.from('user_cards').insert({ user_id: req.profile.id, card_id: trade.offered_card.id, is_duplicate: true });
    await supabaseAdmin.from('trades').update({ status: 'Cancelled' }).eq('id', trade.id);

    const { data: freshProfile } = await supabaseAdmin.from('profiles').select('*').eq('id', req.profile.id).single();
    res.json({ success: true, user: await buildMeResponse(freshProfile) });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/me/pull', verifyUser, async (req, res) => {
  const profile = req.profile;
  const pullsAvailable = profile.pulls_available !== undefined ? profile.pulls_available : 1;
  if (pullsAvailable <= 0) {
    return res.status(400).json({ error: 'You have no pulls available right now! Build your login streak or come back tomorrow.' });
  }

  try {
    const { data: allCards, error: cardsErr } = await supabaseAdmin.from('cards').select('*');
    if (cardsErr || !allCards || allCards.length === 0) return res.status(500).json({ error: 'No cards available' });

    // Limited Edition Banner Logic
    const ACTIVE_BANNER = null; // Change this to activate a limited banner (e.g. "Debut Anniversary")
    let cards = allCards.filter(c => !c.banner || c.banner === ACTIVE_BANNER);
    if (cards.length === 0) return res.status(500).json({ error: 'No cards available in current banner' });

    const { data: owned } = await supabaseAdmin.from('user_cards').select('card_id').eq('user_id', profile.id).eq('is_duplicate', false);
    const uniqueCollected = new Set((owned || []).map(c => c.card_id));

    // Pity System Logic
    let pullsSinceEpic = (profile.pulls_since_epic || 0) + 1;
    let pullsSinceLegendary = (profile.pulls_since_legendary || 0) + 1;

    let rarity = 'Common';
    if (pullsSinceLegendary >= 50) {
      rarity = 'Legendary';
      pullsSinceLegendary = 0;
    } else if (pullsSinceEpic >= 10) {
      rarity = 'Epic';
      pullsSinceEpic = 0;
    } else {
      const roll = Math.random() * 100;
      if (roll > 95) { rarity = 'Legendary'; pullsSinceLegendary = 0; }
      else if (roll > 80) { rarity = 'Epic'; pullsSinceEpic = 0; }
      else if (roll > 55) rarity = 'Rare';
    }

    let pool = cards.filter(c => c.rarity === rarity);
    if (pool.length === 0) pool = cards;

    const pulledCard = pool[Math.floor(Math.random() * pool.length)];
    const isDuplicate = uniqueCollected.has(pulledCard.id);

    await supabaseAdmin.from('user_cards').insert({ user_id: profile.id, card_id: pulledCard.id, is_duplicate: isDuplicate });

    const { data: updatedProfile, error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({
        pulls_available: pullsAvailable - 1,
        pulls_since_epic: pullsSinceEpic,
        pulls_since_legendary: pullsSinceLegendary,
        last_pull_date: new Date().toISOString()
      })
      .eq('id', profile.id)
      .select()
      .single();
    if (updateErr) throw updateErr;

    res.json({ success: true, card: cardShape(pulledCard), isDuplicate, user: await buildMeResponse(updatedProfile) });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
