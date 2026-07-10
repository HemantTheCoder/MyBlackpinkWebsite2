import sys

with open(r'c:\Users\heman\OneDrive\Desktop\MyBlackpinkWebsite\script.js', 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('jisoo:  { name')
if idx != -1:
    print(repr(content[idx:idx+80]))
