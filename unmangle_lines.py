import sys

def fix_mojibake(line):
    # Try to encode as cp1252 and decode as utf-8
    try:
        # If it contains real UTF-8 emojis that were added later, it will fail to encode to cp1252
        fixed = line.encode('cp1252').decode('utf-8')
        return fixed
    except:
        return line

with open(r'c:\Users\heman\OneDrive\Desktop\MyBlackpinkWebsite\script.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    new_lines.append(fix_mojibake(line))

with open(r'c:\Users\heman\OneDrive\Desktop\MyBlackpinkWebsite\script.js', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Fixed script.js line by line")
