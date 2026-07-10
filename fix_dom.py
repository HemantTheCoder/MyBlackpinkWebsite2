import sys

# Fix quiz.html
quiz_path = r'c:\Users\heman\OneDrive\Desktop\MyBlackpinkWebsite\quiz.html'
with open(quiz_path, 'r', encoding='utf-8') as f:
    quiz_content = f.read()

quiz_content = quiz_content.replace('''    document.addEventListener('DOMContentLoaded', () => {
      loadQuestion();
    });''', '    // Call immediately since SPA injection misses DOMContentLoaded\n    loadQuestion();')

with open(quiz_path, 'w', encoding='utf-8') as f:
    f.write(quiz_content)

# Fix setlist.html
setlist_path = r'c:\Users\heman\OneDrive\Desktop\MyBlackpinkWebsite\setlist.html'
with open(setlist_path, 'r', encoding='utf-8') as f:
    setlist_content = f.read()

setlist_content = setlist_content.replace('''    window.addEventListener('DOMContentLoaded', renderLists);''', '    // Call immediately since SPA injection misses DOMContentLoaded\n    renderLists();')

with open(setlist_path, 'w', encoding='utf-8') as f:
    f.write(setlist_content)

print("Fixed DOMContentLoaded issues!")
