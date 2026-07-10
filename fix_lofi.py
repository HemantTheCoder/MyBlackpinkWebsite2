import sys
import re

script_path = r'c:\Users\heman\OneDrive\Desktop\MyBlackpinkWebsite\script.js'
with open(script_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add Lofi track to playlist
if 'BLACKPINK Lofi Mix' not in content:
    content = content.replace(
        '{ title: "APT.", artist: "Rosé & Bruno Mars", videoId: "ekr2nIex040" },',
        '{ title: "APT.", artist: "Rosé & Bruno Mars", videoId: "ekr2nIex040" },\n    { title: "BLACKPINK Lofi Mix", artist: "Chill Vibes", videoId: "3Kz3q8F_qM4" },'
    )
    with open(script_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added Lofi Mix to script.js")
else:
    print("Lofi Mix already in script.js")

# Modify study.html
study_path = r'c:\Users\heman\OneDrive\Desktop\MyBlackpinkWebsite\study.html'
with open(study_path, 'r', encoding='utf-8') as f:
    study_content = f.read()

old_iframe = '''      <div class="video-container">
        <!-- YouTube iframe (BLACKPINK lofi mix) -->
        <iframe width="100%" height="400" src="https://www.youtube.com/embed/3Kz3q8F_qM4" title="BLACKPINK Lofi Mix" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
      </div>'''

new_button = '''      <div class="video-container" style="padding: 2rem; border: none; background: rgba(0,0,0,0.3); border-radius: 15px; margin-top: 1.5rem;">
        <button class="btn btn-glow pulse" onclick="playLofiMix()" style="font-size: 1.2rem; padding: 1rem 2rem;">🎵 Play Lofi Playlist in Global Player</button>
      </div>'''

study_content = study_content.replace(old_iframe, new_button)

# Add the function to the script tag in study.html
if 'function playLofiMix()' not in study_content:
    study_content = study_content.replace(
        '// --- Pomodoro Logic ---',
        '// --- Pomodoro Logic ---\n    function playLofiMix() {\n      if (window.ytLoadTrack) {\n        // The Lofi track is the last one in the playlist (index 27 if there are 28 tracks)\n        // Actually, we can just find it by searching the playlist\n        const lofiIndex = window.defaultYtPlaylist ? window.defaultYtPlaylist.findIndex(t => t.title.includes("Lofi")) : 27;\n        if(lofiIndex !== -1) window.ytLoadTrack(lofiIndex);\n        \n        const player = document.getElementById("music-player");\n        if (player) {\n          player.classList.remove("collapsed");\n        }\n      }\n    }\n'
    )

with open(study_path, 'w', encoding='utf-8') as f:
    f.write(study_content)

print("Updated study.html")
