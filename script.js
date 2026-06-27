const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'http://localhost:3000' : 'https://myblackpinkwebsite2.onrender.com';
// Redirect to https
var loc = window.location.href + '';
if (loc.indexOf('http://') == 0 && !loc.includes('localhost') && !loc.includes('127.0.0.1') && !loc.includes('file://')) {
  window.location.href = loc.replace('http://', 'https://');
}

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

// =============================================
// YOUTUBE MUSIC PLAYER
// =============================================
const defaultYtPlaylist = [
  { title: "Whistle", artist: "BLACKPINK", videoId: "dISNgvVpWlo" },
  { title: "Boombayah", artist: "BLACKPINK", videoId: "bwmSjveL3Lc" },
  { title: "Playing With Fire", artist: "BLACKPINK", videoId: "9pdj4iJD08s" },
  { title: "As If It's Your Last", artist: "BLACKPINK", videoId: "Amq-qlqbjYA" },
  { title: "DDU-DU DDU-DU", artist: "BLACKPINK", videoId: "IHNzOHi8sJs" },
  { title: "Kill This Love", artist: "BLACKPINK", videoId: "2S24-y0Ij3Y" },
  { title: "How You Like That", artist: "BLACKPINK", videoId: "ioNng23DkIM" },
  { title: "Lovesick Girls", artist: "BLACKPINK", videoId: "dyRsYk0LyA8" },
  { title: "Ice Cream", artist: "BLACKPINK", videoId: "vRXZj0DzXIA" },
  { title: "Pink Venom", artist: "BLACKPINK", videoId: "gQlMMD8auMs" },
  { title: "Shut Down", artist: "BLACKPINK", videoId: "POe9SOEKotk" },
  { title: "Typa Girl", artist: "BLACKPINK", videoId: "UhxW9Njqqu0" },
  { title: "Forever Young", artist: "BLACKPINK", videoId: "j73D258QoK8" },
  { title: "Don't Know What To Do", artist: "BLACKPINK", videoId: "bqzDuRz_P7g" },
  { title: "Stay", artist: "BLACKPINK", videoId: "FzVR_fymZw4" },
  { title: "Ready For Love", artist: "BLACKPINK", videoId: "ruaAvL8hYI0" },
  { title: "SOLO", artist: "Jennie", videoId: "b73BI9eUkjM" },
  { title: "Mantra", artist: "Jennie", videoId: "bB3-CUMERIU" },
  { title: "On The Ground", artist: "Rosé", videoId: "CKZvWhCqx1s" },
  { title: "APT.", artist: "Rosé & Bruno Mars", videoId: "ekr2nIex040" },
  { title: "Hard To Love", artist: "Rosé", videoId: "rAhdioquBnI" },
  { title: "LALISA", artist: "Lisa", videoId: "awkkyBH2zEo" },
  { title: "ROCKSTAR", artist: "Lisa", videoId: "hbcGx4MGUMg" },
  { title: "MONEY", artist: "Lisa", videoId: "dNCWe_6HAM8" },
  { title: "FLOWER", artist: "Jisoo", videoId: "YudHcBIxlYw" },
  { title: "All Eyes On Me", artist: "Jisoo", videoId: "NuxAOC6RU9c" },
  { title: "earthquake", artist: "Jisoo", videoId: "2V6lvCUPT8I" }
];

