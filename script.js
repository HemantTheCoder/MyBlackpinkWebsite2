// Redirect to https
var loc = window.location.href + '';
if (loc.indexOf('http://') == 0 && !loc.includes('localhost') && !loc.includes('127.0.0.1') && !loc.includes('file://')) {
  window.location.href = loc.replace('http://', 'https://');
}

// =============================================
// YOUTUBE MUSIC PLAYER
// =============================================
const ytPlaylist = [
  { title: "Whistle", artist: "BLACKPINK", videoId: "dISNgvVpSIM" },
  { title: "Boombayah", artist: "BLACKPINK", videoId: "bwmSjveL3Lc" },
  { title: "Playing With Fire", artist: "BLACKPINK", videoId: "9pdj4iJD08s" },
  { title: "As If It's Your Last", artist: "BLACKPINK", videoId: "Amq-qlqbjYA" },
  { title: "DDU-DU DDU-DU", artist: "BLACKPINK", videoId: "IHNzOHi8sJs" },
  { title: "Kill This Love", artist: "BLACKPINK", videoId: "2S24-y0Ij3Y" },
  { title: "How You Like That", artist: "BLACKPINK", videoId: "ioNng23DkIM" },
  { title: "Lovesick Girls", artist: "BLACKPINK", videoId: "dyRsYk0LyA8" },
  { title: "Ice Cream (ft. Selena Gomez)", artist: "BLACKPINK", videoId: "vjCZ0qYRDFQ" },
  { title: "Pink Venom", artist: "BLACKPINK", videoId: "gQlMMD8auMs" },
  { title: "Shut Down", artist: "BLACKPINK", videoId: "POe9SOEKotk" },
  { title: "APT.", artist: "Rose ft. Bruno Mars", videoId: "ekr2nIex040" },
  { title: "Rockstar", artist: "Lisa", videoId: "gdFRYP7PmkI" },
  { title: "FLOWER", artist: "Jisoo", videoId: "YudHcBIxlYw" },
  { title: "Lalisa", artist: "Lisa", videoId: "awkkyBH2zEo" },
];

let ytPlayer = null;
let ytCurrentTrack = 0;
let ytIsPlaying = false;
let ytPlayerReady = false;

// Load YouTube IFrame API once
(function loadYTAPI() {
  if (document.getElementById('yt-api-script')) return;
  const tag = document.createElement('script');
  tag.id = 'yt-api-script';
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
})();

window.onYouTubeIframeAPIReady = function () {
  const container = document.getElementById('yt-player');
  if (!container) return;
  ytPlayer = new YT.Player('yt-player', {
    height: '170',
    width: '296',
    videoId: ytPlaylist[ytCurrentTrack].videoId,
    playerVars: { autoplay: 0, modestbranding: 1, rel: 0, iv_load_policy: 3 },
    events: {
      onReady: function () {
        ytPlayerReady = true;
        renderTracklist();
        updateTrackInfo();
      },
      onStateChange: function (e) {
        if (e.data === YT.PlayerState.PLAYING) {
          ytIsPlaying = true;
          const btn = document.getElementById('yt-play-btn');
          if (btn) btn.textContent = '\u23F8';
        } else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) {
          ytIsPlaying = false;
          const btn = document.getElementById('yt-play-btn');
          if (btn) btn.textContent = '\u25B6';
          if (e.data === YT.PlayerState.ENDED) ytNext();
        }
      }
    }
  });
};

function renderTracklist() {
  const list = document.getElementById('player-tracklist');
  if (!list) return;
  list.innerHTML = ytPlaylist.map((t, i) => `
    <div class="tracklist-item ${i === ytCurrentTrack ? 'active' : ''}" onclick="ytLoadTrack(${i})">
      <span class="tracklist-num">${i === ytCurrentTrack ? '\u266A' : i + 1}</span>
      <span class="tracklist-name">${t.title}</span>
    </div>
  `).join('');
}

function updateTrackInfo() {
  const t = ytPlaylist[ytCurrentTrack];
  const title = document.getElementById('yt-track-name');
  const artist = document.getElementById('yt-track-artist');
  if (title) title.textContent = t.title;
  if (artist) artist.textContent = t.artist;
  renderTracklist();
}

window.ytLoadTrack = function (idx) {
  ytCurrentTrack = idx;
  if (ytPlayer && ytPlayerReady) {
    ytPlayer.loadVideoById(ytPlaylist[idx].videoId);
    ytIsPlaying = true;
  }
  updateTrackInfo();
};

window.ytPlayPause = function () {
  if (!ytPlayer || !ytPlayerReady) return;
  if (ytIsPlaying) {
    ytPlayer.pauseVideo();
  } else {
    ytPlayer.playVideo();
  }
};

window.ytNext = function () {
  ytCurrentTrack = (ytCurrentTrack + 1) % ytPlaylist.length;
  ytLoadTrack(ytCurrentTrack);
};

window.ytPrev = function () {
  ytCurrentTrack = (ytCurrentTrack - 1 + ytPlaylist.length) % ytPlaylist.length;
  ytLoadTrack(ytCurrentTrack);
};

window.toggleMusicPlayer = function () {
  const player = document.getElementById('music-player');
  if (!player) return;
  player.classList.toggle('collapsed');
  const icon = document.getElementById('player-toggle-icon');
  if (icon) icon.textContent = player.classList.contains('collapsed') ? '\u25B2' : '\u25BC';
  localStorage.setItem('playerCollapsed', player.classList.contains('collapsed'));
};

// =============================================
// ERA TOGGLE
// =============================================
const ERA_KEY = 'selectedEra';
const eras = [
  { key: 'default', label: '\uD83D\uDDA4 Original', body: '' },
  { key: 'born-pink', label: '\uD83C\uDF38 Born Pink', body: 'era-born-pink' },
  { key: 'deadline', label: '\u26A1 Deadline', body: 'era-deadline' },
];
let eraIdx = 0;

function applyEra() {
  document.body.classList.remove('era-born-pink', 'era-deadline');
  if (eras[eraIdx].body) document.body.classList.add(eras[eraIdx].body);
  const btn = document.getElementById('era-toggle-btn');
  if (btn) btn.textContent = eras[eraIdx].label;
}

window.cycleEra = function () {
  eraIdx = (eraIdx + 1) % eras.length;
  localStorage.setItem(ERA_KEY, eraIdx);
  applyEra();
  showToast('Era: ' + eras[eraIdx].label);
};

