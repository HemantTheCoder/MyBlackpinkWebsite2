import sys
script_path = r'c:\Users\heman\OneDrive\Desktop\MyBlackpinkWebsite\script.js'
with open(script_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find all tracks
import re
tracks = re.findall(r'\{\s*title:\s*"[^"]+",\s*artist:\s*"[^"]+",\s*videoId:\s*"[^"]+"\s*\}', content)
lofi_index = -1
for i, track in enumerate(tracks):
    if 'Lofi Mix' in track:
        lofi_index = i
        break

print(f"Lofi Index: {lofi_index}")