let ytPlaylist = [...defaultYtPlaylist];

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
  
  // Use custom playlist if available
  if (currentUser && currentUser.playlist && currentUser.playlist.length > 0) {
    ytPlaylist = currentUser.playlist.map(t => ({
      title: t.name,
      artist: 'Custom',
      videoId: t.url // url stores the videoId
    }));
  }

  ytPlayer = new YT.Player('yt-player', {
    height: '170',
    width: '296',
    videoId: ytPlaylist[ytCurrentTrack].videoId,
    playerVars: { autoplay: 1, modestbranding: 1, rel: 0, iv_load_policy: 3 },
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
    
    // Track play for Stan Level
    const token = localStorage.getItem('user_token');
    if (token) {
      fetch(`${API_BASE}/api/me/play`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(err => console.log('Error tracking play:', err));
    }
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

let isShuffle = false;
window.ytShuffle = function() {
  isShuffle = !isShuffle;
  const btn = document.getElementById('yt-shuffle-btn');
  if (btn) btn.style.color = isShuffle ? '#ff2a85' : '';
  if (isShuffle) {
    let nextTrack = Math.floor(Math.random() * ytPlaylist.length);
    ytLoadTrack(nextTrack);
  }
};

window.ytNext = function () {
  if (isShuffle) {
    let nextTrack = ytCurrentTrack;
    while(nextTrack === ytCurrentTrack && ytPlaylist.length > 1) {
      nextTrack = Math.floor(Math.random() * ytPlaylist.length);
    }
    ytCurrentTrack = nextTrack;
  } else {
    ytCurrentTrack = (ytCurrentTrack + 1) % ytPlaylist.length;
  }
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
  initBiasEngine();
    initLightstickMode();
  initLightstickMode();
  initDailyStreak();
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
    initBiasEngine();
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
  if (document.getElementById('masonry-grid')) initGallery();
  if (document.querySelector('.timeline-item')) initTimeline();
  if (document.querySelector('.era-tab')) initDiscography();
  if (document.getElementById('tour-map')) initWorldTour();
  if (document.getElementById('quote-card')) initQuoteGenerator();
  if (document.querySelector('.stat-card[data-display]')) initRecords();
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

    document.querySelectorAll('style.page-style').forEach(s => s.remove());
    doc.querySelectorAll('style').forEach(s => {
      const newStyle = document.createElement('style');
      newStyle.className = 'page-style';
      newStyle.textContent = s.textContent;
      document.head.appendChild(newStyle);
    });

    document.querySelectorAll('script.page-script').forEach(s => s.remove());
    doc.querySelectorAll('script:not([src])').forEach(s => {
      if (s.textContent.includes('IntersectionObserver') || s.textContent.includes('INJECTED') || s.textContent.includes('tl-card') || s.textContent.includes('lightbox')) {
        const newScript = document.createElement('script');
        newScript.className = 'page-script';
        let code = s.textContent;
        code = code.replace(/document\.addEventListener\(['"]DOMContentLoaded['"],\s*function\s*\(\)\s*\{/, '');
        code = code.replace(/\}\);?\s*$/, '');
        newScript.textContent = code;
        document.body.appendChild(newScript);
      }
    });

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

    if (document.querySelector('.stat-card[data-display]')) initRecords();
    if (document.getElementById('game-start') && document.getElementById('question-text')) initTriviaGame();
    if (document.getElementById('board')) initPuzzle();
    if (document.getElementById('daily-question-text')) initDailyChallenge();
    if (document.getElementById('lyrics-question')) initLyricsGame();
    if (document.getElementById('silhouette-img')) initSilhouetteGame();
    if (document.getElementById('poll-opt-Square-Up')) initFanPoll();
    if (document.getElementById('wall-form')) initBlinkWall();
    if (document.querySelector('.leaderboard-container')) initLeaderboard();
    if (document.getElementById('feedback-form')) initFeedback();
    if (document.getElementById('user-login-form')) initLogin();
    if (document.getElementById('profile-dashboard')) initProfile();
    
    if (document.getElementById('pull-card-btn')) initPhotocards();
    if (document.getElementById('fanart-grid')) initFanArt();
    if (document.getElementById('birthday-timer')) initBirthdayCountdown();

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
    spark.textContent = typeof biasEmoji !== 'undefined' ? biasEmoji : '✨';
    spark.style.left = (e.clientX - 10) + 'px';
    spark.style.top = (e.clientY - 10) + 'px';
    spark.style.fontSize = '20px';
    spark.style.position = 'fixed';
    spark.style.pointerEvents = 'none';
    spark.style.zIndex = '99999';
    spark.style.animation = 'floatUp 0.6s ease-out forwards';
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
  if (display) { display.textContent = speedTimeLeft; display.classList.remove('timer-danger'); }
  if (fill) { fill.style.width = '100%'; fill.classList.remove('timer-danger'); }
  speedTimer = setInterval(function () {
    speedTimeLeft--;
    if (display) {
      display.textContent = speedTimeLeft;
      if (speedTimeLeft <= 3) display.classList.add('timer-danger');
    }
    if (fill) {
      fill.style.width = (speedTimeLeft / 10 * 100) + '%';
      if (speedTimeLeft <= 3) fill.classList.add('timer-danger');
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

  // GLOBAL LEADERBOARD INTEGRATION (Trivia Only for now)
  if (gameKey === 'triviaHighScore') {
    const username = localStorage.getItem('blink_id') || 'Anonymous Blink';
    fetch(`${API_BASE}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, score: currentScore })
    }).catch(err => console.error('Failed to update global leaderboard:', err));
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
  const validMoves = getValidPuzzleMoves(puzzleEmptyIdx);
  puzzleTiles.forEach(function (val, idx) {
    const div = document.createElement('div');
    div.className = 'tile';
    if (validMoves.includes(idx) && !puzzleComplete) {
      div.classList.add('movable');
    }
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
  triggerConfetti();
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
const blurLevels = [45, 20, 8, 0];

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
    img.style.filter = 'blur(' + blurLevels[0] + 'px) saturate(0.8) contrast(1.2)';
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
  if (img) img.style.filter = 'blur(' + blurLevels[silhouetteHintsUsed] + 'px) saturate(1) contrast(1.1)';
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
  const flash = document.getElementById('reveal-flash');
  if (flash) {
    flash.classList.remove('flash-active');
    void flash.offsetWidth;
    flash.classList.add('flash-active');
  }
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
window.initFanPoll = async function () {
  const voted = localStorage.getItem('fanPollVote');
  try {
    const res = await fetch(API_BASE + '/api/poll');
    if (res.ok) {
      const data = await res.json();
      const counts = {};
      data.forEach(d => counts[d.option] = d.votes);
      showPollResults(voted, false, counts);
    }
  } catch (err) {
    console.error('Failed to fetch poll data', err);
    if (voted) showPollResults(voted, false, getPollCounts()); // fallback
  }
};

window.castVote = async function (choice) {
  if (localStorage.getItem('fanPollVote')) {
    showToast('You already voted!', 2000);
    return;
  }
  
  localStorage.setItem('fanPollVote', choice);
  
  try {
    const res = await fetch(API_BASE + '/api/poll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choice })
    });
    if (res.ok) {
      const data = await res.json();
      const counts = {};
      data.forEach(d => counts[d.option] = d.votes);
      showPollResults(choice, true, counts);
      showToast('Vote cast! Thanks Blink!', 2000);
    }
  } catch (err) {
    showToast('Error saving vote.', 2000);
  }
};

function getPollCounts() {
  try { return JSON.parse(localStorage.getItem('fanPollCounts') || '{}'); } catch (e) { return {}; }
}

function showPollResults(votedChoice, animate, serverCounts = null) {
  const opts = ['Square Up', 'Kill This Love', 'Born Pink', 'Deadline'];
  const counts = serverCounts || getPollCounts();
  const total = opts.reduce(function (sum, o) { return sum + (counts[o] || 0); }, 0);
  
  opts.forEach(function (opt) {
    const votes = counts[opt] || 0;
    const pct = total === 0 ? Math.round(100 / opts.length) : Math.round((votes / total) * 100);
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
  if (badge && votedChoice) badge.style.display = 'block';
}

// =============================================
// GALLERY PAGE
// =============================================
window.initGallery = function () {
  const grid = document.getElementById('masonry-grid');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll('.photo-card'));
  const filterBtns = document.querySelectorAll('.filter-btn');
  const countEl = document.getElementById('count-num');

  // Reveal cards with stagger
  cards.forEach(function (card, i) {
    setTimeout(function () { card.classList.add('visible'); }, i * 60);
  });

  // Filter logic
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      let visible = 0;
      cards.forEach(function (card) {
        const member = card.dataset.member;
        if (filter === 'all' || member === filter) {
          card.classList.remove('hidden');
          visible++;
        } else {
          card.classList.add('hidden');
        }
      });
      if (countEl) countEl.textContent = visible;
    });
  });

  // Lightbox
  let lightboxOpen = false;
  let currentIdx = 0;
  const visibleCards = function () { return cards.filter(function (c) { return !c.classList.contains('hidden'); }); };

  // Build lightbox DOM
  if (!document.getElementById('lightbox')) {
    const lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.innerHTML = `<div class="lb-backdrop"></div>
      <div class="lb-container">
        <div class="lb-top-bar">
          <div class="lb-counter"><strong id="lb-cur">1</strong> / <strong id="lb-total">11</strong></div>
          <button class="lb-close" id="lb-close">✕</button>
        </div>
        <div class="lb-img-wrap">
          <img id="lb-img" src="" alt="">
          <button class="lb-nav lb-prev" id="lb-prev">&#8592;</button>
          <button class="lb-nav lb-next" id="lb-next">&#8594;</button>
        </div>
        <div class="lb-caption" id="lb-caption"></div>
      </div>`;
    document.body.appendChild(lb);

    document.getElementById('lb-close').onclick = closeLightbox;
    document.querySelector('.lb-backdrop').onclick = closeLightbox;
    document.getElementById('lb-prev').onclick = function () { moveLightbox(-1); };
    document.getElementById('lb-next').onclick = function () { moveLightbox(1); };
    document.addEventListener('keydown', function (e) {
      if (!lightboxOpen) return;
      if (e.key === 'ArrowRight') moveLightbox(1);
      if (e.key === 'ArrowLeft') moveLightbox(-1);
      if (e.key === 'Escape') closeLightbox();
    });
  }

  function openLightbox(idx) {
    const vc = visibleCards();
    if (!vc.length) return;
    currentIdx = idx;
    lightboxOpen = true;
    const lb = document.getElementById('lightbox');
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    showLightboxSlide(vc);
  }

  function closeLightbox() {
    lightboxOpen = false;
    document.getElementById('lightbox').classList.remove('open');
    document.body.style.overflow = '';
  }

  function moveLightbox(dir) {
    const vc = visibleCards();
    currentIdx = (currentIdx + dir + vc.length) % vc.length;
    showLightboxSlide(vc);
  }

  function showLightboxSlide(vc) {
    const card = vc[currentIdx];
    const img = card.querySelector('img');
    const lbImg = document.getElementById('lb-img');
    if (img) lbImg.src = img.src;
    document.getElementById('lb-caption').textContent = card.dataset.label || '';
    document.getElementById('lb-cur').textContent = currentIdx + 1;
    document.getElementById('lb-total').textContent = vc.length;
  }

  cards.forEach(function (card, i) {
    card.addEventListener('click', function () {
      const vc = visibleCards();
      const vcIdx = vc.indexOf(card);
      if (vcIdx !== -1) openLightbox(vcIdx);
    });
  });
};

// =============================================
// TIMELINE PAGE
// =============================================
window.initTimeline = function () {
  if (!document.querySelector('.timeline-item')) return;
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.timeline-item').forEach(function (item) {
    observer.observe(item);
  });
};

// =============================================
// DISCOGRAPHY PAGE
// =============================================
window.initDiscography = function () {
  const tabs = document.querySelectorAll('.era-tab');
  const cards = document.querySelectorAll('.era-card');
  if (!tabs.length) return;

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      const filter = tab.dataset.filter;
      cards.forEach(function (card) {
        if (filter === 'ALL' || card.dataset.era === filter) {
          card.style.display = '';
          setTimeout(function () { card.classList.add('visible'); }, 50);
        } else {
          card.classList.remove('visible');
          card.style.display = 'none';
        }
      });
    });
  });

  // Reveal all cards initially
  const obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  cards.forEach(function (c) { obs.observe(c); });
};

// =============================================
// WORLD TOUR MAP PAGE (Leaflet.js)
// =============================================
window.initWorldTour = function () {
  if (!document.getElementById('tour-map')) return;
  if (typeof L === 'undefined') {
    // Leaflet not loaded yet — retry after delay
    setTimeout(window.initWorldTour, 500);
    return;
  }

  const bpStops = [
    { city: 'Seoul', coords: [37.5665, 126.9780], venue: 'KSPO Dome', date: 'Sep 2022' },
    { city: 'Los Angeles', coords: [34.0522, -118.2437], venue: 'Crypto.com Arena', date: 'Feb 2023' },
    { city: 'New York', coords: [40.7128, -74.0060], venue: 'Prudential Center', date: 'Feb 2023' },
    { city: 'Dallas', coords: [32.7767, -96.7970], venue: 'American Airlines Center', date: 'Feb 2023' },
    { city: 'Chicago', coords: [41.8781, -87.6298], venue: 'United Center', date: 'Mar 2023' },
    { city: 'Hamilton', coords: [43.2557, -79.8711], venue: 'FirstOntario Centre', date: 'Mar 2023' },
    { city: 'London', coords: [51.5074, -0.1278], venue: 'The O2', date: 'Mar 2023' },
    { city: 'Paris', coords: [48.8566, 2.3522], venue: 'Accor Arena', date: 'Mar 2023' },
    { city: 'Barcelona', coords: [41.3851, 2.1734], venue: 'Palau Sant Jordi', date: 'Mar 2023' },
    { city: 'Amsterdam', coords: [52.3676, 4.9041], venue: 'Ziggo Dome', date: 'Apr 2023' },
    { city: 'Sydney', coords: [-33.8688, 151.2093], venue: 'Qudos Bank Arena', date: 'Jun 2023' },
    { city: 'Bangkok', coords: [13.7563, 100.5018], venue: 'Impact Arena', date: 'Jun 2023' },
    { city: 'Singapore', coords: [1.3521, 103.8198], venue: 'National Stadium', date: 'Jul 2023' },
    { city: 'Jakarta', coords: [-6.2088, 106.8456], venue: 'Gelora Bung Karno', date: 'Jul 2023' }
  ];

  const dlStops = [
    { city: 'Seoul', coords: [37.5665, 126.9780], venue: 'Olympic Stadium', date: 'Mar 2026' },
    { city: 'Tokyo', coords: [35.6762, 139.6503], venue: 'Tokyo Dome', date: 'Mar 2026' },
    { city: 'Los Angeles', coords: [34.0522, -118.2437], venue: 'SoFi Stadium', date: 'Apr 2026' },
    { city: 'Las Vegas', coords: [36.1699, -115.1398], venue: 'Allegiant Stadium', date: 'Apr 2026' },
    { city: 'New York', coords: [40.7128, -74.0060], venue: 'MetLife Stadium', date: 'Apr 2026' },
    { city: 'London', coords: [51.5074, -0.1278], venue: 'Wembley Stadium', date: 'May 2026' },
    { city: 'Paris', coords: [48.8566, 2.3522], venue: 'Stade de France', date: 'May 2026' },
    { city: 'Berlin', coords: [52.5200, 13.4050], venue: 'Olympiastadion', date: 'May 2026' },
    { city: 'Dubai', coords: [25.2048, 55.2708], venue: 'Coca-Cola Arena', date: 'Jun 2026' },
    { city: 'Mumbai', coords: [19.0760, 72.8777], venue: 'DY Patil Stadium', date: 'Jun 2026' },
    { city: 'Bangkok', coords: [13.7563, 100.5018], venue: 'National Stadium', date: 'Jun 2026' },
    { city: 'Manila', coords: [14.5995, 120.9842], venue: 'Philippine Arena', date: 'Jul 2026' }
  ];

  const map = L.map('tour-map', { center: [20, 10], zoom: 2 });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19
  }).addTo(map);

  let bpLayer = L.layerGroup();
  let dlLayer = L.layerGroup();

  function makeIcon(color) {
    return L.divIcon({
      className: '',
      html: '<div style="width:16px;height:16px;border-radius:50%;background:' + color + ';border:2px solid #fff;box-shadow:0 0 10px ' + color + ';"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
  }

  bpStops.forEach(function (s) {
    L.marker(s.coords, { icon: makeIcon('#ff2a85') })
      .bindPopup('<div style="background:#1a0025;border:1px solid #ff2a85;border-radius:10px;padding:0.8rem;color:#fff;min-width:160px;"><strong style="color:#ff2a85">🌸 ' + s.city + '</strong><br><span style="color:#ddd;font-size:0.85rem;">' + s.venue + '</span><br><span style="color:#aaa;font-size:0.8rem;">📅 ' + s.date + '</span></div>', { maxWidth: 220 })
      .addTo(bpLayer);
  });

  dlStops.forEach(function (s) {
    L.marker(s.coords, { icon: makeIcon('#a855f7') })
      .bindPopup('<div style="background:#0a001a;border:1px solid #a855f7;border-radius:10px;padding:0.8rem;color:#fff;min-width:160px;"><strong style="color:#a855f7">⚡ ' + s.city + '</strong><br><span style="color:#ddd;font-size:0.85rem;">' + s.venue + '</span><br><span style="color:#aaa;font-size:0.8rem;">📅 ' + s.date + '</span></div>', { maxWidth: 220 })
      .addTo(dlLayer);
  });

  bpLayer.addTo(map);

  // Populate city grids
  function renderCityGrid(stops, id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = stops.map(function (s) {
      return '<div class="city-chip"><strong>' + s.city + '</strong><br><span>' + s.venue + '</span><br><em>' + s.date + '</em></div>';
    }).join('');
  }
  renderCityGrid(bpStops, 'bp-city-grid');
  renderCityGrid(dlStops, 'dl-city-grid');

  window.switchTour = function (tour) {
    document.getElementById('btn-bp').classList.toggle('active', tour === 'bp');
    document.getElementById('btn-dl').classList.toggle('active', tour === 'dl');
    if (tour === 'bp') {
      map.removeLayer(dlLayer);
      bpLayer.addTo(map);
    } else {
      map.removeLayer(bpLayer);
      dlLayer.addTo(map);
    }
  };
};

// =============================================
// QUOTE GENERATOR PAGE
// =============================================
window.initQuoteGenerator = function () {
  if (!document.getElementById('quote-display')) return;

  const quotes = [
    { text: "Don't know what to do, it's true — I'm stuck on you.", member: 'BLACKPINK', song: "Don't Know What To Do" },
    { text: "We were born to be alone, but why do I come back to you?", member: 'BLACKPINK', song: 'Lovesick Girls' },
    { text: "I'm the one they call a savage.", member: 'BLACKPINK', song: 'Pretty Savage' },
    { text: "How you like that? Look at you now — you're so beautiful.", member: 'BLACKPINK', song: 'How You Like That' },
    { text: "Boombayah! Call me monster, I'm a savage beast.", member: 'BLACKPINK', song: 'Boombayah' },
    { text: "I set fire to the rain, yeah I like it like that.", member: 'BLACKPINK', song: 'Playing With Fire' },
    { text: "Kill this love — before it kills us first.", member: 'BLACKPINK', song: 'Kill This Love' },
    { text: "Baby I'm a savage. Slightly crazy, totally amazing.", member: 'BLACKPINK', song: 'Pretty Savage' },
    { text: "Ice cream, chillin' chillin', drip on top.", member: 'Rosé & Selena Gomez', song: 'Ice Cream' },
    { text: "Whistle baby, whistle baby, let me know.", member: 'BLACKPINK', song: 'Whistle' },
    { text: "On the ground, on the ground — only on the ground.", member: 'Rosé', song: 'On The Ground' },
    { text: "Money, that's what I want. Money, that's what I need.", member: 'Lisa', song: 'Money' },
    { text: "I'm a diamond, born under pressure.", member: 'Lisa', song: 'Lalisa' },
    { text: "When I look in the mirror, I see a flower.", member: 'Jisoo', song: 'Flower' },
    { text: "Solo — I'm the one for me.", member: 'Jennie', song: 'SOLO' },
    { text: "APT, APT — every time I'm with you.", member: 'Rosé ft. Bruno Mars', song: 'APT.' },
    { text: "Man, it's my world — Rockstar, in control.", member: 'Lisa', song: 'Rockstar' },
    { text: "Mantra — repeat after me: I am everything.", member: 'Jennie', song: 'Mantra' },
    { text: "Pink Venom, drop it on the floor.", member: 'BLACKPINK', song: 'Pink Venom' },
    { text: "Shut down the city — BLACKPINK in your area!", member: 'BLACKPINK', song: 'Shut Down' },
    { text: "I've waited my whole life to be right here with you.", member: 'BLACKPINK', song: 'Ready For Love' },
    { text: "You never know how it feels to be me.", member: 'BLACKPINK', song: 'You Never Know' },
    { text: "Forever young — I want to be forever young.", member: 'BLACKPINK', song: 'Forever Young' },
    { text: "As if it's your last — love me like it's your last.", member: 'BLACKPINK', song: "As If It's Your Last" }
  ];

  const memberQuotes = {
    all: quotes,
    jisoo: quotes.filter(function (q) { return q.member === 'Jisoo' || q.member === 'BLACKPINK'; }),
    jennie: quotes.filter(function (q) { return q.member === 'Jennie' || q.member === 'BLACKPINK'; }),
    rose: quotes.filter(function (q) { return q.member.includes('Rosé') || q.member === 'BLACKPINK'; }),
    lisa: quotes.filter(function (q) { return q.member === 'Lisa' || q.member === 'BLACKPINK'; })
  };

  let currentMember = 'all';
  let currentQuote = null;

  function getRandomQuote() {
    const pool = memberQuotes[currentMember] || quotes;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function displayQuote(q) {
    currentQuote = q;
    const display = document.getElementById('quote-display');
    const songEl = document.getElementById('quote-song');
    const memberEl = document.getElementById('quote-member');
    if (display) {
      display.style.opacity = '0';
      setTimeout(function () {
        display.textContent = '"' + q.text + '"';
        display.style.opacity = '1';
      }, 300);
    }
    if (songEl) songEl.textContent = '— ' + q.song;
    if (memberEl) memberEl.textContent = q.member;
  }

  // Member selector buttons
  document.querySelectorAll('.member-select-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.member-select-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentMember = btn.dataset.member || 'all';
      displayQuote(getRandomQuote());
    });
  });

  // Generate button
  const genBtn = document.getElementById('generate-btn');
  if (genBtn) {
    genBtn.addEventListener('click', function () { displayQuote(getRandomQuote()); });
  }

  // Copy button
  const copyBtn = document.getElementById('copy-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      if (!currentQuote) return;
      const text = '"' + currentQuote.text + '" — ' + currentQuote.member + ' (' + currentQuote.song + ')';
      navigator.clipboard.writeText(text).then(function () {
        if (typeof showToast === 'function') showToast('Quote copied to clipboard! 💗');
      });
    });
  }

  // Share to Instagram button
  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', function () {
      window.open('https://instagram.com/h.e.m.a.n.t_12', '_blank');
    });
  }

  // Load initial quote
  displayQuote(getRandomQuote());
};

// =============================================
// RECORDS PAGE — Animated counters
// =============================================
window.initRecords = function () {
  const statCards = document.querySelectorAll('.stat-card[data-display]');
  if (!statCards.length) return;
  const obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const card = entry.target;
        const display = card.dataset.display;
        const numEl = card.querySelector('[data-counter]');
        if (numEl && !card.dataset.counted) {
          card.dataset.counted = '1';
          numEl.textContent = display; // Just show final value immediately for complex strings
        }
        obs.unobserve(card);
      }
    });
  }, { threshold: 0.3 });
  statCards.forEach(function (c) { obs.observe(c); });

  // Guinness + Billboard slide-in animations
  const slideObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        slideObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.guinness-card, .billboard-card, .yt-card').forEach(function (el) {
    slideObs.observe(el);
  });
};


// =============================================
// QUOTE GENERATOR (full implementation)
// =============================================
const qgLyrics = {
  jisoo: [
    { lyric: "I'm right here. Oh, flower bloomed.", song: 'Flower' },
    { lyric: "Because I'm the one.", song: 'Flower' },
    { lyric: "All my flowers grew for you.", song: 'Flower' },
    { lyric: "BLACKPINK is the revolution.", song: 'Kill This Love' },
    { lyric: "Forever young — I want to be forever young.", song: 'Forever Young' }
  ],
  jennie: [
    { lyric: "I'm the one — solo. You can't get my love.", song: 'SOLO' },
    { lyric: "I walk alone, no one by my side.", song: 'SOLO' },
    { lyric: "I was the one who had your heart.", song: 'SOLO' },
    { lyric: "Mantra — repeat after me: I am everything.", song: 'Mantra' },
    { lyric: "Human, nature — that's just me.", song: 'Human' },
    { lyric: "I'm a mess but a damn beautiful one.", song: 'Mantra' }
  ],
  rose: [
    { lyric: "On the ground, only on the ground — I belong here.", song: 'On The Ground' },
    { lyric: "I've been gone too long from myself.", song: 'Gone' },
    { lyric: "APT — every time I call your name.", song: 'APT.' },
    { lyric: "Hard to love, I know — but I'm worth it.", song: 'Hard To Love' },
    { lyric: "I'm your fire, I'm your flood.", song: 'Gone' },
    { lyric: "The happiest girl — pretending for you.", song: 'The Happiest Girl' }
  ],
  lisa: [
    { lyric: "Money — that's what I want, that's what I need.", song: 'Money' },
    { lyric: "Lalisa, Lalisa, Lalisa — I want to go.", song: 'Lalisa' },
    { lyric: "I'm a rockstar — in control, in the zone.", song: 'Rockstar' },
    { lyric: "I'm the baddest of them all.", song: 'Lalisa' },
    { lyric: "New chapter — watch me shine.", song: 'Rockstar' },
    { lyric: "Born to flex, born to rule.", song: 'Money' }
  ]
};

const qgMemberInfo = {
  jisoo:  { name: 'JISOO',  emoji: '🌸', img: 'Jisoo.webp',   color: '#ff8fab' },
  jennie: { name: 'JENNIE', emoji: '👑', img: 'Jennie.webp',  color: '#ff2a85' },
  rose:   { name: 'ROSÉ',   emoji: '🌹', img: 'Rose.webp',    color: '#ff6eb0' },
  lisa:   { name: 'LISA',   emoji: '💛', img: 'Lisa.webp',    color: '#ffd700' }
};

let qgCurrentMember = null;

window.selectMember = function (member) {
  qgCurrentMember = member;
  document.querySelectorAll('.member-btn').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.member === member);
  });

  const info = qgMemberInfo[member];
  const select = document.getElementById('lyric-select');
  if (!select) return;
  select.innerHTML = '<option value="">— Pick a lyric —</option>';
  (qgLyrics[member] || []).forEach(function (l, i) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = '"' + l.lyric.substring(0, 50) + (l.lyric.length > 50 ? '…' : '') + '" — ' + l.song;
    select.appendChild(opt);
  });

  // Update card with member
  const nameEl = document.getElementById('card-member-name');
  const photoEl = document.getElementById('card-member-photo');
  const imgEl = document.getElementById('card-member-img');
  const emojiEl = document.getElementById('card-emoji');
  if (nameEl) { nameEl.textContent = info.name; nameEl.style.display = ''; }
  if (photoEl) photoEl.style.display = '';
  if (imgEl) imgEl.src = info.img;
  if (emojiEl) { emojiEl.textContent = info.emoji; emojiEl.style.display = ''; }

  // Update card glow color
  const card = document.getElementById('quote-card');
  if (card) card.style.borderColor = info.color + '66';
  const orb = document.getElementById('card-glow-orb');
  if (orb) orb.style.background = 'radial-gradient(circle, ' + info.color + '44 0%, transparent 70%)';

  // Clear lyric
  const lyricEl = document.getElementById('card-lyric');
  const songEl = document.getElementById('card-song');
  const placeholder = document.getElementById('card-placeholder');
  if (lyricEl) lyricEl.style.display = 'none';
  if (songEl) songEl.style.display = 'none';
  if (placeholder) placeholder.style.display = '';
};

window.updateLyric = function () {
  const select = document.getElementById('lyric-select');
  if (!select || !qgCurrentMember) return;
  const idx = parseInt(select.value);
  if (isNaN(idx)) return;
  const lyricData = qgLyrics[qgCurrentMember][idx];
  if (!lyricData) return;

  const lyricEl = document.getElementById('card-lyric');
  const songEl = document.getElementById('card-song');
  const divEl = document.getElementById('card-divider');
  const placeholder = document.getElementById('card-placeholder');
  if (lyricEl) { lyricEl.textContent = '"' + lyricData.lyric + '"'; lyricEl.style.display = ''; }
  if (songEl) { songEl.textContent = '— ' + lyricData.song; songEl.style.display = ''; }
  if (divEl) divEl.style.display = '';
  if (placeholder) placeholder.style.display = 'none';
};

window.shuffleCard = function () {
  const members = Object.keys(qgLyrics);
  const randMember = members[Math.floor(Math.random() * members.length)];
  window.selectMember(randMember);
  const lyrics = qgLyrics[randMember];
  const randIdx = Math.floor(Math.random() * lyrics.length);
  const select = document.getElementById('lyric-select');
  if (select) {
    select.value = randIdx;
    window.updateLyric();
  }
};

window.copyLyric = function () {
  const lyricEl = document.getElementById('card-lyric');
  if (!lyricEl || lyricEl.style.display === 'none') {
    if (typeof showToast === 'function') showToast('Pick a lyric first! 💗');
    return;
  }
  const songEl = document.getElementById('card-song');
  const text = lyricEl.textContent + ' ' + (songEl ? songEl.textContent : '');
  navigator.clipboard.writeText(text).then(function () {
    if (typeof showToast === 'function') showToast('Lyric copied! 💗');
  });
};

window.downloadCard = function () {
  const card = document.getElementById('quote-card');
  if (!card) return;
  const lyricEl = document.getElementById('card-lyric');
  if (!lyricEl || lyricEl.style.display === 'none') {
    if (typeof showToast === 'function') showToast('Select a member and lyric first! 💗');
    return;
  }
  if (typeof html2canvas !== 'undefined') {
    html2canvas(card, { backgroundColor: null, scale: 2 }).then(function (canvas) {
      const link = document.createElement('a');
      link.download = 'blackpink-quote-card.png';
      link.href = canvas.toDataURL();
      link.click();
      if (typeof showToast === 'function') showToast('Card downloaded! 🖤💗');
    });
  } else {
    if (typeof showToast === 'function') showToast('Download not available, try copying instead! 💗');
  }
};


// =============================================
// BIAS PERSONALIZATION ENGINE
// =============================================
let currentBias = localStorage.getItem('blink_bias');
let biasEmoji = '✨';

const biasProfiles = {
  'OT4': { color: '#FF7698', emoji: '✨', trackIdx: 0 },
  'JISOO': { color: '#ff2a2a', emoji: '🐰', trackIdx: 14 }, // Flower
  'JENNIE': { color: '#4a90e2', emoji: '🐻', trackIdx: 11 }, // SOLO
  'ROSE': { color: '#ffb6c1', emoji: '🌹', trackIdx: 12 }, // On The Ground
  'LISA': { color: '#f1c40f', emoji: '🐥', trackIdx: 13 } // Lalisa
};

function initBiasEngine() {
  currentBias = localStorage.getItem('blink_bias');
  if (!currentBias) {
    showBiasModal();
  } else {
    applyBias(currentBias);
  }
}

function showBiasModal() {
  if (document.getElementById('bias-modal')) return;
  const modalHTML = `
    <div id="bias-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); backdrop-filter:blur(10px); z-index:10000; display:flex; justify-content:center; align-items:center; opacity:0; transition:opacity 0.5s;">
      <div style="background:var(--glass-bg); padding:3rem; border-radius:20px; border:1px solid var(--glass-border); text-align:center; max-width:500px; width:90%; box-shadow:0 0 40px rgba(255,118,152,0.3); transform:scale(0.8); transition:transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);" id="bias-modal-content">
        <h2 style="font-size:2rem; margin-bottom:1rem; text-shadow:0 0 10px var(--bp-pink);">Who is your Bias?</h2>
        <p style="margin-bottom:2rem; opacity:0.8;">Personalize your BLINK experience!</p>
        <div style="display:flex; flex-wrap:wrap; gap:1rem; justify-content:center;">
          <button class="btn btn-glow" onclick="selectBias('JISOO')" style="background:rgba(255,42,42,0.2); border-color:#ff2a2a;">🐰 JISOO</button>
          <button class="btn btn-glow" onclick="selectBias('JENNIE')" style="background:rgba(74,144,226,0.2); border-color:#4a90e2;">🐻 JENNIE</button>
          <button class="btn btn-glow" onclick="selectBias('ROSE')" style="background:rgba(255,182,193,0.2); border-color:#ffb6c1;">🌹 ROSÉ</button>
          <button class="btn btn-glow" onclick="selectBias('LISA')" style="background:rgba(241,196,15,0.2); border-color:#f1c40f;">🐥 LISA</button>
          <button class="btn btn-glow" onclick="selectBias('OT4')" style="background:rgba(255,118,152,0.2); border-color:#FF7698; width:100%;">✨ OT4 (All of them!)</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  setTimeout(() => {
    document.getElementById('bias-modal').style.opacity = '1';
    document.getElementById('bias-modal-content').style.transform = 'scale(1)';
  }, 100);
}

window.selectBias = function(bias) {
  localStorage.setItem('blink_bias', bias);
  currentBias = bias;
  applyBias(bias);
  const modal = document.getElementById('bias-modal');
  if (modal) {
    modal.style.opacity = '0';
    document.getElementById('bias-modal-content').style.transform = 'scale(0.8)';
    setTimeout(() => modal.remove(), 500);
  }
  showToast(`Bias set to ${bias}! 🖤💗`);
  
  // Jump to bias track
  if (ytPlayerReady && biasProfiles[bias].trackIdx !== 0) {
    ytLoadTrack(biasProfiles[bias].trackIdx);
  }
};

function applyBias(bias) {
  const profile = biasProfiles[bias] || biasProfiles['OT4'];
  biasEmoji = profile.emoji;
  document.documentElement.style.setProperty('--bp-pink', profile.color);
  
  let rgb = hexToRgb(profile.color);
  if (rgb) {
    document.documentElement.style.setProperty('--bp-pink-glow', `rgba(${rgb.r},${rgb.g},${rgb.b},0.6)`);
    document.documentElement.style.setProperty('--glass-border', `rgba(${rgb.r},${rgb.g},${rgb.b},0.3)`);
  }
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
}


// =============================================
// HAMMER BONG MODE
// =============================================
// Song BPM Dictionary for dynamic syncing
const songBpmDict = {
  "Whistle": 105,
  "Boombayah": 125,
  "Playing With Fire": 110,
  "As If It's Your Last": 125,
  "DDU-DU DDU-DU": 140,
  "Kill This Love": 132,
  "How You Like That": 130,
  "Lovesick Girls": 128,
  "Ice Cream": 120,
  "Pink Venom": 90,
  "Shut Down": 110,
  "Typa Girl": 132,
  "SOLO": 95,
  "Mantra": 115,
  "Dracula": 110,
  "On The Ground": 124,
  "APT.": 120,
  "LALISA": 80,
  "ROCKSTAR": 98,
  "FLOWER": 124,
  "GO": 130,
  "JUMP": 125
};
let currentBpmInterval = null;

function initLightstickMode() {
  if (document.getElementById('hammer-bong-btn')) return;
  
  const bpBongSVG = `<div style="position:relative; width: 100%; height: 100%; display:flex; justify-content:center; align-items:center;">
      <div style="position:absolute; width: 120px; height: 120px; top: 20%; border-radius: 50%; background: radial-gradient(circle, rgba(255,42,133,0.8) 0%, rgba(255,42,133,0) 70%); filter: blur(15px); z-index: 1;"></div>
      <img src="assets/lightstick_dark.png" alt="Lightstick" style="width: 150%; height: 150%; max-height: 400px; object-fit: contain; pointer-events: none; filter: contrast(1.2); mix-blend-mode: screen; position: relative; z-index: 2;" />
    </div>`;
  
  const btn = document.createElement('button');
  btn.id = 'hammer-bong-btn';
  btn.className = 'hammer-bong-btn';
  btn.innerHTML = '🔨'; 
  btn.title = 'Concert Mode (Under Development)';
  btn.onclick = () => showToast('Concert Mode is currently under development! 🛠️', 3000);
  document.body.appendChild(btn);

  const overlay = document.createElement('div');
  overlay.id = 'lightstick-overlay';
  overlay.className = 'lightstick-overlay';
  overlay.innerHTML = `
    <div class="virtual-lightstick" id="virtual-lightstick" style="width: 350px; height: 350px; display:flex; justify-content:center; align-items:center; z-index: 5; pointer-events: none; transition: transform 0.05s ease-out, filter 0.05s ease-out;">
      ${bpBongSVG}
    </div>
    
    <div style="z-index:10; position:absolute; bottom: 15%; display:flex; gap:1rem; flex-direction:column; align-items:center;">
      <p style="color:rgba(255,255,255,0.7); font-weight:700; text-transform:uppercase; letter-spacing:0.1em; text-shadow:0 2px 10px rgba(255,42,133,0.5);">Syncing to: <span id="sync-track-name" style="color:var(--bp-pink);">Waiting...</span></p>
      
      <div style="display:flex; gap:1rem;">
        <button class="btn btn-glow" onclick="triggerFanchant()">🎤 Fanchant</button>
        <button class="btn btn-glow" onclick="toggleLightstickMode()">Exit Concert Mode</button>
      </div>
    </div>
  `;
  
  // Add interactive click to cheer
  overlay.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') {
      triggerCheerEmoji(e.clientX, e.clientY);
      triggerLightstickPulse(true);
    }
  });

  document.body.appendChild(overlay);

  // Handle Mobile Device Orientation (Waving)
  if (window.DeviceMotionEvent) {
    window.addEventListener('devicemotion', (e) => {
      if (document.getElementById('lightstick-overlay').classList.contains('active')) {
        const acc = e.accelerationIncludingGravity;
        if (acc && (Math.abs(acc.x) > 15 || Math.abs(acc.y) > 15)) {
          triggerLightstickPulse(true);
          triggerCheerEmoji(window.innerWidth / 2 + (Math.random() * 100 - 50), window.innerHeight / 2);
        }
      }
    });
  }
}

function injectLightstickStyles() {
  if (document.getElementById('ls-sync-styles')) return;
  const style = document.createElement('style');
  style.id = 'ls-sync-styles';
  style.innerHTML = `
        @keyframes bpmSyncPulse {
      0% { transform: scale(1) rotate(-15deg); filter: brightness(1.1); }
      50% { transform: scale(1.05) rotate(15deg); filter: brightness(1.5); }
      100% { transform: scale(1) rotate(-15deg); filter: brightness(1.1); }
    }
    .ls-sync-active { animation: bpmSyncPulse var(--bpm-duration, 1s) ease-in-out infinite; }
    .ls-sync-manual { transform: scale(1.15) rotate(20deg) !important; filter: brightness(2) !important; transition: all 0.1s ease-out !important; }
  `;
  document.head.appendChild(style);
}

function updateSyncInterval() {
  injectLightstickStyles();
  if (currentBpmInterval) clearInterval(currentBpmInterval);
  
  let currentTitle = "Playing With Fire"; // Fallback
  if (typeof ytPlaylist !== 'undefined' && typeof ytCurrentTrack !== 'undefined') {
    currentTitle = ytPlaylist[ytCurrentTrack].title;
    const syncLabel = document.getElementById('sync-track-name');
    if(syncLabel) syncLabel.innerText = currentTitle;
  }
  
  const bpm = songBpmDict[currentTitle] || 120; // Default to 120 BPM
  const beatDuration = 60 / bpm;
  
  const ls = document.getElementById('virtual-lightstick');
  if (ls) {
    ls.style.setProperty('--bpm-duration', `${beatDuration}s`);
    if (typeof window.ytPlayer !== 'undefined' && window.ytIsPlaying) {
      ls.classList.add('ls-sync-active');
    } else {
      ls.classList.remove('ls-sync-active');
    }
  }
  
  currentBpmInterval = setInterval(() => {
    if (ls && document.getElementById('lightstick-overlay').classList.contains('active')) {
      if (window.ytIsPlaying) {
        if (!ls.classList.contains('ls-sync-active')) ls.classList.add('ls-sync-active');
      } else {
        ls.classList.remove('ls-sync-active');
      }
    }
  }, 500);
}

function toggleLightstickMode() {
  const overlay = document.getElementById('lightstick-overlay');
  overlay.classList.toggle('active');
  if (overlay.classList.contains('active')) {
    updateSyncInterval(); // Start sync engine
    if (typeof window.ytPlayer !== 'undefined' && typeof ytIsPlaying !== 'undefined' && !ytIsPlaying) {
      if (typeof ytPlayPause === 'function') ytPlayPause();
    }
  } else {
    if (currentBpmInterval) clearInterval(currentBpmInterval);
    const ls = document.getElementById('virtual-lightstick');
    if (ls) ls.classList.remove('ls-sync-active');
  }
}

function triggerLightstickPulse(isManual = false) {
  const ls = document.getElementById('virtual-lightstick');
  if (ls) {
    ls.classList.remove('ls-sync-active');
    ls.classList.add('ls-sync-manual');
    setTimeout(() => {
      ls.classList.remove('ls-sync-manual');
      if (typeof window.ytIsPlaying !== 'undefined' && window.ytIsPlaying) {
        ls.classList.add('ls-sync-active');
      }
    }, 150);
  }
}

function triggerCheerEmoji(x, y) {
  const overlay = document.getElementById('lightstick-overlay');
  if (!overlay) return;
  
  const emojis = ['💖', '✨', '🔥', '🎉'];
  const emoji = document.createElement('div');
  emoji.innerText = emojis[Math.floor(Math.random() * emojis.length)];
  emoji.style.position = 'absolute';
  emoji.style.left = `${x}px`;
  emoji.style.top = `${y}px`;
  emoji.style.fontSize = `${Math.random() * 20 + 20}px`;
  emoji.style.pointerEvents = 'none';
  emoji.style.zIndex = '100';
  emoji.style.transition = 'all 1s ease-out';
  emoji.style.textShadow = '0 0 10px rgba(255,255,255,0.8)';
  
  overlay.appendChild(emoji);
  
  requestAnimationFrame(() => {
    emoji.style.transform = `translate(${Math.random() * 100 - 50}px, -150px) scale(1.5)`;
    emoji.style.opacity = '0';
  });
  
  setTimeout(() => {
    if (emoji.parentNode) emoji.parentNode.removeChild(emoji);
  }, 1000);
}

function triggerFanchant() {
  const fanchantText = "KIM JISOO! KIM JENNIE! PARK CHAEYOUNG! LALISA!";
  const overlay = document.getElementById('lightstick-overlay');
  if (!overlay) return;
  
  const chant = document.createElement('div');
  chant.innerText = fanchantText;
  chant.style.position = 'absolute';
  chant.style.width = '100%';
  chant.style.textAlign = 'center';
  chant.style.top = '20%';
  chant.style.color = 'var(--bp-pink)';
  chant.style.fontSize = 'clamp(1.5rem, 5vw, 3rem)';
  chant.style.fontWeight = '900';
  chant.style.letterSpacing = '0.2em';
  chant.style.textShadow = '0 0 20px rgba(255,42,133,0.8), 0 0 40px rgba(255,42,133,0.5)';
  chant.style.zIndex = '50';
  chant.style.pointerEvents = 'none';
  chant.style.animation = 'fanchantAnim 2.5s ease-out forwards';
  
  overlay.appendChild(chant);
  
  // Inject the keyframes if not exists
  if (!document.getElementById('fanchant-style')) {
    const style = document.createElement('style');
    style.id = 'fanchant-style';
    style.innerHTML = `
      @keyframes fanchantAnim {
        0% { transform: scale(0.5); opacity: 0; }
        20% { transform: scale(1.1); opacity: 1; }
        80% { transform: scale(1.2); opacity: 1; }
        100% { transform: scale(1.5); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  setTimeout(() => {
    if (chant.parentNode) chant.parentNode.removeChild(chant);
  }, 2500);
}

// Hook into the player song change to update BPM
const originalYtPlayPause = typeof ytPlayPause === 'function' ? ytPlayPause : null;
// We actually need to hook where the song changes. Let's just poll it safely in the interval, or we already hooked updateSyncInterval into the toggle.
// We can just add an event listener to the ytPlayer onStateChange if we could, but we can also just let updateSyncInterval grab the current track. 
// Actually, I'll modify the next/prev buttons natively or just set it in interval.

// =============================================
// DAILY LOGIN STREAK
// =============================================
function initDailyStreak() {
  const today = new Date().toDateString();
  let lastLogin = localStorage.getItem('last_login_date');
  let streak = parseInt(localStorage.getItem('blink_streak') || '0');

  if (lastLogin !== today) {
    if (lastLogin === new Date(Date.now() - 86400000).toDateString()) {
      streak++; // Logged in yesterday
    } else if (lastLogin !== null) {
      streak = 1; // Missed a day
    } else {
      streak = 1; // First ever login
    }
    localStorage.setItem('last_login_date', today);
    localStorage.setItem('blink_streak', streak);
    
    // Show toast for streak
    setTimeout(() => {
      showToast(`🔥 ${streak} Day BLINK Streak! ${streak >= 3 ? 'Vault unlocked!' : ''}`);
    }, 2000);
  }
}

// =============================================
// BLINK ID GENERATOR
// =============================================
window.generateID = function() {
  const canvas = document.getElementById('id-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const name = document.getElementById('id-name').value || 'BLINK';
  const year = document.getElementById('id-year').value;
  const bias = localStorage.getItem('blink_bias') || 'OT4';

  canvas.style.display = 'block';
  document.getElementById('download-btn').style.display = 'inline-block';

  // Background Gradient
  const grad = ctx.createLinearGradient(0, 0, 600, 350);
  grad.addColorStop(0, '#111');
  grad.addColorStop(1, '#222');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 600, 350);

  // Accent Overlay (Based on Bias)
  const accent = ctx.createLinearGradient(0, 0, 600, 350);
  accent.addColorStop(0, 'transparent');
  let accentColor = '#FF7698';
  if(bias === 'JISOO') accentColor = '#ff2a2a';
  if(bias === 'JENNIE') accentColor = '#4a90e2';
  if(bias === 'ROSE') accentColor = '#ffb6c1';
  if(bias === 'LISA') accentColor = '#f1c40f';
  
  accent.addColorStop(1, accentColor);
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.3;
  ctx.fillRect(0, 0, 600, 350);
  ctx.globalAlpha = 1;

  // Draw Grid / Tech lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for(let i=0; i<600; i+=20) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,350); ctx.stroke(); }
  for(let i=0; i<350; i+=20) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(600,i); ctx.stroke(); }

  // Text Elements
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 30px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('OFFICIAL BLINK ID', 40, 60);

  ctx.fillStyle = accentColor;
  ctx.font = 'bold 20px Arial';
  ctx.fillText('GLOBAL MEMBERSHIP', 40, 90);

  // Line separator
  ctx.beginPath();
  ctx.moveTo(40, 120);
  ctx.lineTo(560, 120);
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Details
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '16px Arial';
  ctx.fillText('NAME', 40, 170);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 36px Arial';
  ctx.fillText(name.toUpperCase(), 40, 210);

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '16px Arial';
  ctx.fillText('STATUS', 40, 260);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px Arial';
  ctx.fillText('BLINK SINCE ' + year, 40, 290);

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '16px Arial';
  ctx.fillText('BIAS', 350, 260);
  ctx.fillStyle = accentColor;
  ctx.font = 'bold 24px Arial';
  ctx.fillText(bias, 350, 290);

  // Logo placeholder (geometric)
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(430, 40, 130, 60);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('BLACKPINK', 495, 75);

  // Bias Image in Corner
  ctx.save();
  ctx.beginPath();
  ctx.arc(520, 270, 40, 0, 2 * Math.PI);
  ctx.clip();
  
  const img = new Image();
  let imgPath = 'assets/blackpinkgroup.webp';
  if (bias === 'JISOO') imgPath = 'assets/Jisoo.webp';
  if (bias === 'JENNIE') imgPath = 'assets/Jennie.webp';
  if (bias === 'ROSE') imgPath = 'assets/Rose.webp';
  if (bias === 'LISA') imgPath = 'assets/Lisa.webp';
  
  img.onload = () => {
    ctx.drawImage(img, 480, 230, 80, 80);
    ctx.restore();
    
    // Draw ring border
    ctx.beginPath();
    ctx.arc(520, 270, 40, 0, 2 * Math.PI);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3;
    ctx.stroke();
  };
  
  // Fallback in case of error
  img.onerror = () => {
    ctx.fillStyle = 'rgba(255, 118, 152, 0.2)';
    ctx.fill();
    ctx.strokeStyle = accentColor;
    ctx.stroke();
    ctx.restore();
  };
  
  img.src = imgPath;
};

window.downloadID = function() {
  const canvas = document.getElementById('id-canvas');
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = 'Blink-ID-' + (document.getElementById('id-name').value || 'Card') + '.png';
  link.href = canvas.toDataURL();
  link.click();
};

// =============================================
// BLINK WALL & LEADERBOARD (SPA INITIALIZERS)
// =============================================
window.initBlinkWall = function() {
  
  async function fetchMessages() {
    const grid = document.getElementById('messages-grid');
    if (!grid) return;
    try {
      const res = await fetch(`${API_BASE}/api/wall`);
      const messages = await res.json();
      
      if (messages.length === 0) {
        grid.innerHTML = '<p class="text-center" style="grid-column: 1 / -1;">No messages yet. Be the first to post!</p>';
        return;
      }
      
      grid.innerHTML = '';
      messages.reverse().forEach(msg => {
        const biasClass = 'bias-' + msg.bias.toLowerCase().replace('é', 'e');
        const card = document.createElement('div');
        card.className = `message-card ${biasClass}`;
        card.innerHTML = `
          <div class="msg-author">${msg.author}</div>
          <div class="msg-content">${msg.message}</div>
          <div class="msg-bias">Bias: ${msg.bias}</div>
        `;
        grid.appendChild(card);
      });
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      grid.innerHTML = '<p class="text-center" style="grid-column: 1 / -1; color: red;">Failed to load messages. Is the backend running?</p>';
    }
  }
  
  const form = document.getElementById('wall-form');
  if (form) {
    // Remove existing listeners by cloning
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    newForm.onsubmit = async (e) => {
      e.preventDefault();
      const author = document.getElementById('msg-name').value;
      const bias = document.getElementById('msg-bias').value;
      const message = document.getElementById('msg-text').value;
      
      try {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('user_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE}/api/wall`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ author, bias, message })
        });
        
        if (res.ok) {
          document.getElementById('msg-text').value = '';
          if (typeof showToast === 'function') showToast('Message posted! 💗');
          fetchMessages();
        }
      } catch (err) {
        console.error("Failed to post message:", err);
        if (typeof showToast === 'function') showToast('Failed to post message.');
      }
    };
  }
  
  fetchMessages();
};