// =============================================
// LIGHTSTICK CANVAS
// =============================================
function initLightstickCanvas() {
  const canvas = document.getElementById('lightstick-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  const sticks = Array.from({ length: 18 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vy: 0.3 + Math.random() * 0.5,
    vx: (Math.random() - 0.5) * 0.4,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.02,
    alpha: 0.3 + Math.random() * 0.5,
    scale: 0.6 + Math.random() * 0.8,
    color: Math.random() > 0.5 ? '#ff2a85' : '#ff66b2',
    pulseSpeed: 0.02 + Math.random() * 0.03,
    pulsePhase: Math.random() * Math.PI * 2,
  }));

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sticks.forEach(s => {
      s.y += s.vy;
      s.x += s.vx;
      s.rot += s.rotSpeed;
      s.pulsePhase += s.pulseSpeed;
      const glow = 0.3 + 0.2 * Math.sin(s.pulsePhase);
      if (s.y > canvas.height + 60) { s.y = -60; s.x = Math.random() * canvas.width; }
      if (s.x < -60) s.x = canvas.width + 60;
      if (s.x > canvas.width + 60) s.x = -60;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.scale(s.scale, s.scale);
      ctx.globalAlpha = glow;
      ctx.shadowBlur = 15;
      ctx.shadowColor = s.color;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(-8, -20, 16, 24, 8);
      } else {
        ctx.rect(-8, -20, 16, 24);
      }
      ctx.fill();
      ctx.fillStyle = '#333';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(-3, 4, 6, 18, 3);
      } else {
        ctx.rect(-3, 4, 6, 18);
      }
      ctx.fill();
      ctx.restore();
    });
    requestAnimationFrame(animate);
  }
  animate();
}

// =============================================
// PETAL RAIN
// =============================================
function initPetalRain() {
  for (let i = 0; i < 12; i++) {
    const petal = document.createElement('div');
    petal.className = 'petal';
    petal.style.left = Math.random() * 100 + 'vw';
    petal.style.animationDuration = (5 + Math.random() * 8) + 's';
    petal.style.animationDelay = (Math.random() * 8) + 's';
    petal.style.width = (8 + Math.random() * 10) + 'px';
    petal.style.height = petal.style.width;
    petal.style.opacity = (0.4 + Math.random() * 0.5).toString();
    document.body.appendChild(petal);
  }
}

// =============================================
// BACK TO TOP
// =============================================
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) btn.classList.add('visible');
    else btn.classList.remove('visible');
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// =============================================
// LOADING SCREEN
// =============================================
function initLoadingScreen() {
  const screen = document.getElementById('loading-screen');
  if (!screen) return;
  setTimeout(() => {
    screen.classList.add('hidden');
    setTimeout(() => { if (screen.parentNode) screen.remove(); }, 700);
  }, 1400);
}

// =============================================
// TOAST NOTIFICATIONS
// =============================================
window.showToast = function (message, duration) {
  duration = duration || 3000;
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(function () {
    toast.classList.add('hide');
    setTimeout(function () { if (toast.parentNode) toast.remove(); }, 350);
  }, duration);
};

// =============================================
// SCROLL REVEAL
// =============================================
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  if (!els.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(el => observer.observe(el));
}

// =============================================
// SPA ROUTING
// =============================================
document.addEventListener('DOMContentLoaded', function () {
  initAll();
});

function initAll() {
  initLoadingScreen();
  setupSPA();
  setupClickEffect();
  initBackToTop();
  initPetalRain();
  initLightstickCanvas();
  initScrollReveal();
  eraIdx = parseInt(localStorage.getItem(ERA_KEY) || '0');
  applyEra();
  const playerCollapsed = localStorage.getItem('playerCollapsed') === 'true';
  const player = document.getElementById('music-player');
  if (player && playerCollapsed) player.classList.add('collapsed');
  if (document.getElementById('game-start') && document.getElementById('question-text')) {
    initTriviaGame();
  }
  if (document.getElementById('board')) {
    initPuzzle();
  }
  if (document.getElementById('daily-question-text')) {
    initDailyChallenge();
  }
  if (document.getElementById('lyrics-question')) {
    initLyricsGame();
  }
  if (document.getElementById('silhouette-img')) {
    initSilhouetteGame();
  }
  if (document.getElementById('poll-opt-Square-Up')) {
    initFanPoll();
  }
}

function setupSPA() {
  document.body.addEventListener('click', function (e) {
    const link = e.target.closest('a');
    if (link && link.href && link.host === window.location.host && !link.hasAttribute('target')) {
      e.preventDefault();
      const url = link.href;
      if (url !== window.location.href) {
        navigateTo(url);
      }
    }
  });
  window.addEventListener('popstate', function () {
    navigateTo(window.location.href, false);
  });
}

async function navigateTo(url, push) {
  if (push === undefined) push = true;
  const overlay = document.getElementById('page-transition');
  if (overlay) {
    overlay.classList.remove('slide-out');
    overlay.classList.add('slide-in');
  }
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network error');
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    await new Promise(r => setTimeout(r, 280));

    const currentHero = document.querySelector('.hero');
    const newHero = doc.querySelector('.hero');
    if (currentHero && newHero) currentHero.outerHTML = newHero.outerHTML;

    const currentMain = document.querySelector('main');
    const newMain = doc.querySelector('main');
    if (currentMain && newMain) currentMain.outerHTML = newMain.outerHTML;

    const currentFooter = document.querySelector('footer');
    const newFooter = doc.querySelector('footer');
    if (currentFooter && newFooter) currentFooter.outerHTML = newFooter.outerHTML;

    document.title = doc.title;
    if (push) window.history.pushState({}, '', url);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (overlay) {
      overlay.classList.remove('slide-in');
      overlay.classList.add('slide-out');
      setTimeout(function () { overlay.classList.remove('slide-out'); }, 350);
    }

    initScrollReveal();
    eraIdx = parseInt(localStorage.getItem(ERA_KEY) || '0');
    applyEra();

    if (document.getElementById('game-start') && document.getElementById('question-text')) initTriviaGame();
    if (document.getElementById('board')) initPuzzle();
    if (document.getElementById('daily-question-text')) initDailyChallenge();
    if (document.getElementById('lyrics-question')) initLyricsGame();
    if (document.getElementById('silhouette-img')) initSilhouetteGame();
    if (document.getElementById('poll-opt-Square-Up')) initFanPoll();

    if (document.getElementById('yt-player') && ytPlayerReady) {
      renderTracklist();
      updateTrackInfo();
    }
  } catch (err) {
    console.error('SPA nav failed:', err);
    if (overlay) overlay.classList.remove('slide-in');
    window.location.href = url;
  }
}

