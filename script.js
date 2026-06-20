// Redirect to https
var loc = window.location.href + '';
if (loc.indexOf('http://') == 0 && !loc.includes('localhost') && !loc.includes('127.0.0.1') && !loc.includes('file://')) {
  window.location.href = loc.replace('http://', 'https://');
}

// SPA Routing and Effects
document.addEventListener('DOMContentLoaded', () => {
  setupSPA();
  setupClickEffect();
});

function setupSPA() {
  document.body.addEventListener('click', e => {
    const link = e.target.closest('a');
    // Check if it's a valid local link that shouldn't open in a new tab
    if (link && link.href && link.host === window.location.host && !link.hasAttribute('target')) {
      e.preventDefault();
      const url = link.href;
      if (url !== window.location.href) {
        navigateTo(url);
      }
    }
  });
  
  window.addEventListener('popstate', () => {
    navigateTo(window.location.href, false);
  });
}

async function navigateTo(url, push = true) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Replace the page content dynamically without reloading the Spotify iframe!
    const currentHero = document.querySelector('.hero');
    const newHero = doc.querySelector('.hero');
    if (currentHero && newHero) {
      currentHero.outerHTML = newHero.outerHTML;
    }
    
    const currentMain = document.querySelector('main');
    const newMain = doc.querySelector('main');
    if (currentMain && newMain) {
      currentMain.outerHTML = newMain.outerHTML;
    }
    
    // Optional: Replace footer if needed, but they are all identical
    const currentFooter = document.querySelector('footer');
    const newFooter = doc.querySelector('footer');
    if (currentFooter && newFooter) {
      currentFooter.outerHTML = newFooter.outerHTML;
    }
    
    document.title = doc.title;
    
    // Update URL bar
    if (push) {
      window.history.pushState({}, '', url);
    }
    
    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Initialize game logic if we navigated to the games page
    if (url.includes('games.html') && typeof initTriviaGame === 'function') {
      setTimeout(initTriviaGame, 100);
    }
    
  } catch (error) {
    console.error('Error navigating via SPA, falling back to standard navigation:', error);
    window.location.href = url;
  }
}

// Interactive Lightstick Click Effect
function setupClickEffect() {
  document.addEventListener('click', (e) => {
    // Don't trigger if clicking interactive elements so it doesn't distract
    if (e.target.closest('a') || e.target.closest('button') || e.target.closest('iframe')) return;
    
    const spark = document.createElement('div');
    spark.className = 'sparkle-effect';
    spark.style.left = e.clientX + 'px';
    spark.style.top = e.clientY + 'px';
    document.body.appendChild(spark);
    
    setTimeout(() => {
      spark.remove();
    }, 600);
  });
}

// ---------------------
// TRIVIA GAME LOGIC
// ---------------------

// ---------------------
// TRIVIA GAME LOGIC
// ---------------------

const triviaData = [
  { q: "What year did BLACKPINK officially debut?", opts: ["2015", "2016", "2017", "2018"], ans: 1 },
  { q: "What is the name of BLACKPINK's fandom?", opts: ["Reveluvs", "Once", "Blinks", "Midzy"], ans: 2 },
  { q: "Which member launched her own solo agency called 'LLOUD'?", opts: ["Jisoo", "Jennie", "Rosé", "Lisa"], ans: 3 },
  { q: "Which member made her solo debut with the album '-R-'?", opts: ["Jisoo", "Jennie", "Rosé", "Lisa"], ans: 2 },
  { q: "What is the name of BLACKPINK's highly anticipated 2026 mini-album?", opts: ["Born Pink", "The Album", "Deadline", "Square Up"], ans: 2 },
  { q: "Which BLACKPINK music video was the first K-pop group video to hit 1 Billion views?", opts: ["Boombayah", "As If It's Your Last", "DDU-DU DDU-DU", "Kill This Love"], ans: 2 },
  { q: "Who is the oldest member of BLACKPINK?", opts: ["Jisoo", "Jennie", "Rosé", "Lisa"], ans: 0 },
  { q: "Which member is known as the 'Human Chanel'?", opts: ["Jisoo", "Jennie", "Rosé", "Lisa"], ans: 1 },
  { q: "What is Lisa's massive 2024 hit single?", opts: ["Money", "Rockstar", "Lalisa", "Shoong"], ans: 1 },
  { q: "Rosé's historic 2024 viral hit 'APT.' features which Western artist?", opts: ["Selena Gomez", "Lady Gaga", "Bruno Mars", "The Weeknd"], ans: 2 },
  { q: "Which member established the solo label 'BLISSOO'?", opts: ["Jisoo", "Jennie", "Rosé", "Lisa"], ans: 0 },
  { q: "Jennie's solo label is called:", opts: ["ODD ATELIER (OA)", "BLISSOO", "LLOUD", "THEBLACKLABEL"], ans: 0 },
  { q: "Which member starred in the zombie drama 'Influenza'?", opts: ["Jisoo", "Jennie", "Rosé", "Lisa"], ans: 0 },
  { q: "What was BLACKPINK's debut double single?", opts: ["Whistle & Boombayah", "Playing With Fire & Stay", "As If It's Your Last & Forever Young", "DDU-DU DDU-DU & Really"], ans: 0 },
  { q: "Which member was born in Thailand?", opts: ["Jisoo", "Jennie", "Rosé", "Lisa"], ans: 3 },
  { q: "Which member grew up in Australia?", opts: ["Jisoo", "Jennie", "Rosé", "Lisa"], ans: 2 },
  { q: "What is the name of BLACKPINK's 2026 title track featuring Chris Martin?", opts: ["Ready For Love", "GO", "Shut Down", "Pink Venom"], ans: 1 },
  { q: "Which of these is NOT a BLACKPINK song?", opts: ["See U Later", "Hope Not", "Love Dive", "Crazy Over You"], ans: 2 },
  { q: "Who collaborated with BLACKPINK on the song 'Ice Cream'?", opts: ["Dua Lipa", "Cardi B", "Selena Gomez", "Lady Gaga"], ans: 2 },
  { q: "What was the name of BLACKPINK's documentary released on Netflix?", opts: ["Light Up The Sky", "The Movie", "Blackpink Diaries", "Born Pink Memories"], ans: 0 }
];