window.initLeaderboard = function() {
  // Local Records
  const trivia = localStorage.getItem('triviaHighScore') || 0;
  const emoji = localStorage.getItem('emojiBestStreak') || 0;
  const puzzle = localStorage.getItem('puzzleBestMoves');
  const lyrics = localStorage.getItem('lyricsHighScore') || 0;
  const silhouette = localStorage.getItem('silhouetteHighScore') || 0;
  const daily = localStorage.getItem('dailyBestStreak') || 0;

  const scoreTrivia = document.getElementById('score-trivia');
  if (scoreTrivia) {
    scoreTrivia.innerHTML = `${trivia} <span style="font-size: 1rem; color: #fff;">/ 10</span>`;
    document.getElementById('score-emoji').innerHTML = `${emoji} <span style="font-size: 1rem; color: #fff;">streak</span>`;
    document.getElementById('score-lyrics').innerHTML = `${lyrics} <span style="font-size: 1rem; color: #fff;">/ 10</span>`;
    document.getElementById('score-silhouette').innerHTML = `${silhouette} <span style="font-size: 1rem; color: #fff;">pts</span>`;
    document.getElementById('score-daily').innerHTML = `${daily} <span style="font-size: 1rem; color: #fff;">streak</span>`;
    
    if(puzzle) {
      document.getElementById('score-puzzle').innerHTML = `${puzzle} <span style="font-size: 1rem; color: #fff;">moves</span>`;
    } else {
      document.getElementById('score-puzzle').innerHTML = `-- <span style="font-size: 1rem; color: #fff;">moves</span>`;
    }
  }

  // Global Records Fetch
  async function fetchGlobalLeaderboard() {
    const glDiv = document.getElementById('global-leaderboard');
    if (!glDiv) return;
    try {
      const res = await fetch(`${API_BASE}/api/leaderboard`);
      const scores = await res.json();
      
      if (scores.length === 0) {
        glDiv.innerHTML = '<p>No scores yet! Play trivia to be the first!</p>';
        return;
      }

      glDiv.innerHTML = '';
      scores.forEach((entry, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '#' + rank;
        glDiv.innerHTML += `
          <div class="lb-card" style="padding: 1rem; margin-bottom: 0;">
            <div class="lb-title" style="font-size: 1.2rem;">${medal} ${entry.username}</div>
            <div class="lb-score" style="font-size: 1.5rem;">${entry.score}</div>
          </div>
        `;
      });
    } catch (e) {
      glDiv.innerHTML = '<p style="color: red;">Failed to load global leaderboard.</p>';
    }
  }

  fetchGlobalLeaderboard();
};

