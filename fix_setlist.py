import os

# Fix setlist.html
path = r'c:\Users\heman\OneDrive\Desktop\MyBlackpinkWebsite\setlist.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('''  <!-- Loading Screen -->
  <div id="loading-screen">
    <div class="loading-logo">BLACKPINK</div>
    <div class="loading-bar"><div class="loading-fill"></div></div>
  </div>''', '')
content = content.replace('<script>\n    const allSongs =', '<script>\n    // INJECTED\n    const allSongs =')

# Wait! Does script.js check for "INJECTED"?
# script.js: `if (s.textContent.includes('IntersectionObserver') || s.textContent.includes('INJECTED') || ...)`
# Yes! `INJECTED` works!

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("setlist.html fixed!")
