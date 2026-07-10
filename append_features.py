import sys

# We append the exact clean code for Mascot, Cursor Trail, EXP, and Konami Code.
# SOTD, Search, Profile achievements were also added. I will just paste them directly cleanly.

appended_code = '''
// =============================================
// KONAMI CODE EASTER EGGS
// =============================================
let secretBuffer = '';
document.addEventListener('keydown', (e) => {
  secretBuffer += e.key.toLowerCase();
  if (secretBuffer.length > 20) secretBuffer = secretBuffer.slice(-20);
  
  let emojis = [];
  let message = '';
  let color = '';
  let match = false;
  
  if (secretBuffer.endsWith('jisoo')) {
    emojis = ['🌸', '🐢', '🐰'];
    message = "I'm Jisoo, I'm okay! 🐢🐰";
    color = 'var(--bp-pink)';
    match = true;
  } else if (secretBuffer.endsWith('jennie')) {
    emojis = ['🥟', '🐻', '🕶️'];
    message = "Shining solo! 🥟🕶️";
    color = '#4a90e2';
    match = true;
  } else if (secretBuffer.endsWith('rose') || secretBuffer.endsWith('rosé')) {
    emojis = ['🐿️', '🌹', '🎸'];
    message = "Records are meant to be broken! 🐿️🎸";
    color = '#ffb6c1';
    match = true;
  } else if (secretBuffer.endsWith('lisa')) {
    emojis = ['🐥', '🐱', '💸'];
    message = "Drop some money! 🐥💸";
    color = '#f1c40f';
    match = true;
  }
  
  if (match) {
    secretBuffer = '';
    showToast(message, 3000);
    spawnEmojiRain(emojis);
    document.body.style.boxShadow = inset 0 0 50px ;
    setTimeout(() => document.body.style.boxShadow = 'none', 1000);
  }
});

// =============================================
// VIRTUAL MASCOT (DALGOM / KRUNK)
// =============================================
function initMascot() {
  if (document.getElementById('virtual-mascot')) return;
  const mascot = document.createElement('div');
  mascot.id = 'virtual-mascot';
  mascot.innerHTML = 
    <div style="font-size: 2.5rem; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5)); cursor: pointer; transition: transform 0.2s; user-select: none;" id="mascot-img">🐻</div>
    <div id="mascot-bubble" style="position:absolute; top:-35px; right:-20px; background:white; color:black; padding:4px 8px; border-radius:10px; font-size:0.7rem; font-weight:bold; opacity:0; transition:opacity 0.3s; white-space:nowrap; pointer-events:none; box-shadow:0 2px 10px rgba(0,0,0,0.3);"></div>
  ;
  mascot.style.position = 'fixed';
  mascot.style.bottom = '20px';
  mascot.style.right = '20px';
  mascot.style.zIndex = '9999';
  mascot.style.animation = 'floatMascot 4s ease-in-out infinite';
  
  document.body.appendChild(mascot);

  // Add keyframes if missing
  if (!document.getElementById('mascot-style')) {
    const style = document.createElement('style');
    style.id = 'mascot-style';
    style.textContent = 
      @keyframes floatMascot {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      #virtual-mascot:hover #mascot-img { transform: scale(1.15) rotate(-5deg); }
      #virtual-mascot:active #mascot-img { transform: scale(0.9); }
    ;
    document.head.appendChild(style);
  }

  const messages = ["Blink forever! 💖", "Did you stream today? 🎵", "I love Jisoo! 🐢", "Mandu time! 🥟", "Pet me! ✨"];
  let clickCount = 0;
  
  mascot.addEventListener('click', () => {
    clickCount++;
    const bubble = document.getElementById('mascot-bubble');
    if (clickCount > 5) {
      bubble.textContent = "I'm full! 💤";
      document.getElementById('mascot-img').textContent = "💤";
      setTimeout(() => { document.getElementById('mascot-img').textContent = "🐻"; clickCount = 0; }, 5000);
    } else {
      bubble.textContent = messages[Math.floor(Math.random() * messages.length)];
    }
    bubble.style.opacity = '1';
    
    // Spawn tiny heart
    const heart = document.createElement('div');
    heart.textContent = '💖';
    heart.style.position = 'absolute';
    heart.style.left = '10px';
    heart.style.top = '10px';
    heart.style.pointerEvents = 'none';
    heart.style.transition = 'all 1s ease-out';
    mascot.appendChild(heart);
    
    setTimeout(() => {
      heart.style.transform = 'translateY(-50px) scale(1.5)';
      heart.style.opacity = '0';
    }, 10);
    
    setTimeout(() => heart.remove(), 1000);
    
    setTimeout(() => { if(bubble) bubble.style.opacity = '0'; }, 2500);
  });
}

// =============================================
// BLACK & PINK CURSOR TRAIL
// =============================================
function initCursorTrail() {
  if (localStorage.getItem('disableCursorTrail') === 'true') return;
  
  // Only on desktop
  if (window.innerWidth < 768) return;

  const hearts = ['🖤', '💖'];
  let heartIndex = 0;
  let lastSpawn = 0;
  
  document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastSpawn < 100) return; // throttle spawning
    lastSpawn = now;
    
    const heart = document.createElement('div');
    heart.textContent = hearts[heartIndex];
    heartIndex = (heartIndex + 1) % 2;
    
    heart.style.position = 'fixed';
    heart.style.left = (e.clientX - 10) + 'px';
    heart.style.top = (e.clientY - 10) + 'px';
    heart.style.fontSize = '14px';
    heart.style.pointerEvents = 'none';
    heart.style.zIndex = '9998';
    heart.style.transition = 'all 1s cubic-bezier(0.25, 1, 0.5, 1)';
    heart.style.opacity = '0.8';
    
    document.body.appendChild(heart);
    
    // Animate
    setTimeout(() => {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 20 + 20;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 30; // float up a bit
      
      heart.style.transform = 	ranslate(px, px) scale(0.5);
      heart.style.opacity = '0';
    }, 10);
    
    setTimeout(() => heart.remove(), 1000);
  });
}

// =============================================
// EXP & LEVELING SYSTEM
// =============================================
window.addEXP = function(amount, reason) {
  let currentExp = parseInt(localStorage.getItem('blink_exp') || '0');
  let currentLevel = getBlinkLevel(currentExp);
  
  currentExp += amount;
  localStorage.setItem('blink_exp', currentExp);
  
  const newLevel = getBlinkLevel(currentExp);
  
  if (newLevel.level > currentLevel.level) {
    triggerLevelUp(newLevel);
  } else {
    showToast(+ EXP: , 3000);
  }
}

function getBlinkLevel(exp) {
  if (exp >= 1000) return { level: 4, name: 'Ultimate Blink 👑', next: null };
  if (exp >= 500)  return { level: 3, name: 'Blink 💖', next: 1000 };
  if (exp >= 100)  return { level: 2, name: 'Rookie 🖤', next: 500 };
  return { level: 1, name: 'Trainee 🎤', next: 100 };
}

function triggerLevelUp(levelInfo) {
  // Full screen celebration
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.background = 'rgba(0,0,0,0.9)';
  modal.style.zIndex = '999999';
  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.animation = 'toastSlide 0.5s ease-out';
  
  modal.innerHTML = 
    <h1 style="color:var(--bp-pink); font-size:4rem; margin-bottom:1rem; text-shadow:0 0 20px var(--bp-pink-glow); text-transform:uppercase;">LEVEL UP!</h1>
    <p style="color:#fff; font-size:1.5rem; margin-bottom:0.5rem;">You are now a</p>
    <h2 style="color:#fff; font-size:3rem; margin-bottom:2rem; letter-spacing:2px;"></h2>
    <p style="color:#aaa; max-width:500px; text-align:center; line-height:1.6; margin-bottom:3rem;">Your dedication to BLACKPINK is paying off. Keep streaming, collecting, and chatting!</p>
    <button class="btn btn-glow" style="font-size:1.2rem; padding:1rem 2.5rem;" onclick="this.parentElement.remove()">Continue 🖤💖</button>
  ;
  document.body.appendChild(modal);
  
  // Confetti
  spawnEmojiRain(['🎉', '✨', '💖', '🌟']);
}

// Hook EXP into music player
const originalYtLoadTrack = window.ytLoadTrack;
window.ytLoadTrack = function(index) {
  if (typeof originalYtLoadTrack === 'function') originalYtLoadTrack(index);
  setTimeout(() => {
    if (Math.random() > 0.5) { // Random chance to prevent spamming
      window.addEXP(10, 'Streaming BLACKPINK 🎵');
    }
  }, 1000); // 1 second after track starts
};

// =============================================
// SONG OF THE DAY (SOTD)
// =============================================
function initSongOfDay() {
  const titleEl = document.getElementById('sotd-title');
  const imgEl = document.getElementById('sotd-img');
  const playBtn = document.getElementById('sotd-play-btn');
  if(!titleEl || !imgEl || !playBtn) return;
  
  const tracks = [
    { title: "Whistle", img: "https://upload.wikimedia.org/wikipedia/en/2/29/Square_One_Blackpink.png", index: 0 },
    { title: "Boombayah", img: "https://upload.wikimedia.org/wikipedia/en/2/29/Square_One_Blackpink.png", index: 1 },
    { title: "Playing With Fire", img: "https://upload.wikimedia.org/wikipedia/en/e/e6/Blackpink_-_Square_Two.jpg", index: 2 },
    { title: "As If It's Your Last", img: "https://upload.wikimedia.org/wikipedia/en/7/7b/Blackpink_-_As_If_It%27s_Your_Last.png", index: 4 },
    { title: "DDU-DU DDU-DU", img: "https://upload.wikimedia.org/wikipedia/en/a/a7/Blackpink_-_Square_Up.jpg", index: 5 },
    { title: "Kill This Love", img: "https://upload.wikimedia.org/wikipedia/en/d/dc/Blackpink_-_Kill_This_Love.png", index: 6 },
    { title: "How You Like That", img: "https://upload.wikimedia.org/wikipedia/en/d/dd/Blackpink_-_How_You_Like_That.png", index: 7 },
    { title: "Lovesick Girls", img: "https://upload.wikimedia.org/wikipedia/en/4/41/Blackpink_-_The_Album.png", index: 8 },
    { title: "Pink Venom", img: "https://upload.wikimedia.org/wikipedia/en/c/c5/Blackpink_-_Pink_Venom.png", index: 9 },
    { title: "Shut Down", img: "https://upload.wikimedia.org/wikipedia/en/c/c5/Blackpink_-_Pink_Venom.png", index: 10 }
  ];
  
  // Seed random by day
  const today = new Date().toDateString();
  let hash = 0;
  for(let i=0; i<today.length; i++) hash += today.charCodeAt(i);
  const track = tracks[hash % tracks.length];
  
  titleEl.textContent = track.title;
  imgEl.src = track.img;
  playBtn.onclick = () => window.ytLoadTrack(track.index);
}
'''

with open(r'c:\Users\heman\OneDrive\Desktop\MyBlackpinkWebsite\script.js', 'r', encoding='utf-8') as f:
    content = f.read()

content += "\n\n" + appended_code

with open(r'c:\Users\heman\OneDrive\Desktop\MyBlackpinkWebsite\script.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Appended features to script.js")