window.resetLeaderboards = function() {
  if(confirm("Are you sure you want to erase all your high scores?")) {
    localStorage.removeItem('triviaHighScore');
    localStorage.removeItem('emojiBestStreak');
    localStorage.removeItem('puzzleBestMoves');
    localStorage.removeItem('lyricsHighScore');
    localStorage.removeItem('silhouetteHighScore');
    localStorage.removeItem('dailyBestStreak');
    location.reload();
  }
};

window.initFeedback = function() {
  const form = document.getElementById('feedback-form');
  if (!form) return;
  
  // Clean up any existing listeners by cloning
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('fb-name').value;
    const type = document.getElementById('fb-type').value;
    const message = document.getElementById('fb-message').value;
    
    try {
      const res = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, message })
      });
      
      if (res.ok) {
        document.getElementById('fb-message').value = '';
        const btn = newForm.querySelector('button[type="submit"]');
        if (btn) {
          btn.textContent = 'Submitted! 💗';
          setTimeout(() => btn.textContent = 'Submit to Admin', 3000);
        }
        if (typeof showToast === 'function') {
          showToast('Feedback submitted! Thank you! 💗');
        } else {
          alert('Feedback submitted! Thank you! 💗');
        }
      } else {
        if (typeof showToast === 'function') {
          showToast('Error submitting feedback.');
        } else {
          alert('Error submitting feedback.');
        }
      }
    } catch (err) {
      console.error("Failed to post feedback:", err);
      if (typeof showToast === 'function') {
        showToast('Failed to post feedback.');
      } else {
        alert('Failed to post feedback.');
      }
    }
  };
};

