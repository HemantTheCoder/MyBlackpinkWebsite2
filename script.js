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

// ---------------------
// PUZZLE LOGIC
// ---------------------
let puzzleMoves = 0;
let puzzleTiles = [];
const puzzleSize = 3;
let puzzleEmptyIdx = 8;
let puzzleComplete = false;

window.initPuzzle = function() {
  puzzleMoves = 0;
  puzzleComplete = false;
  
  const moveEl = document.getElementById('move-count');
  const resEl = document.getElementById('puzzle-result');
  if(moveEl) moveEl.textContent = puzzleMoves;
  if(resEl) resEl.style.display = 'none';
  
  puzzleTiles = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  puzzleEmptyIdx = 8;
  
  for(let i=0; i<150; i++) {
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
  if(row > 0) valid.push(idx - puzzleSize);
  if(row < puzzleSize - 1) valid.push(idx + puzzleSize);
  if(col > 0) valid.push(idx - 1);
  if(col < puzzleSize - 1) valid.push(idx + 1);
  return valid;
}

function swapPuzzleTiles(i, j, animate=true) {
  let temp = puzzleTiles[i];
  puzzleTiles[i] = puzzleTiles[j];
  puzzleTiles[j] = temp;
  if (puzzleTiles[i] === 8) puzzleEmptyIdx = i;
  if (puzzleTiles[j] === 8) puzzleEmptyIdx = j;
  if (animate) {
    puzzleMoves++;
    const moveEl = document.getElementById('move-count');
    if(moveEl) moveEl.textContent = puzzleMoves;
    renderPuzzleBoard();
    checkPuzzleWin();
  }
}

function renderPuzzleBoard() {
  const board = document.getElementById('board');
  if(!board) return;
  board.innerHTML = '';
  
  puzzleTiles.forEach((val, idx) => {
    const div = document.createElement('div');
    div.className = 'tile';
    if (val === 8) {
      div.classList.add('empty');
    } else {
      const row = Math.floor(val / puzzleSize);
      const col = val % puzzleSize;
      div.style.backgroundPosition = `${col * 50}% ${row * 50}%`;
      div.onclick = () => handleTileClick(idx);
    }
    board.appendChild(div);
  });
}

function handleTileClick(idx) {
  if(puzzleComplete) return;
  const validMoves = getValidPuzzleMoves(puzzleEmptyIdx);
  if(validMoves.includes(idx)) {
    swapPuzzleTiles(puzzleEmptyIdx, idx);
  }
}

function checkPuzzleWin() {
  for(let i=0; i<8; i++) {
    if(puzzleTiles[i] !== i) return;
  }
  puzzleComplete = true;
  document.getElementById('board').children[8].classList.remove('empty');
  document.getElementById('board').children[8].style.backgroundPosition = `100% 100%`;
  document.getElementById('puzzle-result').style.display = 'block';
  document.getElementById('final-moves').textContent = puzzleMoves;
  
  const bestScore = localStorage.getItem('puzzleBestMoves');
  const msgEl = document.getElementById('puzzle-leaderboard-msg');
  if (!bestScore || puzzleMoves < parseInt(bestScore)) {
    localStorage.setItem('puzzleBestMoves', puzzleMoves);
    msgEl.textContent = "🏆 New Best Score! (Fewest Moves)";
  } else {
    msgEl.textContent = "Great job! Try to beat your record next time.";
  }
}

// ---------------------
// EMOJI GAME LOGIC
// ---------------------
const emojiData = [
  { emoji: "🍦👄👧🏻", ans: "Ice Cream", opts: ["Ice Cream", "Sour Candy", "As If It's Your Last", "Bet You Wanna"] },
  { emoji: "🔫💔🔪", ans: "Kill This Love", opts: ["Kill This Love", "DDU-DU DDU-DU", "Shut Down", "Typa Girl"] },
  { emoji: "💖🐍💥", ans: "Pink Venom", opts: ["Pink Venom", "How You Like That", "Tally", "Crazy Over You"] },
  { emoji: "🔥💃🏻🛑", ans: "Playing With Fire", opts: ["Playing With Fire", "Boombayah", "Whistle", "Stay"] },
  { emoji: "💵💰🤑", ans: "Money", opts: ["Lalisa", "Money", "Rockstar", "Hard To Love"] },
  { emoji: "🌹🎤💔", ans: "On The Ground", opts: ["Gone", "On The Ground", "APT.", "Hard To Love"] },
  { emoji: "😗😙😚", ans: "Whistle", opts: ["Whistle", "Boombayah", "Stay", "As If It's Your Last"] },
  { emoji: "🚘🚪⬇️", ans: "Shut Down", opts: ["Shut Down", "Typa Girl", "Yeah Yeah Yeah", "Ready For Love"] },
  { emoji: "🤷🏻‍♀️👍🏻👎🏻", ans: "How You Like That", opts: ["How You Like That", "Pretty Savage", "Kick It", "Love To Hate Me"] },
  { emoji: "🌸👧🏻💕", ans: "Lovesick Girls", opts: ["Lovesick Girls", "Hope Not", "You Never Know", "Don't Know What To Do"] },
  { emoji: "🏃🏻‍♀️💨🔥", ans: "GO", opts: ["GO", "Ready For Love", "Pink Venom", "Shut Down"] },
  { emoji: "🎸🌟🕺", ans: "Rockstar", opts: ["Rockstar", "Money", "Shoong", "Lalisa"] },
  { emoji: "👧🏻👗💄", ans: "Mantra", opts: ["Mantra", "You & Me", "Solo", "Flower"] },
  { emoji: "🌺💃🏻🔴", ans: "Flower", opts: ["Flower", "All Eyes On Me", "Solo", "On The Ground"] },
  { emoji: "🏢🍺🕺", ans: "APT.", opts: ["APT.", "On The Ground", "Gone", "Hard To Love"] }
];

let emojiRound = 0;
let emojiStreak = 0;
let emojiBestStreak = 0;
let emojiGamePool = [];

window.startEmojiGame = function() {
  emojiGamePool = [...emojiData].sort(() => 0.5 - Math.random()).slice(0, 10);
  emojiRound = 0;
  emojiStreak = 0;
  emojiBestStreak = 0;
  
  document.getElementById('game-start').style.display = 'none';
  document.getElementById('game-result').style.display = 'none';
  document.getElementById('game-active').style.display = 'block';
  loadEmojiRound();
};

function loadEmojiRound() {
  if (emojiRound >= emojiGamePool.length) {
    endEmojiGame();
    return;
  }
  
  const rData = emojiGamePool[emojiRound];
  document.getElementById('emoji-text').textContent = rData.emoji;
  document.getElementById('streak-text').textContent = emojiStreak;
  document.getElementById('r-counter').textContent = emojiRound + 1;
  
  const container = document.getElementById('options-container');
  container.innerHTML = '';
  
  const options = [...rData.opts].sort(() => 0.5 - Math.random());
  const ansIndex = options.indexOf(rData.ans);
  
  options.forEach((opt, index) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.onclick = () => selectEmojiAnswer(index, ansIndex, btn);
    container.appendChild(btn);
  });
}

