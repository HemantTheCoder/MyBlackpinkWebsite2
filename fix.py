import sys

file_path = r'c:\Users\heman\OneDrive\Desktop\MyBlackpinkWebsite\script.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix mascot innerHTML
old_mascot = '''  mascot.innerHTML = 
    <div style="font-size: 2.5rem; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5)); cursor: pointer; transition: transform 0.2s; user-select: none;" id="mascot-img">🐻</div>
    <div id="mascot-bubble" style="position:absolute; top:-35px; right:-20px; background:white; color:black; padding:4px 8px; border-radius:10px; font-size:0.7rem; font-weight:bold; opacity:0; transition:opacity 0.3s; white-space:nowrap; pointer-events:none; box-shadow:0 2px 10px rgba(0,0,0,0.3);"></div>
  ;'''
new_mascot = '''  mascot.innerHTML = 
    <div style="font-size: 2.5rem; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5)); cursor: pointer; transition: transform 0.2s; user-select: none;" id="mascot-img">🐻</div>
    <div id="mascot-bubble" style="position:absolute; top:-35px; right:-20px; background:white; color:black; padding:4px 8px; border-radius:10px; font-size:0.7rem; font-weight:bold; opacity:0; transition:opacity 0.3s; white-space:nowrap; pointer-events:none; box-shadow:0 2px 10px rgba(0,0,0,0.3);"></div>
  ;'''
content = content.replace(old_mascot, new_mascot)

# Fix mascot style
old_style = '''    style.textContent = 
      @keyframes floatMascot {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      #virtual-mascot:hover #mascot-img { transform: scale(1.15) rotate(-5deg); }
      #virtual-mascot:active #mascot-img { transform: scale(0.9); }
    ;'''
new_style = '''    style.textContent = 
      @keyframes floatMascot {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      #virtual-mascot:hover #mascot-img { transform: scale(1.15) rotate(-5deg); }
      #virtual-mascot:active #mascot-img { transform: scale(0.9); }
    ;'''
content = content.replace(old_style, new_style)

# Fix showToast
old_toast = '''showToast(+ EXP: , 3000);'''
new_toast = '''showToast(+ EXP: , 3000);'''
content = content.replace(old_toast, new_toast)

# Fix level up modal
old_modal = '''  modal.innerHTML = 
    <h1 style="color:var(--bp-pink); font-size:4rem; margin-bottom:1rem; text-shadow:0 0 20px var(--bp-pink-glow); text-transform:uppercase;">LEVEL UP!</h1>
    <p style="color:#fff; font-size:1.5rem; margin-bottom:0.5rem;">You are now a</p>
    <h2 style="color:#fff; font-size:3rem; margin-bottom:2rem; letter-spacing:2px;"></h2>
    <p style="color:#aaa; max-width:500px; text-align:center; line-height:1.6; margin-bottom:3rem;">Your dedication to BLACKPINK is paying off. Keep streaming, collecting, and chatting!</p>
    <button class="btn btn-glow" style="font-size:1.2rem; padding:1rem 2.5rem;" onclick="this.parentElement.remove()">Continue \uD83D\uDDA4\uD83D\uDC96</button>
  ;'''
new_modal = '''  modal.innerHTML = 
    <h1 style="color:var(--bp-pink); font-size:4rem; margin-bottom:1rem; text-shadow:0 0 20px var(--bp-pink-glow); text-transform:uppercase;">LEVEL UP!</h1>
    <p style="color:#fff; font-size:1.5rem; margin-bottom:0.5rem;">You are now a</p>
    <h2 style="color:#fff; font-size:3rem; margin-bottom:2rem; letter-spacing:2px;"></h2>
    <p style="color:#aaa; max-width:500px; text-align:center; line-height:1.6; margin-bottom:3rem;">Your dedication to BLACKPINK is paying off. Keep streaming, collecting, and chatting!</p>
    <button class="btn btn-glow" style="font-size:1.2rem; padding:1rem 2.5rem;" onclick="this.parentElement.remove()">Continue \uD83D\uDDA4\uD83D\uDC96</button>
  ;'''
content = content.replace(old_modal, new_modal)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed script.js")