// =============================================
// CLICK SPARKLE EFFECT
// =============================================
function setupClickEffect() {
  document.addEventListener('click', function (e) {
    if (e.target.closest('a') || e.target.closest('button') || e.target.closest('iframe')) return;
    const spark = document.createElement('div');
    spark.className = 'sparkle-effect';
    spark.style.left = e.clientX + 'px';
    spark.style.top = e.clientY + 'px';
    document.body.appendChild(spark);
    setTimeout(function () { if (spark.parentNode) spark.remove(); }, 600);
  });
}

// =============================================
// TRIVIA GAME LOGIC
// =============================================
const triviaData = [
  { q: "What year did BLACKPINK officially debut?", opts: ["2015", "2016", "2017", "2018"], ans: 1 },
  { q: "What is the name of BLACKPINK's fandom?", opts: ["Reveluvs", "Once", "Blinks", "Midzy"], ans: 2 },
  { q: "Which member launched her own solo agency called 'LLOUD'?", opts: ["Jisoo", "Jennie", "Rose", "Lisa"], ans: 3 },
  { q: "Which member made her solo debut with the album '-R-'?", opts: ["Jisoo", "Jennie", "Rose", "Lisa"], ans: 2 },
  { q: "What is the name of BLACKPINK's highly anticipated 2026 mini-album?", opts: ["Born Pink", "The Album", "Deadline", "Square Up"], ans: 2 },
  { q: "Which BLACKPINK music video was the first K-pop group video to hit 1 Billion views?", opts: ["Boombayah", "As If It's Your Last", "DDU-DU DDU-DU", "Kill This Love"], ans: 2 },
  { q: "Who is the oldest member of BLACKPINK?", opts: ["Jisoo", "Jennie", "Rose", "Lisa"], ans: 0 },
  { q: "Which member is known as the 'Human Chanel'?", opts: ["Jisoo", "Jennie", "Rose", "Lisa"], ans: 1 },
  { q: "What is Lisa's massive 2024 hit single?", opts: ["Money", "Rockstar", "Lalisa", "Shoong"], ans: 1 },
  { q: "Rose's historic 2024 viral hit 'APT.' features which Western artist?", opts: ["Selena Gomez", "Lady Gaga", "Bruno Mars", "The Weeknd"], ans: 2 },
  { q: "Which member established the solo label 'BLISSOO'?", opts: ["Jisoo", "Jennie", "Rose", "Lisa"], ans: 0 },
  { q: "Jennie's solo label is called:", opts: ["ODD ATELIER (OA)", "BLISSOO", "LLOUD", "THEBLACKLABEL"], ans: 0 },
  { q: "Which member starred in the zombie drama 'Influenza'?", opts: ["Jisoo", "Jennie", "Rose", "Lisa"], ans: 0 },
  { q: "What was BLACKPINK's debut double single?", opts: ["Whistle & Boombayah", "Playing With Fire & Stay", "As If It's Your Last & Forever Young", "DDU-DU DDU-DU & Really"], ans: 0 },
  { q: "Which member was born in Thailand?", opts: ["Jisoo", "Jennie", "Rose", "Lisa"], ans: 3 },
  { q: "Which member grew up in Australia?", opts: ["Jisoo", "Jennie", "Rose", "Lisa"], ans: 2 },
  { q: "What is the name of BLACKPINK's 2026 title track featuring Chris Martin?", opts: ["Ready For Love", "GO", "Shut Down", "Pink Venom"], ans: 1 },
  { q: "Which of these is NOT a BLACKPINK song?", opts: ["See U Later", "Hope Not", "Love Dive", "Crazy Over You"], ans: 2 },
  { q: "Who collaborated with BLACKPINK on the song 'Ice Cream'?", opts: ["Dua Lipa", "Cardi B", "Selena Gomez", "Lady Gaga"], ans: 2 },
  { q: "What was the name of BLACKPINK's documentary released on Netflix?", opts: ["Light Up The Sky", "The Movie", "Blackpink Diaries", "Born Pink Memories"], ans: 0 }
];

let gameQuestions = [];
let currentQ = 0;
let score = 0;
let speedRoundMode = false;
let speedTimer = null;
let speedTimeLeft = 10;

window.initTriviaGame = function () {
  const startEl = document.getElementById('game-start');
  if (startEl) {
    startEl.style.display = 'block';
    const activeEl = document.getElementById('game-active');
    const resultEl = document.getElementById('game-result');
    if (activeEl) activeEl.style.display = 'none';
    if (resultEl) resultEl.style.display = 'none';
  }
};

window.startTrivia = function (speedMode) {
  speedRoundMode = speedMode === true;
  gameQuestions = [...triviaData].sort(function () { return 0.5 - Math.random(); }).slice(0, 10);
  currentQ = 0;
  score = 0;
  document.getElementById('game-start').style.display = 'none';
  document.getElementById('game-result').style.display = 'none';
  document.getElementById('game-active').style.display = 'block';
  loadQuestion();
};

function loadQuestion() {
  if (currentQ >= gameQuestions.length) { showResults(); return; }
  const qData = gameQuestions[currentQ];
  document.getElementById('question-text').textContent = qData.q;
  document.getElementById('score-text').textContent = score;
  document.getElementById('q-counter').textContent = currentQ + 1;
  const container = document.getElementById('options-container');
  container.innerHTML = '';
  qData.opts.forEach(function (opt, index) {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.onclick = function () { selectAnswer(index, btn); };
    container.appendChild(btn);
  });
  if (speedRoundMode) startSpeedTimer();
}

function startSpeedTimer() {
  clearInterval(speedTimer);
  speedTimeLeft = 10;
  const display = document.getElementById('timer-display');
  const fill = document.getElementById('timer-bar-fill');
  if (display) { display.textContent = speedTimeLeft; display.classList.remove('danger'); }
  if (fill) { fill.style.width = '100%'; fill.classList.remove('danger'); }
  speedTimer = setInterval(function () {
    speedTimeLeft--;
    if (display) {
      display.textContent = speedTimeLeft;
      if (speedTimeLeft <= 3) display.classList.add('danger');
    }
    if (fill) {
      fill.style.width = (speedTimeLeft / 10 * 100) + '%';
      if (speedTimeLeft <= 3) fill.classList.add('danger');
    }
    if (speedTimeLeft <= 0) {
      clearInterval(speedTimer);
      const qData = gameQuestions[currentQ];
      const buttons = document.querySelectorAll('.option-btn');
      buttons.forEach(function (b) { b.style.pointerEvents = 'none'; });
      if (buttons[qData.ans]) buttons[qData.ans].classList.add('correct');
      showToast("Time's up!", 1000);
      setTimeout(function () { currentQ++; loadQuestion(); }, 1200);
    }
  }, 1000);
}

