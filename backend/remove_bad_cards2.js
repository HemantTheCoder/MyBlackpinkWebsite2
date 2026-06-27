const fs = require('fs');
const path = require('path');

const cardsPath = path.join(__dirname, 'cards.json');
let cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

const badUrls = [
  'PUBG',
  '171001'
];

const originalLength = cards.length;
cards = cards.filter(card => {
  return !badUrls.some(bad => card.url.includes(bad));
});

console.log(`Removed ${originalLength - cards.length} bad cards.`);
fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2), 'utf8');