// =============================================
// USER ACCOUNTS & PROFILE
// =============================================
let currentUser = null;

async function fetchCurrentUser() {
  const token = localStorage.getItem('user_token');
  if (!token) return;
  try {
    const res = await fetch(`${API_BASE}/api/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      currentUser = await res.json();
      applyBiasTheme(currentUser.bias);
      updateNavProfileLink(true);
      
      // If player is already ready but we just loaded the user, reload playlist
      if (ytPlayerReady && typeof ytLoadTrack === 'function' && currentUser.playlist && currentUser.playlist.length > 0) {
        ytPlaylist = currentUser.playlist.map(t => ({
          title: t.name,
          artist: 'Custom',
          videoId: t.url
        }));
        ytLoadTrack(0);
        renderTracklist();
      }
    } else {
      localStorage.removeItem('user_token');
      updateNavProfileLink(false);
    }
  } catch (e) {
    console.error('Auth error:', e);
  }
}

function updateNavProfileLink(isLoggedIn) {
  const btn = document.getElementById('nav-profile-btn');
  if (btn) {
    btn.textContent = isLoggedIn ? `👤 ${currentUser.username}` : '👤 Profile/Login';
  }
}

function applyBiasTheme(bias) {
  document.body.classList.remove('theme-jisoo', 'theme-jennie', 'theme-rose', 'theme-lisa');
  if (bias === 'Jisoo') document.body.classList.add('theme-jisoo');
  if (bias === 'Jennie') document.body.classList.add('theme-jennie');
  if (bias === 'Rosé') document.body.classList.add('theme-rose');
  if (bias === 'Lisa') document.body.classList.add('theme-lisa');
}

window.toggleAuthMode = function() {
  const login = document.getElementById('login-section');
  const reg = document.getElementById('register-section');
  if (login && reg) {
    if (login.style.display === 'none') {
      login.style.display = 'block';
      reg.style.display = 'none';
    } else {
      login.style.display = 'none';
      reg.style.display = 'block';
    }
  }
};

window.initLogin = function() {
  if (localStorage.getItem('user_token')) {
    navigateTo('profile.html');
    return;
  }
  
  const loginForm = document.getElementById('user-login-form');
  const regForm = document.getElementById('user-register-form');
  
  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;
      try {
        const res = await fetch(`${API_BASE}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('user_token', data.token);
          await fetchCurrentUser();
          navigateTo('profile.html');
          if(typeof showToast === 'function') showToast(`Welcome back, ${data.username}!`);
        } else {
          alert(data.error || 'Login failed');
        }
      } catch (err) {
        alert('Server error');
      }
    };
  }

  if (regForm) {
    regForm.onsubmit = async (e) => {
      e.preventDefault();
      const username = document.getElementById('reg-username').value;
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;
      const bias = document.getElementById('reg-bias').value;
      const dob = document.getElementById('reg-dob').value;
      try {
        const res = await fetch(`${API_BASE}/api/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password, bias, dob })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('user_token', data.token);
          await fetchCurrentUser();
          navigateTo('profile.html');
          if(typeof showToast === 'function') showToast(`Welcome to the Blink family, ${data.username}!`);
        } else {
          alert(data.error || 'Registration failed');
        }
      } catch (err) {
        alert('Server error');
      }
    };
  }
};

window.initProfile = async function() {
  await fetchCurrentUser();
  const token = localStorage.getItem('user_token');
  if (!token || !currentUser) {
    navigateTo('login.html');
    return;
  }
  
  document.getElementById('profile-dashboard').style.display = 'block';
  const unauthDiv = document.getElementById('profile-unauth');
  if (unauthDiv) unauthDiv.style.display = 'none';
  document.getElementById('profile-greeting').textContent = `Welcome, ${currentUser.username}!`;
  
  // Stan Level Logic
  const plays = currentUser.playCount || 0;
  const comments = currentUser.commentsCount || 0;
  let stanLevel = 'Trainee';
  if (plays > 200 || comments > 50) stanLevel = 'Ultimate Blink 👑';
  else if (plays > 50 || comments > 10) stanLevel = 'Blink 💖';
  else if (plays > 10 || comments > 2) stanLevel = 'Rookie 🖤';

  const badgeEl = document.getElementById('stan-level-badge');
  if (badgeEl) badgeEl.textContent = stanLevel;
  const playEl = document.getElementById('stat-plays');
  if (playEl) playEl.textContent = plays;
  const commEl = document.getElementById('stat-comments');
  if (commEl) commEl.textContent = comments;

  document.getElementById('update-bias').value = currentUser.bias || 'OT4';
  if (currentUser.dob) document.getElementById('update-dob').value = currentUser.dob;

  const profileForm = document.getElementById('profile-update-form');
  if (profileForm) {
    profileForm.onsubmit = async (e) => {
      e.preventDefault();
      const bias = document.getElementById('update-bias').value;
      const dob = document.getElementById('update-dob').value;
      const res = await fetch(`${API_BASE}/api/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bias, dob })
      });
      if (res.ok) {
        currentUser.bias = bias;
        currentUser.dob = dob;
        applyBiasTheme(bias);
        if(typeof showToast === 'function') showToast('Profile updated!');
      }
    };
  }

  renderPlaylistUI();

  // Render Photocards (Preview)
  const pcContainer = document.getElementById('profile-photocards');
  if (pcContainer) {
    pcContainer.innerHTML = '';
    const rawCards = currentUser.photocards || [];
    const cards = rawCards.filter(c => c && c.url);
    if (cards.length === 0) {
      pcContainer.innerHTML = '<p style="color:#aaa; grid-column: 1 / -1; text-align: center;">You haven\'t pulled any cards yet.</p>';
    } else {
      const previewCards = cards.slice(0, 4);
      previewCards.forEach(card => {
        const div = document.createElement('div');
        div.className = `gacha-card ${card.rarity ? card.rarity.toLowerCase() : 'common'}`;
        div.innerHTML = `
          <img src="${card.url}" alt="Photocard">
          <div class="rarity-label">${card.rarity || 'Common'}</div>
        `;
        pcContainer.appendChild(div);
      });
      
      // If they have more than 4, hint it
      if (cards.length > 4) {
        const moreDiv = document.createElement('div');
        moreDiv.style.display = 'flex';
        moreDiv.style.alignItems = 'center';
        moreDiv.style.justifyContent = 'center';
        moreDiv.style.background = 'rgba(255,255,255,0.05)';
        moreDiv.style.borderRadius = '12px';
        moreDiv.style.cursor = 'pointer';
        moreDiv.style.border = '2px dashed var(--bp-pink)';
        moreDiv.style.width = '130px';
        moreDiv.style.flexShrink = '0';
        moreDiv.innerHTML = `<span style="color:var(--bp-pink); font-weight:bold;">+${cards.length - 4} More</span>`;
        moreDiv.onclick = window.showFullCollection;
        pcContainer.appendChild(moreDiv);
      }
    }
  }
};

