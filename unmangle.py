import sys

def fix_mojibake(text):
    try:
        return text.encode('cp1252').decode('utf-8')
    except:
        pass
    try:
        return text.encode('latin1').decode('utf-8')
    except:
        pass
    return text

files = [
    r'c:\Users\heman\OneDrive\Desktop\MyBlackpinkWebsite\index.html',
    r'c:\Users\heman\OneDrive\Desktop\MyBlackpinkWebsite\script.js'
]

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    fixed = fix_mojibake(content)
    if fixed != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(fixed)
        print(f"Fixed {file_path}")
    else:
        print(f"No changes made to {file_path}")
