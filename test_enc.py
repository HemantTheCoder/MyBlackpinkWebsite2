import sys

with open(r'c:\Users\heman\OneDrive\Desktop\MyBlackpinkWebsite\script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# find the string 'Ros' and print the next 10 characters
idx = content.find('Ros')
if idx != -1:
    print(repr(content[idx:idx+10]))

idx = content.find('JISOO')
if idx != -1:
    # go back 10 characters to see the emoji before it
    print(repr(content[idx-20:idx+5]))