function selectEmojiAnswer(selectedIndex, ansIndex, btnElement) {
  const buttons = document.querySelectorAll('#options-container .option-btn');
  buttons.forEach(b => b.style.pointerEvents = 'none');
  
  if (selectedIndex === ansIndex) {
    btnElement.classList.add('correct');
    emojiStreak++;
    if(emojiStreak > emojiBestStreak) emojiBestStreak = emojiStreak;
  } else {
    btnElement.classList.add('wrong');
    buttons[ansIndex].classList.add('correct');
    emojiStreak = 0;
  }
  
  document.getElementById('streak-text').textContent = emojiStreak;
  
  setTimeout(() => {
    emojiRound++;
    loadEmojiRound();
  }, 1200);
}

function endEmojiGame() {
  document.getElementById('game-active').style.display = 'none';
  document.getElementById('game-result').style.display = 'block';
  document.getElementById('final-streak').textContent = emojiBestStreak;
  
  const globalBest = localStorage.getItem('emojiBestStreak') || 0;
  const msgEl = document.getElementById('leaderboard-msg');
  if (emojiBestStreak > globalBest) {
    localStorage.setItem('emojiBestStreak', emojiBestStreak);
    msgEl.style.display = 'block';
  } else {
    msgEl.style.display = 'none';
  }
}
