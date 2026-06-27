const fs = require('fs');
const path = require('path');
const cardsPath = path.join(__dirname, 'cards.json');
const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

cards.forEach(c => {
  const parts = c.url.split('/');
  const filename = decodeURIComponent(parts[parts.length - 1]);
  console.log(filename);
});
