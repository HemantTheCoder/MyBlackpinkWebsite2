const fs = require('fs');
const path = require('path');

const cardsPath = path.join(__dirname, 'cards.json');
const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

const keywords = ['blackpink', 'jennie', 'lisa', 'rose', 'rosé', 'jisoo', 'manoban', 'kim_ji-soo', 'kim_jennie', 'jennie_kim', 'roseanne'];

const suspicious = cards.filter(card => {
  const url = card.url.toLowerCase();
  return !keywords.some(kw => url.includes(kw));
});

console.log(`Found ${suspicious.length} suspicious cards out of ${cards.length}`);
suspicious.forEach(c => console.log(c.url));
