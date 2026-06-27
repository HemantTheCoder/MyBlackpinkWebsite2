const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'script.js');
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\$\{API_URL\}/g, '${API_BASE}/api');
fs.writeFileSync(file, content, 'utf8');
console.log('Replaced all API_URL with API_BASE/api');
