import os

# 1. Fix study.html
study_path = r'c:\Users\heman\OneDrive\Desktop\MyBlackpinkWebsite\study.html'
with open(study_path, 'r', encoding='utf-8') as f:
    study_content = f.read()

study_content = study_content.replace('<body>', '<body>\n  <main class="container">')
study_content = study_content.replace('<!-- We load script.js for the base functionality, but ensure our custom script works smoothly -->', '</main>\n  <!-- We load script.js ... -->')
study_content = study_content.replace('<script>\n    // --- Pomodoro Logic ---', '<script>\n    // INJECTED\n    // --- Pomodoro Logic ---')
with open(study_path, 'w', encoding='utf-8') as f:
    f.write(study_content)

# 2. Fix quiz.html
quiz_path = r'c:\Users\heman\OneDrive\Desktop\MyBlackpinkWebsite\quiz.html'
with open(quiz_path, 'r', encoding='utf-8') as f:
    quiz_content = f.read()

quiz_content = quiz_content.replace('''  <!-- Loading Screen -->
  <div id="loading-screen">
    <div class="loading-logo">BLACKPINK</div>
    <div class="loading-bar"><div class="loading-fill"></div></div>
  </div>''', '')
quiz_content = quiz_content.replace('<script>\n    const questions =', '<script>\n    // INJECTED\n    const questions =')
with open(quiz_path, 'w', encoding='utf-8') as f:
    f.write(quiz_content)

# 3. Fix photobooth.html
pb_path = r'c:\Users\heman\OneDrive\Desktop\MyBlackpinkWebsite\photobooth.html'
with open(pb_path, 'r', encoding='utf-8') as f:
    pb_content = f.read()

pb_content = pb_content.replace('<script>\n    const imageUpload =', '<script>\n    // INJECTED\n    const imageUpload =')
with open(pb_path, 'w', encoding='utf-8') as f:
    f.write(pb_content)

print("All SPA script injection issues fixed!")