window.shareCollection = function() {
  if (!currentUser || !currentUser.username) return;
  const link = window.location.origin + '/collection.html?user=' + encodeURIComponent(currentUser.username);
  navigator.clipboard.writeText(link).then(() => {
    showToast('Link copied! Share your collection anywhere!', 3000);
  }).catch(() => {
    prompt('Copy this link to share your collection:', link);
  });
};

window.showFullCollection = function() {
  const modal = document.getElementById('collection-modal');
  const grid = document.getElementById('full-collection-grid');
  if (!modal || !grid) return;
  
  const rawCards = (currentUser && currentUser.photocards) ? currentUser.photocards : [];
  const cards = rawCards.filter(c => c && c.url); // filter out nulls/invalid
  
  grid.innerHTML = '';
  
  if (cards.length === 0) {
    grid.innerHTML = '<p style="color:#aaa; grid-column: 1 / -1; text-align: center;">No cards found.</p>';
  } else {
    // Sort cards by rarity safely
    const rarityOrder = { 'Legendary': 4, 'Epic': 3, 'Rare': 2, 'Common': 1 };
    const getRarityVal = r => rarityOrder[r] || 0;
    const sortedCards = [...cards].sort((a, b) => getRarityVal(b.rarity) - getRarityVal(a.rarity));
    
    sortedCards.forEach(card => {
      const div = document.createElement('div');
      div.className = `gacha-card ${card.rarity ? card.rarity.toLowerCase() : 'common'}`;
      div.innerHTML = `
        <img src="${card.url}" alt="Photocard">
        <div class="rarity-label">${card.rarity || 'Common'}</div>
      `;
      grid.appendChild(div);
    });
  }
  
  modal.style.display = 'block';
};

