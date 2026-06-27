const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, '..', 'script.js');
let scriptContent = fs.readFileSync(scriptPath, 'utf8');

// Insert API_BASE at the top
if (!scriptContent.includes('const API_BASE =')) {
  const apiBaseStr = `const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'http://localhost:3000' : 'https://myblackpinkwebsite2.onrender.com';\n`;
  scriptContent = apiBaseStr + scriptContent;
}

// Replace all occurrences
scriptContent = scriptContent.replace(/'https:\/\/myblackpinkwebsite2\.onrender\.com\/api\//g, '`${API_BASE}/api/');
// The replace above will change 'https://...' to `${API_BASE}/...` but it might be inside a single quote.
// Wait, if it was 'https://...', replacing it with `${API_BASE}/api/` makes it `${API_BASE}/api/me', which is a string literal starting with ` and ending with '. That's a syntax error.
// We need to replace the single quotes with backticks.

scriptContent = fs.readFileSync(scriptPath, 'utf8');
if (!scriptContent.includes('const API_BASE =')) {
  const apiBaseStr = `const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'http://localhost:3000' : 'https://myblackpinkwebsite2.onrender.com';\n`;
  scriptContent = apiBaseStr + scriptContent;
}

// Regex to replace 'https://myblackpinkwebsite2.onrender.com/api/something' with `${API_BASE}/api/something`
scriptContent = scriptContent.replace(/'https:\/\/myblackpinkwebsite2\.onrender\.com([^']+)'/g, '`${API_BASE}$1`');

fs.writeFileSync(scriptPath, scriptContent, 'utf8');
console.log("Replaced URLs in script.js");