function selectAnswer(selectedIndex, btnElement) {
  if (speedRoundMode) clearInterval(speedTimer);
  const qData = gameQuestions[currentQ];
  const buttons = document.querySelectorAll('.option-btn');
  buttons.forEach(function (b) { b.style.pointerEvents = 'none'; });
  if (selectedIndex === qData.ans) {
    btnElement.classList.add('correct');
    score++;
    showToast('Correct! +1', 900);
  } else {
    btnElement.classList.add('wrong');
    buttons[qData.ans].classList.add('correct');
    showToast('Wrong!', 900);
  }
  document.getElementById('score-text').textContent = score;
  setTimeout(function () { currentQ++; loadQuestion(); }, 1200);
}

function showResults() {
  if (speedRoundMode) clearInterval(speedTimer);
  document.getElementById('game-active').style.display = 'none';
  document.getElementById('game-result').style.display = 'block';
  document.getElementById('final-score').textContent = score;
  let rank = "Baby Blink";
  if (score === 10) rank = "Ultimate Blink";
  else if (score >= 8) rank = "Dedicated Fan";
  else if (score >= 5) rank = "Casual Listener";
  document.getElementById('fan-rank').textContent = rank;
  saveHighScore('triviaHighScore', score);
  if (score === 10) showToast('PERFECT SCORE! Ultimate Blink!', 4000);
}

// =============================================
// LEADERBOARD
// =============================================
function saveHighScore(gameKey, currentScore) {
  const highScore = localStorage.getItem(gameKey) || 0;
  const msgEl = document.getElementById('leaderboard-msg');
  if (currentScore > highScore) {
    localStorage.setItem(gameKey, currentScore);
    if (msgEl) { msgEl.textContent = "New High Score Saved!"; msgEl.style.display = 'block'; }
    showToast('New High Score Saved!');
  } else {
    if (msgEl) msgEl.style.display = 'none';
  }
}

// =============================================
// PUZZLE LOGIC
// =============================================
let puzzleMoves = 0;
let puzzleTiles = [];
const puzzleSize = 3;
let puzzleEmptyIdx = 8;
let puzzleComplete = false;

window.initPuzzle = function () {
  puzzleMoves = 0;
  puzzleComplete = false;
  const moveEl = document.getElementById('move-count');
  const resEl = document.getElementById('puzzle-result');
  if (moveEl) moveEl.textContent = puzzleMoves;
  if (resEl) resEl.style.display = 'none';
  puzzleTiles = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  puzzleEmptyIdx = 8;
  for (let i = 0; i < 150; i++) {
    let validMoves = getValidPuzzleMoves(puzzleEmptyIdx);
    let randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    swapPuzzleTiles(puzzleEmptyIdx, randomMove, false);
  }
  renderPuzzleBoard();
};

function getValidPuzzleMoves(idx) {
  const valid = [];
  const row = Math.floor(idx / puzzleSize);
  const col = idx % puzzleSize;
  if (row > 0) valid.push(idx - puzzleSize);
  if (row < puzzleSize - 1) valid.push(idx + puzzleSize);
  if (col > 0) valid.push(idx - 1);
  if (col < puzzleSize - 1) valid.push(idx + 1);
  return valid;
}

function swapPuzzleTiles(i, j, animate) {
  if (animate === undefined) animate = true;
  let temp = puzzleTiles[i]; puzzleTiles[i] = puzzleTiles[j]; puzzleTiles[j] = temp;
  if (puzzleTiles[i] === 8) puzzleEmptyIdx = i;
  if (puzzleTiles[j] === 8) puzzleEmptyIdx = j;
  if (animate) {
    puzzleMoves++;
    const moveEl = document.getElementById('move-count');
    if (moveEl) moveEl.textContent = puzzleMoves;
    renderPuzzleBoard();
    checkPuzzleWin();
  }
}

function renderPuzzleBoard() {
  const board = document.getElementById('board');
  if (!board) return;
  board.innerHTML = '';
  puzzleTiles.forEach(function (val, idx) {
    const div = document.createElement('div');
    div.className = 'tile';
    if (val === 8) {
      div.classList.add('empty');
    } else {
      const row = Math.floor(val / puzzleSize);
      const col = val % puzzleSize;
      div.style.backgroundPosition = col * 50 + '% ' + row * 50 + '%';
      div.onclick = function () { handleTileClick(idx); };
    }
    board.appendChild(div);
  });
}

function handleTileClick(idx) {
  if (puzzleComplete) return;
  const validMoves = getValidPuzzleMoves(puzzleEmptyIdx);
  if (validMoves.includes(idx)) swapPuzzleTiles(puzzleEmptyIdx, idx);
}

function checkPuzzleWin() {
  for (let i = 0; i < 8; i++) { if (puzzleTiles[i] !== i) return; }
  puzzleComplete = true;
  document.getElementById('board').children[8].classList.remove('empty');
  document.getElementById('board').children[8].style.backgroundPosition = '100% 100%';
  document.getElementById('puzzle-result').style.display = 'block';
  document.getElementById('final-moves').textContent = puzzleMoves;
  const bestScore = localStorage.getItem('puzzleBestMoves');
  const msgEl = document.getElementById('puzzle-leaderboard-msg');
  if (!bestScore || puzzleMoves < parseInt(bestScore)) {
    localStorage.setItem('puzzleBestMoves', puzzleMoves);
    if (msgEl) msgEl.textContent = "New Best Score! (Fewest Moves)";
    showToast('New Record!');
  } else {
    if (msgEl) msgEl.textContent = "Great job! Try to beat your record!";
  }
}