let gameQuestions = [];
let currentQ = 0;
let score = 0;

window.initTriviaGame = function() {
  const startEl = document.getElementById('game-start');
  if(startEl) {
    startEl.style.display = 'block';
    document.getElementById('game-active').style.display = 'none';
    document.getElementById('game-result').style.display = 'none';
  }
};

window.startTrivia = function() {
  // Shuffle and pick 10 random questions
  gameQuestions = [...triviaData].sort(() => 0.5 - Math.random()).slice(0, 10);
  currentQ = 0;
  score = 0;
  
  document.getElementById('game-start').style.display = 'none';
  document.getElementById('game-result').style.display = 'none';
  document.getElementById('game-active').style.display = 'block';
  loadQuestion();
};

function loadQuestion() {
  if (currentQ >= gameQuestions.length) {
    showResults();
    return;
  }
  
  const qData = gameQuestions[currentQ];
  document.getElementById('question-text').textContent = qData.q;
  document.getElementById('score-text').textContent = score;
  document.getElementById('q-counter').textContent = currentQ + 1;
  
  const container = document.getElementById('options-container');
  container.innerHTML = '';
  
  qData.opts.forEach((opt, index) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.onclick = () => selectAnswer(index, btn);
    container.appendChild(btn);
  });
}

function selectAnswer(selectedIndex, btnElement) {
  const qData = gameQuestions[currentQ];
  const buttons = document.querySelectorAll('.option-btn');
  
  // Disable all buttons to prevent multiple clicks
  buttons.forEach(b => b.style.pointerEvents = 'none');
  
  if (selectedIndex === qData.ans) {
    btnElement.classList.add('correct');
    score++;
  } else {
    btnElement.classList.add('wrong');
    buttons[qData.ans].classList.add('correct');
  }
  
  document.getElementById('score-text').textContent = score;
  
  setTimeout(() => {
    currentQ++;
    loadQuestion();
  }, 1200);
}

function showResults() {
  document.getElementById('game-active').style.display = 'none';
  document.getElementById('game-result').style.display = 'block';
  document.getElementById('final-score').textContent = score;
  
  let rank = "Baby Blink";
  if (score === 10) rank = "Ultimate Blink 👑";
  else if (score >= 8) rank = "Dedicated Fan 💖";
  else if (score >= 5) rank = "Casual Listener 🎵";
  
  document.getElementById('fan-rank').textContent = rank;
  
  // Leaderboard Logic
  saveHighScore('triviaHighScore', score);
}

// ---------------------
// LEADERBOARD LOGIC
// ---------------------
function saveHighScore(gameKey, currentScore) {
  const highScore = localStorage.getItem(gameKey) || 0;
  const msgEl = document.getElementById('leaderboard-msg');
  
  if (currentScore > highScore) {
    localStorage.setItem(gameKey, currentScore);
    if(msgEl) {
      msgEl.textContent = "🏆 New High Score Saved!";
      msgEl.style.display = 'block';
    }
  } else {
    if(msgEl) {
      msgEl.style.display = 'none';
    }
  }
}
