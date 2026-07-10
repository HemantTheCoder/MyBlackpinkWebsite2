study_path = r'c:\Users\heman\OneDrive\Desktop\MyBlackpinkWebsite\study.html'
with open(study_path, 'r', encoding='utf-8') as f:
    study_content = f.read()

study_content = study_content.replace(
    'const lofiIndex = window.defaultYtPlaylist ? window.defaultYtPlaylist.findIndex(t => t.title.includes("Lofi")) : 27;',
    'const lofiIndex = 20; // Exact index of the Lofi mix in script.js'
)

with open(study_path, 'w', encoding='utf-8') as f:
    f.write(study_content)

print("Updated study.html with exact index 20")