// =============================================
// EMOJI GAME LOGIC
// =============================================
const emojiData = [
  { emoji: "\uD83C\uDF66\uD83D\uDC44\uD83D\uDC67\uD83C\uDFFB", ans: "Ice Cream", opts: ["Ice Cream", "Sour Candy", "As If It's Your Last", "Bet You Wanna"] },
  { emoji: "\uD83D\uDD2B\uD83D\uDC94\uD83D\uDD2A", ans: "Kill This Love", opts: ["Kill This Love", "DDU-DU DDU-DU", "Shut Down", "Typa Girl"] },
  { emoji: "\uD83D\uDC96\uD83D\uDC0D\uD83D\uDCA5", ans: "Pink Venom", opts: ["Pink Venom", "How You Like That", "Tally", "Crazy Over You"] },
  { emoji: "\uD83D\uDD25\uD83D\uDC83\uD83C\uDFFB\uD83D\uDED1", ans: "Playing With Fire", opts: ["Playing With Fire", "Boombayah", "Whistle", "Stay"] },
  { emoji: "\uD83D\uDCB5\uD83D\uDCB0\uD83E\uDD11", ans: "Money", opts: ["Lalisa", "Money", "Rockstar", "Hard To Love"] },
  { emoji: "\uD83C\uDF39\uD83C\uDFA4\uD83D\uDC94", ans: "On The Ground", opts: ["Gone", "On The Ground", "APT.", "Hard To Love"] },
  { emoji: "\uD83D\uDE17\uD83D\uDE19\uD83D\uDE1A", ans: "Whistle", opts: ["Whistle", "Boombayah", "Stay", "As If It's Your Last"] },
  { emoji: "\uD83D\uDE98\uD83D\uDEAA\u2B07\uFE0F", ans: "Shut Down", opts: ["Shut Down", "Typa Girl", "Yeah Yeah Yeah", "Ready For Love"] },
  { emoji: "\uD83E\uDD37\uD83C\uDFFB\u200D\u2640\uFE0F\uD83D\uDC4D\uD83C\uDFFB\uD83D\uDC4E\uD83C\uDFFB", ans: "How You Like That", opts: ["How You Like That", "Pretty Savage", "Kick It", "Love To Hate Me"] },
  { emoji: "\uD83C\uDF38\uD83D\uDC67\uD83C\uDFFB\uD83D\uDC95", ans: "Lovesick Girls", opts: ["Lovesick Girls", "Hope Not", "You Never Know", "Don't Know What To Do"] },
  { emoji: "\uD83C\uDFA8\uD83D\uDE80\uD83D\uDD25", ans: "Rockstar", opts: ["Rockstar", "Money", "Shoong", "Lalisa"] },
  { emoji: "\uD83C\uDF3A\uD83D\uDC83\uD83C\uDFFB\uD83D\uDD34", ans: "Flower", opts: ["Flower", "All Eyes On Me", "Solo", "On The Ground"] },
  { emoji: "\uD83C\uDFE2\uD83C\uDF7A\uD83D\uDD7A", ans: "APT.", opts: ["APT.", "On The Ground", "Gone", "Hard To Love"] },
  { emoji: "\uD83D\uDC83\uD83D\uDCA5\uD83D\uDD25", ans: "GO", opts: ["GO", "Ready For Love", "Pink Venom", "Shut Down"] },
  { emoji: "\uD83D\uDC67\uD83C\uDFFB\uD83D\uDC57\uD83D\uDC84", ans: "Mantra", opts: ["Mantra", "You & Me", "Solo", "Flower"] }
];

let emojiRound = 0;
let emojiStreak = 0;
let emojiBestStreak = 0;
let emojiGamePool = [];

window.startEmojiGame = function () {
  emojiGamePool = [...emojiData].sort(function () { return 0.5 - Math.random(); }).slice(0, 10);
  emojiRound = 0; emojiStreak = 0; emojiBestStreak = 0;
  document.getElementById('game-start').style.display = 'none';
  document.getElementById('game-result').style.display = 'none';
  document.getElementById('game-active').style.display = 'block';
  loadEmojiRound();
};

function loadEmojiRound() {
  if (emojiRound >= emojiGamePool.length) { endEmojiGame(); return; }
  const rData = emojiGamePool[emojiRound];
  document.getElementById('emoji-text').textContent = rData.emoji;
  document.getElementById('streak-text').textContent = emojiStreak;
  document.getElementById('r-counter').textContent = emojiRound + 1;
  const container = document.getElementById('options-container');
  container.innerHTML = '';
  const options = [...rData.opts].sort(function () { return 0.5 - Math.random(); });
  const ansIndex = options.indexOf(rData.ans);
  options.forEach(function (opt, index) {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.onclick = function () { selectEmojiAnswer(index, ansIndex, btn); };
    container.appendChild(btn);
  });
}

function selectEmojiAnswer(selectedIndex, ansIndex, btnElement) {
  const buttons = document.querySelectorAll('#options-container .option-btn');
  buttons.forEach(function (b) { b.style.pointerEvents = 'none'; });
  if (selectedIndex === ansIndex) {
    btnElement.classList.add('correct');
    emojiStreak++;
    if (emojiStreak > emojiBestStreak) emojiBestStreak = emojiStreak;
    showToast('Correct streak!', 900);
  } else {
    btnElement.classList.add('wrong');
    buttons[ansIndex].classList.add('correct');
    emojiStreak = 0;
    showToast('Wrong!', 900);
  }
  document.getElementById('streak-text').textContent = emojiStreak;
  setTimeout(function () { emojiRound++; loadEmojiRound(); }, 1200);
}

function endEmojiGame() {
  document.getElementById('game-active').style.display = 'none';
  document.getElementById('game-result').style.display = 'block';
  document.getElementById('final-streak').textContent = emojiBestStreak;
  const globalBest = localStorage.getItem('emojiBestStreak') || 0;
  const msgEl = document.getElementById('leaderboard-msg');
  if (emojiBestStreak > globalBest) {
    localStorage.setItem('emojiBestStreak', emojiBestStreak);
    if (msgEl) msgEl.style.display = 'block';
    showToast('New Best Streak!');
  } else {
    if (msgEl) msgEl.style.display = 'none';
  }
}

// =============================================
// LYRICS GAME LOGIC
// =============================================
const lyricsData = [
  { lyrics: "I'll ____ it loud, I say it bold, I'm done, I'm done", song: "Kill This Love", opts: ["Kill This Love", "How You Like That", "Lovesick Girls", "Shut Down"] },
  { lyrics: "Ddu-du ddu-du du, ddu-du ddu-du du, ddu-du ____", song: "DDU-DU DDU-DU", opts: ["DDU-DU DDU-DU", "Boombayah", "Pink Venom", "Whistle"] },
  { lyrics: "We were born to be ____, lovesick girls", song: "Lovesick Girls", opts: ["Lovesick Girls", "As If It's Your Last", "Stay", "Hope Not"] },
  { lyrics: "Let you be the ____ to my rock-et", song: "Boombayah", opts: ["Boombayah", "Whistle", "Playing With Fire", "Stay"] },
  { lyrics: "Boy you know you got that ____, whistle baby", song: "Whistle", opts: ["Whistle", "Stay", "Boombayah", "As If It's Your Last"] },
  { lyrics: "Ice cream, chillin' chillin', ____ on top", song: "Ice Cream", opts: ["Ice Cream", "As If It's Your Last", "Lovesick Girls", "Pretty Savage"] },
  { lyrics: "Shut down the ____! BLACKPINK!", song: "Shut Down", opts: ["Shut Down", "Pink Venom", "Typa Girl", "Yeah Yeah Yeah"] },
  { lyrics: "My ____ venom, my pink poison", song: "Pink Venom", opts: ["Pink Venom", "Shut Down", "Tally", "Hard To Love"] },
  { lyrics: "I set fire to the ____, yeah I like it like that", song: "Playing With Fire", opts: ["Playing With Fire", "Stay", "Whistle", "As If It's Your Last"] },
  { lyrics: "I was born to be a ____", song: "Rockstar", opts: ["Rockstar", "Money", "Lalisa", "Shoong"] },
  { lyrics: "I'll be your girl, but I'm staying ____", song: "SOLO", opts: ["SOLO", "Flower", "Mantra", "On The Ground"] },
  { lyrics: "All this time I was finding myself, all the answers were ____", song: "On The Ground", opts: ["On The Ground", "Gone", "Hard To Love", "APT."] },
  { lyrics: "APT, APT, ____, APT", song: "APT.", opts: ["APT.", "Flower", "On The Ground", "Gone"] },
  { lyrics: "How you like that, ____, how you like that", song: "How You Like That", opts: ["How You Like That", "Ice Cream", "Pretty Savage", "Lovesick Girls"] },
  { lyrics: "Look at you now, look at ____", song: "How You Like That", opts: ["How You Like That", "Kill This Love", "Shut Down", "DDU-DU DDU-DU"] }
];