window.closeCollectionModal = function() {
  const modal = document.getElementById('collection-modal');
  if (modal) modal.style.display = 'none';
};

function getRarityColor(r) {
  if(r==='Legendary') return '#f5b942';
  if(r==='Epic') return '#b742f5';
  if(r==='Rare') return '#4287f5';
  return '#a0a0a0';
}

window.logoutUser = function() {
  localStorage.removeItem('user_token');
  currentUser = null;
  applyBiasTheme('OT4');
  updateNavProfileLink(false);
  
  // Revert to normal playlist
  ytPlaylist = [...defaultYtPlaylist];
  if (ytPlayerReady && typeof ytLoadTrack === 'function') {
    ytLoadTrack(0);
    renderTracklist();
  }
  
  navigateTo('login.html');
};

function renderPlaylistUI() {
  const container = document.getElementById('my-playlist-container');
  if (!container) return;
  container.innerHTML = '';
  if (!currentUser.playlist || currentUser.playlist.length === 0) {
    container.innerHTML = '<p style="color: #888;">Your playlist is empty.</p>';
    return;
  }
  currentUser.playlist.forEach((track, idx) => {
    container.innerHTML += `
      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.1); padding: 0.5rem 1rem; border-radius: 5px;">
        <span>${idx + 1}. ${track.name}</span>
        <button class="btn btn-danger" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;" onclick="removeTrack(${idx})">X</button>
      </div>
    `;
  });
}

