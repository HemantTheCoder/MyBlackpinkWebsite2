import sys, re

# 1. Get old script
import subprocess
old_script = subprocess.check_output(['git', 'show', '0783ebe:script.js']).decode('utf-8')
new_script = subprocess.check_output(['git', 'show', 'main:script.js']).decode('utf-8')

# 2. Extract appended blocks from new_script
sotd_idx = new_script.find('// =============================================\n// SONG OF THE DAY')
if sotd_idx == -1:
    print("Could not find SOTD block")
    sys.exit(1)

appended_blocks = new_script[sotd_idx:]

# 3. Extract pullCard function from new_script
# Use regex to find pullCard logic. It starts with:
# pullBtn.addEventListener('click', async () => {
# and ends with:
# });
# };
match = re.search(r'(pullBtn\.addEventListener\(\'click\', async \(\) => \{.*?\} \}\);\n\};)', new_script, re.DOTALL)
if not match:
    print("Could not find pullCard in new script")
    sys.exit(1)
new_pull_card = match.group(1)

# 4. Replace pullCard in old_script
match_old = re.search(r'(pullBtn\.addEventListener\(\'click\', async \(\) => \{.*?\} \}\);\n\};)', old_script, re.DOTALL)
if not match_old:
    print("Could not find pullCard in old script")
    sys.exit(1)
old_pull_card = match_old.group(1)
merged_script = old_script.replace(old_pull_card, new_pull_card)

# 5. Append blocks
merged_script += "\n\n" + appended_blocks

# 6. Update initAll
init_all_old = '''function initAll() {
  initMusicPlayer();
  initPhotocards();
  initFanArt();
  initVault();
  initProfile();
}'''
init_all_new = '''function initAll() {
  initMusicPlayer();
  initPhotocards();
  initFanArt();
  initVault();
  initProfile();
  
  initSongOfDay();
  initGlobalSearch();
  
  if (typeof initMascot === 'function') initMascot();
  if (typeof initCursorTrail === 'function') initCursorTrail();
}'''
merged_script = merged_script.replace(init_all_old, init_all_new)

# 7. Add Konami code (from 270b538)
# It was added to the document.addEventListener('keydown', ...)
# Let's just append it to the end of the file as well!
konami_code = '''
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
'''
merged_script += "\n\n" + konami_code

# Remove PWA Banner calls from initProfile if any
merged_script = merged_script.replace('setTimeout(showPWABanner, 3000);', '// PWA Banner disabled')

with open(r'c:\Users\heman\OneDrive\Desktop\MyBlackpinkWebsite\script.js', 'w', encoding='utf-8') as f:
    f.write(merged_script)

print("Successfully merged script.js")