let lyricsGamePool = [];
let lyricsCurrentQ = 0;
let lyricsScore = 0;

window.initLyricsGame = function () {
  const startEl = document.getElementById('lyrics-start');
  if (startEl) {
    startEl.style.display = 'block';
    const activeEl = document.getElementById('lyrics-active');
    const resultEl = document.getElementById('lyrics-result');
    if (activeEl) activeEl.style.display = 'none';
    if (resultEl) resultEl.style.display = 'none';
  }
};

window.startLyricsGame = function () {
  lyricsGamePool = [...lyricsData].sort(function () { return 0.5 - Math.random(); }).slice(0, 10);
  lyricsCurrentQ = 0;
  lyricsScore = 0;
  document.getElementById('lyrics-start').style.display = 'none';
  document.getElementById('lyrics-result').style.display = 'none';
  document.getElementById('lyrics-active').style.display = 'block';
  loadLyricsQuestion();
};

function loadLyricsQuestion() {
  if (lyricsCurrentQ >= lyricsGamePool.length) { showLyricsResults(); return; }
  const qData = lyricsGamePool[lyricsCurrentQ];
  document.getElementById('lyrics-question').textContent = '"' + qData.lyrics + '"';
  document.getElementById('lyrics-score-text').textContent = lyricsScore;
  document.getElementById('lyrics-q-counter').textContent = lyricsCurrentQ + 1;
  const container = document.getElementById('lyrics-options');
  container.innerHTML = '';
  const correctSong = qData.song;
  qData.opts.forEach(function (opt, index) {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.onclick = function () { selectLyricsAnswer(opt, correctSong, btn); };
    container.appendChild(btn);
  });
}

function selectLyricsAnswer(selectedSong, correctSong, btnElement) {
  const buttons = document.querySelectorAll('#lyrics-options .option-btn');
  buttons.forEach(function (b) { b.style.pointerEvents = 'none'; });
  if (selectedSong === correctSong) {
    btnElement.classList.add('correct');
    lyricsScore++;
    showToast('Correct!', 900);
  } else {
    btnElement.classList.add('wrong');
    Array.from(buttons).forEach(function (b) { if (b.textContent === correctSong) b.classList.add('correct'); });
    showToast('Wrong!', 900);
  }
  document.getElementById('lyrics-score-text').textContent = lyricsScore;
  setTimeout(function () { lyricsCurrentQ++; loadLyricsQuestion(); }, 1200);
}

function showLyricsResults() {
  document.getElementById('lyrics-active').style.display = 'none';
  document.getElementById('lyrics-result').style.display = 'block';
  document.getElementById('lyrics-final-score').textContent = lyricsScore;
  let rank = "Baby Blink";
  if (lyricsScore === 10) rank = "Lyrics Master";
  else if (lyricsScore >= 8) rank = "Song Scholar";
  else if (lyricsScore >= 5) rank = "Casual Fan";
  document.getElementById('lyrics-fan-rank').textContent = rank;
  saveHighScore('lyricsHighScore', lyricsScore);
}