window.addTrackToPlaylist = function() {
  const sel = document.getElementById('playlist-track-select');
  const track = {
    name: sel.options[sel.selectedIndex].getAttribute('data-name'),
    url: sel.value
  };
  if (!currentUser.playlist) currentUser.playlist = [];
  currentUser.playlist.push(track);
  renderPlaylistUI();
};

window.removeTrack = function(idx) {
  currentUser.playlist.splice(idx, 1);
  renderPlaylistUI();
};

window.savePlaylist = async function() {
  const token = localStorage.getItem('user_token');
  const res = await fetch(`${API_BASE}/api/me/playlist`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ playlist: currentUser.playlist })
  });
  if (res.ok) {
    if(typeof showToast === 'function') showToast('Playlist saved!');
    
    // Update ytPlaylist immediately
    if (currentUser && currentUser.playlist && currentUser.playlist.length > 0) {
      ytPlaylist = currentUser.playlist.map(t => ({
        title: t.name,
        artist: 'Custom',
        videoId: t.url
      }));
    }
    
    // If the music player is active on this page (e.g. index), reload it
    if (document.getElementById('yt-player') && ytPlayerReady && typeof ytLoadTrack === 'function') {
      ytLoadTrack(0);
      renderTracklist();
    }
  } else {
    alert('Failed to save playlist');
  }
};

// Run fetchCurrentUser on initial load
if (localStorage.getItem('user_token')) {
  fetchCurrentUser();
}

// =============================================
// =============================================
// BIRTHDAY COUNTDOWN
// =============================================
window.triggerConfetti = function() {
  if (typeof confetti === 'function') {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
  }
};

window.initBirthdayCountdown = function() {
  const nameEl = document.getElementById('birthday-name');
  const timerEl = document.getElementById('birthday-timer');
  if (!nameEl || !timerEl) return;

  const birthdays = [
    { name: 'Jisoo', month: 0, date: 3 },
    { name: 'Jennie', month: 0, date: 16 },
    { name: 'Rosé', month: 1, date: 11 },
    { name: 'Lisa', month: 2, date: 27 }
  ];

  function getNextBirthday() {
    const now = new Date();
    const year = now.getFullYear();
    let next = null;
    let minDiff = Infinity;

    birthdays.forEach(b => {
      let bDate = new Date(year, b.month, b.date);
      if (bDate < now) {
        bDate = new Date(year + 1, b.month, b.date);
      }
      const diff = bDate - now;
      if (diff < minDiff) {
        minDiff = diff;
        next = { name: b.name, date: bDate };
      }
    });
    return next;
  }

  const nextBday = getNextBirthday();
  if (!nextBday) return;
  nameEl.textContent = nextBday.name + "'s Birthday!";

  setInterval(() => {
    const now = new Date().getTime();
    const distance = nextBday.date.getTime() - now;
    if (distance < 0) {
      timerEl.textContent = 'IT IS HER BIRTHDAY! 🎉';
      return;
    }
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    timerEl.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }, 1000);
};

// =============================================
// FAN ART GALLERY
// =============================================
window.initFanArt = function() {
  const grid = document.getElementById('fanart-grid');
  if (!grid) return;

  async function fetchArt() {
    try {
      const res = await fetch(`${API_BASE}/api/gallery`);
      const art = await res.json();
      grid.innerHTML = '';
      if(art.length === 0) {
        grid.innerHTML = '<p class="text-center" style="grid-column: 1 / -1;">No art submitted yet. Be the first!</p>';
        return;
      }
      art.forEach(a => {
        const item = document.createElement('div');
        item.className = 'masonry-item';
        const likeCount = a.likes ? a.likes.length : 0;
        const isLiked = currentUser && a.likes && a.likes.includes(currentUser.id);
        item.innerHTML = `<img src="${a.url}" alt="${a.caption}" onerror="this.src='assets/blackpinkgroup.webp'"><div class="masonry-caption">${a.caption}</div><div class="masonry-author" style="display:flex; justify-content:space-between; align-items:center;"><span>By ${a.author}</span><span onclick="toggleLike('${a.id}')" style="cursor:pointer;">${isLiked ? '❤️' : '🤍'} ${likeCount}</span></div>`;
        grid.appendChild(item);
      });
    } catch (e) {
      grid.innerHTML = '<p class="text-center" style="grid-column: 1 / -1; color: red;">Failed to load art.</p>';
    }
  }

  const form = document.getElementById('fanart-form');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const url = document.getElementById('art-url').value;
      const caption = document.getElementById('art-caption').value;
      const author = currentUser ? currentUser.username : 'Anonymous Blink';
      try {
        const res = await fetch(`${API_BASE}/api/gallery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, caption, author })
        });
        if (res.ok) {
          document.getElementById('art-url').value = '';
          document.getElementById('art-caption').value = '';
          if (typeof showToast === 'function') showToast('Fan Art Submitted! 🖤💖');
          fetchArt();
        }
      } catch (err) {
        alert('Failed to submit art');
      }
    };
  }
  fetchArt();
};

window.toggleLike = async function(id) {
  if (!currentUser) return alert('Please login to like fan art!');
  try {
    const res = await fetch(`${API_BASE}/api/gallery/${id}/like`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${currentUser.token}` }
    });
    if (res.ok) window.initFanArt();
  } catch(e) {}
};

window.initPhotocards = function() {
  const btn = document.getElementById('pull-card-btn');
  if(!btn) return;
  
  window.updatePhotocardUI = function() {
    if (!currentUser || !document.getElementById('pull-card-btn')) return;
    if (currentUser.lastPullDate === new Date().toDateString()) {
      const b = document.getElementById('pull-card-btn');
      const cd = document.getElementById('pull-countdown');
      if (b) b.style.display = 'none';
      if (cd) {
        cd.style.display = 'block';
        if (window.pullInterval) clearInterval(window.pullInterval);
        window.pullInterval = setInterval(() => {
          const now = new Date();
          const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          const diff = tomorrow - now;
          if (diff <= 0) {
            clearInterval(window.pullInterval);
            b.style.display = 'inline-block';
            cd.style.display = 'none';
          } else {
            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / 1000 / 60) % 60);
            const s = Math.floor((diff / 1000) % 60);
            cd.innerHTML = `Next pull available in: <span style="color:var(--bp-pink);">${h}h ${m}m ${s}s</span>`;
          }
        }, 1000);
      }
    }
  };
  
  // Call immediately in case currentUser is already loaded
  if (typeof currentUser !== 'undefined' && currentUser) {
    window.updatePhotocardUI();
  }

  btn.addEventListener('click', async () => {
    if(!currentUser) return alert('Please login first!');
    try {
      const res = await fetch(`${API_BASE}/api/me/pull`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('user_token')}` }
      });
      const data = await res.json();
      if(res.ok) {
        btn.style.display = 'none';
        const packAnim = document.getElementById('pack-anim-container');
        const pack = document.getElementById('card-pack');
        const reveal = document.getElementById('card-reveal');
        
        packAnim.style.display = 'block';
        pack.classList.add('shake-anim');
        
        setTimeout(() => {
          pack.classList.remove('shake-anim');
          pack.classList.add('burst-anim');
          
          setTimeout(() => {
            packAnim.style.display = 'none';
            reveal.style.display = 'block';
            
            document.getElementById('pulled-card-img').src = data.card.url;
            document.getElementById('pulled-card-rarity').textContent = data.card.rarity;
            document.getElementById('pulled-card-rarity').className = 'card-rarity ' + data.card.rarity.toLowerCase();
            
            const dupMsg = document.getElementById('duplicate-msg');
            const pullMsg = document.getElementById('pull-status-msg');
            if (dupMsg && pullMsg) {
              if (data.isDuplicate) {
                dupMsg.style.display = 'block';
                pullMsg.style.display = 'none';
              } else {
                dupMsg.style.display = 'none';
                pullMsg.style.display = 'block';
              }
            }
            
            if (data.card.rarity.toLowerCase() === 'legendary') {
              reveal.classList.add('reveal-anim', 'legendary');
            } else {
              reveal.classList.remove('reveal-anim', 'legendary');
            }
            
            if (data.user) {
              currentUser = data.user;
              localStorage.setItem('bp_user', JSON.stringify(currentUser));
            } else {
              if(!currentUser.photocards) currentUser.photocards = [];
              currentUser.photocards.push(data.card);
              currentUser.lastPullDate = new Date().toDateString();
              localStorage.setItem('bp_user', JSON.stringify(currentUser));
            }
            
            if(window.triggerConfetti) window.triggerConfetti();
            window.updatePhotocardUI();
          }, 500);
        }, 1500);
      } else {
        const cd = document.getElementById('pull-countdown');
        if (cd) {
           cd.style.display = 'block';
           cd.style.color = '#ff6666';
           cd.innerHTML = data.error || 'Failed to pull card';
        } else {
           alert(data.error || 'Failed to pull card');
        }
      }
    } catch(e) {
      alert('Error pulling card: ' + e.message);
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('birthday-timer')) initBirthdayCountdown();
  if (document.getElementById('fanart-grid')) initFanArt();
  if (document.getElementById('pull-card-btn')) initPhotocards();
});
