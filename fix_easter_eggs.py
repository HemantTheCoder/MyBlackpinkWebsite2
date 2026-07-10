import sys

new_easter_eggs = """
// =============================================
// KONAMI CODE EASTER EGGS
// =============================================

function spawnEmojiRain(emojis) {
  for (let i = 0; i < 30; i++) {
    const el = document.createElement('div');
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.position = 'fixed';
    el.style.left = Math.random() * 100 + 'vw';
    el.style.top = '-50px';
    el.style.fontSize = (Math.random() * 20 + 20) + 'px';
    el.style.zIndex = '999999';
    el.style.pointerEvents = 'none';
    el.style.transition = 'top ' + (Math.random() * 2 + 2) + 's cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    document.body.appendChild(el);
    
    // Trigger animation next frame
    requestAnimationFrame(() => {
      setTimeout(() => {
        el.style.top = '120vh';
      }, 10);
    });
    
    // Cleanup
    setTimeout(() => el.remove(), 5000);
  }
}

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
    document.body.style.boxShadow = `inset 0 0 50px ${color}`;
    setTimeout(() => document.body.style.boxShadow = 'none', 1000);
  }
});
"""

with open(r'c:\Users\heman\OneDrive\Desktop\MyBlackpinkWebsite\script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start of the KONAMI block
start_idx = content.find('// =============================================\n// KONAMI CODE EASTER EGGS')
if start_idx == -1:
    print("Could not find start block")
    sys.exit(1)

# Find the start of the MASCOT block (which comes immediately after)
end_idx = content.find('// =============================================\n// VIRTUAL MASCOT')
if end_idx == -1:
    print("Could not find end block")
    sys.exit(1)

# Also fix the level up confetti which was corrupted
content = content.replace("spawnEmojiRain(['dYZ%', 'o\"', 'dY'-', 'dYOY']);", "spawnEmojiRain(['🎉', '✨', '💖', '🌟']);")
content = content.replace("spawnEmojiRain(['dYZ%', '??', 'dY'-', 'dYOY']);", "spawnEmojiRain(['🎉', '✨', '💖', '🌟']);")
content = content.replace("spawnEmojiRain(['🎉', '✨', '💖', '🌟']);", "spawnEmojiRain(['🎉', '✨', '💖', '🌟']);") # just in case

# Combine
new_content = content[:start_idx] + new_easter_eggs + "\n" + content[end_idx:]

with open(r'c:\Users\heman\OneDrive\Desktop\MyBlackpinkWebsite\script.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Fixed Easter Eggs!")