// =============================================
// SILHOUETTE GAME LOGIC
// =============================================
const memberImages = [
  { name: "Jisoo", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Jisoo_from_BLACKPINK_PUBG_210321_(cropped).jpg?width=600" },
  { name: "Jennie", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Jennie_Kim_from_BLACKPINK_PUBG_210321_(cropped).jpg?width=600" },
  { name: "Rose", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Blackpink_Ros%C3%A9_Rimowa_1.jpg?width=600" },
  { name: "Lisa", url: "https://commons.wikimedia.org/wiki/Special:FilePath/20240314_Lisa_Manoban_07.jpg?width=600" }
];

let silhouetteRounds = [];
let silhouetteCurrentRound = 0;
let silhouetteScore = 0;
let silhouetteHintsUsed = 0;
const blurLevels = [20, 10, 4, 0];

window.initSilhouetteGame = function () {
  const startEl = document.getElementById('silhouette-start');
  if (startEl) {
    startEl.style.display = 'block';
    const activeEl = document.getElementById('silhouette-active');
    const resultEl = document.getElementById('silhouette-result');
    if (activeEl) activeEl.style.display = 'none';
    if (resultEl) resultEl.style.display = 'none';
  }
};

window.startSilhouetteGame = function () {
  silhouetteRounds = [...memberImages, ...memberImages].sort(function () { return 0.5 - Math.random(); });
  silhouetteCurrentRound = 0;
  silhouetteScore = 0;
  document.getElementById('silhouette-start').style.display = 'none';
  document.getElementById('silhouette-result').style.display = 'none';
  document.getElementById('silhouette-active').style.display = 'block';
  loadSilhouetteRound();
};

function loadSilhouetteRound() {
  if (silhouetteCurrentRound >= silhouetteRounds.length) { showSilhouetteResults(); return; }
  silhouetteHintsUsed = 0;
  const member = silhouetteRounds[silhouetteCurrentRound];
  const img = document.getElementById('silhouette-img');
  if (img) {
    img.src = member.url;
    img.style.filter = 'brightness(0.08) contrast(2) blur(' + blurLevels[0] + 'px)';
  }
  document.getElementById('silhouette-score-text').textContent = silhouetteScore;
  document.getElementById('silhouette-round-counter').textContent = silhouetteCurrentRound + 1;
  const hintsEl = document.getElementById('silhouette-hints-left');
  if (hintsEl) hintsEl.textContent = 3 - silhouetteHintsUsed;
  const container = document.getElementById('silhouette-options');
  container.innerHTML = '';
  memberImages.forEach(function (m) {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = m.name;
    btn.onclick = function () { selectSilhouetteAnswer(m.name, btn); };
    container.appendChild(btn);
  });
}

window.useHint = function () {
  if (silhouetteHintsUsed >= 3) return;
  silhouetteHintsUsed++;
  const img = document.getElementById('silhouette-img');
  if (img) img.style.filter = 'brightness(0.15) contrast(1.5) blur(' + blurLevels[silhouetteHintsUsed] + 'px)';
  const hintsEl = document.getElementById('silhouette-hints-left');
  if (hintsEl) hintsEl.textContent = 3 - silhouetteHintsUsed;
  showToast('Hint used! Blur reduced (' + (3 - silhouetteHintsUsed) + ' left)', 1200);
};

function selectSilhouetteAnswer(selectedName, btnElement) {
  const member = silhouetteRounds[silhouetteCurrentRound];
  const buttons = document.querySelectorAll('#silhouette-options .option-btn');
  buttons.forEach(function (b) { b.style.pointerEvents = 'none'; });
  const img = document.getElementById('silhouette-img');
  if (img) img.style.filter = 'none';
  if (selectedName === member.name) {
    btnElement.classList.add('correct');
    const pts = Math.max(1, 3 - silhouetteHintsUsed);
    silhouetteScore += pts;
    showToast('Correct! +' + pts + ' pts', 1200);
  } else {
    btnElement.classList.add('wrong');
    Array.from(buttons).forEach(function (b) { if (b.textContent === member.name) b.classList.add('correct'); });
    showToast('That was ' + member.name + '!', 1500);
  }
  document.getElementById('silhouette-score-text').textContent = silhouetteScore;
  setTimeout(function () { silhouetteCurrentRound++; loadSilhouetteRound(); }, 1800);
}

function showSilhouetteResults() {
  document.getElementById('silhouette-active').style.display = 'none';
  document.getElementById('silhouette-result').style.display = 'block';
  document.getElementById('silhouette-final-score').textContent = silhouetteScore;
  let rank = "Blink Newcomer";
  if (silhouetteScore >= 22) rank = "Visual Expert";
  else if (silhouetteScore >= 16) rank = "Sharp Eye";
  else if (silhouetteScore >= 10) rank = "Getting There";
  document.getElementById('silhouette-rank').textContent = rank;
  saveHighScore('silhouetteHighScore', silhouetteScore);
}

// =============================================
// DAILY CHALLENGE LOGIC
// =============================================
const dailyPool = [
  { q: "What year did BLACKPINK officially debut?", opts: ["2015", "2016", "2017", "2018"], ans: 1 },
  { q: "What is the name of BLACKPINK's fandom?", opts: ["Reveluvs", "Once", "Blinks", "Midzy"], ans: 2 },
  { q: "Which member launched 'LLOUD'?", opts: ["Jisoo", "Jennie", "Rose", "Lisa"], ans: 3 },
  { q: "Which member released the album '-R-'?", opts: ["Jisoo", "Jennie", "Rose", "Lisa"], ans: 2 },
  { q: "Who is the oldest member?", opts: ["Jisoo", "Jennie", "Rose", "Lisa"], ans: 0 },
  { q: "Which member is known as 'Human Chanel'?", opts: ["Jisoo", "Jennie", "Rose", "Lisa"], ans: 1 },
  { q: "Lisa's 2024 hit single is?", opts: ["Money", "Rockstar", "Lalisa", "Shoong"], ans: 1 },
  { q: "Rose's 'APT.' features which artist?", opts: ["Selena Gomez", "Lady Gaga", "Bruno Mars", "The Weeknd"], ans: 2 },
  { q: "Which member established 'BLISSOO'?", opts: ["Jisoo", "Jennie", "Rose", "Lisa"], ans: 0 },
  { q: "Jennie's solo label?", opts: ["ODD ATELIER (OA)", "BLISSOO", "LLOUD", "THEBLACKLABEL"], ans: 0 },
  { q: "Which member starred in 'Influenza'?", opts: ["Jisoo", "Jennie", "Rose", "Lisa"], ans: 0 },
  { q: "BLACKPINK debut double single?", opts: ["Whistle & Boombayah", "Playing With Fire & Stay", "As If It's Your Last & Forever Young", "DDU-DU DDU-DU & Really"], ans: 0 },
  { q: "Which member was born in Thailand?", opts: ["Jisoo", "Jennie", "Rose", "Lisa"], ans: 3 },
  { q: "Which member grew up in Australia?", opts: ["Jisoo", "Jennie", "Rose", "Lisa"], ans: 2 },
  { q: "BLACKPINK's 2026 title track featuring Chris Martin?", opts: ["Ready For Love", "GO", "Shut Down", "Pink Venom"], ans: 1 },
  { q: "Who collaborated on 'Ice Cream'?", opts: ["Dua Lipa", "Cardi B", "Selena Gomez", "Lady Gaga"], ans: 2 },
  { q: "BLACKPINK's Netflix documentary?", opts: ["Light Up The Sky", "The Movie", "Blackpink Diaries", "Born Pink Memories"], ans: 0 },
  { q: "Which is NOT a BLACKPINK song?", opts: ["See U Later", "Hope Not", "Love Dive", "Crazy Over You"], ans: 2 },
  { q: "BLACKPINK first at Coachella in?", opts: ["2018", "2019", "2020", "2022"], ans: 1 },
  { q: "BLACKPINK's 2026 mini-album?", opts: ["Born Pink", "The Album", "Deadline", "Square Up"], ans: 2 },
  { q: "First K-pop group MV to hit 1B views?", opts: ["Boombayah", "As If It's Your Last", "DDU-DU DDU-DU", "Kill This Love"], ans: 2 },
  { q: "Jisoo's debut solo single?", opts: ["Flower", "All Eyes On Me", "Snowdrop", "Bloom"], ans: 0 },
  { q: "Rose's label?", opts: ["LLOUD", "BLISSOO", "THEBLACKLABEL", "ODD ATELIER"], ans: 2 },
  { q: "Lisa's solo debut album?", opts: ["Money", "Lalisa", "Rockstar", "Mantra"], ans: 1 },
  { q: "BLACKPINK's fandom color?", opts: ["Pink & Purple", "Black & Pink", "Red & Black", "White & Pink"], ans: 1 },
  { q: "'See U Later' is from which era?", opts: ["Square One", "Square Up", "Kill This Love", "The Album"], ans: 1 },
  { q: "Which member is the youngest?", opts: ["Jisoo", "Jennie", "Rose", "Lisa"], ans: 3 },
  { q: "What does BLACKPINK's name represent?", opts: ["Two contrasting colors", "Pink is pretty, Black is powerful", "Both cute and deadly", "Korean aesthetic"], ans: 2 },
  { q: "When did Jennie make her solo debut?", opts: ["2017", "2018", "2019", "2020"], ans: 1 },
  { q: "BLACKPINK's 2022 full album?", opts: ["Square Up", "The Album", "Born Pink", "Kill This Love"], ans: 2 },
];

function getDailyQuestion() {
  const today = new Date().toDateString();
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = (hash * 31 + today.charCodeAt(i)) % dailyPool.length;
  }
  return { question: dailyPool[hash], index: hash };
}

window.initDailyChallenge = function () {
  const today = new Date().toDateString();
  const lastDate = localStorage.getItem('lastDailyDate');
  const completed = localStorage.getItem('dailyCompleted') === 'true' && lastDate === today;

  if (lastDate && lastDate !== today) {
    const last = new Date(lastDate);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (last.toDateString() !== yesterday.toDateString()) {
      localStorage.setItem('dailyStreak', '0');
    }
  }

  const streak = parseInt(localStorage.getItem('dailyStreak') || '0');
  const bestStreak = parseInt(localStorage.getItem('dailyBestStreak') || '0');
  const streakEl = document.getElementById('daily-streak');
  if (streakEl) streakEl.textContent = streak;
  const bestEl = document.getElementById('daily-best-streak');
  if (bestEl) bestEl.textContent = bestStreak;

  if (streak >= 7) {
    const badgeEl = document.getElementById('daily-champion-badge');
    if (badgeEl) badgeEl.style.display = 'inline-block';
  }

  const { question } = getDailyQuestion();
  if (completed) {
    showDailyLockScreen(question);
  } else {
    showDailyQuestion(question);
  }
};

function showDailyQuestion(qData) {
  const lockEl = document.getElementById('daily-lock');
  const gameEl = document.getElementById('daily-game');
  const resultEl = document.getElementById('daily-result');
  if (lockEl) lockEl.style.display = 'none';
  if (resultEl) resultEl.style.display = 'none';
  if (gameEl) gameEl.style.display = 'block';
  const textEl = document.getElementById('daily-question-text');
  if (textEl) textEl.textContent = qData.q;
  const container = document.getElementById('daily-options');
  if (!container) return;
  container.innerHTML = '';
  qData.opts.forEach(function (opt, index) {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.onclick = function () { selectDailyAnswer(index, qData.ans, btn); };
    container.appendChild(btn);
  });
}

function selectDailyAnswer(selectedIndex, ansIndex, btnElement) {
  const buttons = document.querySelectorAll('#daily-options .option-btn');
  buttons.forEach(function (b) { b.style.pointerEvents = 'none'; });
  const today = new Date().toDateString();
  localStorage.setItem('lastDailyDate', today);
  localStorage.setItem('dailyCompleted', 'true');
  let streak = parseInt(localStorage.getItem('dailyStreak') || '0');
  const correct = selectedIndex === ansIndex;
  if (correct) {
    btnElement.classList.add('correct');
    streak++;
    showToast('Correct! Streak: ' + streak + '!', 2000);
  } else {
    btnElement.classList.add('wrong');
    buttons[ansIndex].classList.add('correct');
    streak = 0;
    showToast('Wrong! Come back tomorrow!', 2000);
  }
  localStorage.setItem('dailyStreak', streak);
  const bestStreak = parseInt(localStorage.getItem('dailyBestStreak') || '0');
  if (streak > bestStreak) {
    localStorage.setItem('dailyBestStreak', streak);
    if (streak >= 7) showToast('7-Day Streak! Daily Champion!', 3000);
  }
  setTimeout(function () { showDailyResultScreen(correct, streak); }, 1500);
}

function showDailyResultScreen(correct, streak) {
  const gameEl = document.getElementById('daily-game');
  const resultEl = document.getElementById('daily-result');
  if (gameEl) gameEl.style.display = 'none';
  if (resultEl) resultEl.style.display = 'block';
  const resultText = document.getElementById('daily-result-text');
  if (resultText) resultText.textContent = correct ? 'You got it right!' : 'Better luck tomorrow!';
  const streakEl = document.getElementById('daily-result-streak');
  if (streakEl) streakEl.textContent = streak;
}

function showDailyLockScreen(question) {
  const lockEl = document.getElementById('daily-lock');
  const gameEl = document.getElementById('daily-game');
  if (gameEl) gameEl.style.display = 'none';
  if (lockEl) lockEl.style.display = 'block';
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

function updateCountdown() {
  const countdownEl = document.getElementById('midnight-countdown');
  if (!countdownEl) return;
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight - now;
  const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
  const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
  const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
  countdownEl.textContent = h + ':' + m + ':' + s;
}

// =============================================
// FAN POLL LOGIC (for index.html)
// =============================================
window.initFanPoll = function () {
  const voted = localStorage.getItem('fanPollVote');
  if (voted) showPollResults(voted, false);
};

window.castVote = function (choice) {
  if (localStorage.getItem('fanPollVote')) {
    showToast('You already voted!', 2000);
    return;
  }
  const counts = getPollCounts();
  counts[choice] = (counts[choice] || 0) + 1;
  localStorage.setItem('fanPollCounts', JSON.stringify(counts));
  localStorage.setItem('fanPollVote', choice);
  showPollResults(choice, true);
  showToast('Vote cast! Thanks Blink!', 2000);
};

function getPollCounts() {
  try { return JSON.parse(localStorage.getItem('fanPollCounts') || '{}'); } catch (e) { return {}; }
}

function showPollResults(votedChoice, animate) {
  const opts = ['Square Up', 'Kill This Love', 'Born Pink', 'Deadline'];
  const counts = getPollCounts();
  const total = opts.reduce(function (sum, o) { return sum + (counts[o] || 1); }, 0);
  opts.forEach(function (opt) {
    const pct = Math.round(((counts[opt] || 1) / total) * 100);
    const safeId = opt.replace(/\s+/g, '-');
    const bar = document.getElementById('poll-bar-' + safeId);
    const pctEl = document.getElementById('poll-pct-' + safeId);
    const optEl = document.getElementById('poll-opt-' + safeId);
    if (bar) {
      if (animate) { setTimeout(function () { bar.style.width = pct + '%'; }, 100); }
      else { bar.style.width = pct + '%'; }
    }
    if (pctEl) pctEl.textContent = pct + '%';
    if (optEl && opt === votedChoice) optEl.classList.add('voted');
  });
  const badge = document.getElementById('poll-voted-badge');
  if (badge) badge.style.display = 'block';
}
