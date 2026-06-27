const fs = require('fs');
const path = require('path');

const cardsPath = path.join(__dirname, 'cards.json');
let cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

cards.forEach(card => {
  const url = card.url.toLowerCase();
  let score = 0;
  
  // High value keywords
  if (url.includes('coachella') || url.includes('award') || url.includes('vma') || url.includes('golden_disc')) score += 50;
  if (url.includes('dior') || url.includes('chanel') || url.includes('bulgari') || url.includes('celine') || url.includes('saint_laurent')) score += 40;
  if (url.includes('vogue') || url.includes('marie_claire') || url.includes('red_carpet') || url.includes('premiere')) score += 35;
  if (url.includes('concert') || url.includes('tour') || url.includes('born_pink') || url.includes('pink_venom')) score += 20;
  
  // Member count
  const members = ['jennie', 'lisa', 'jisoo', 'rose', 'rosé'];
  const memberCount = members.filter(m => url.includes(m)).length;
  if (memberCount >= 2) score += 20;
  
  // Tie-breaker hash (0-9)
  const hash = url.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 10;
  score += hash;
  
  card.score = score;
});

// Sort cards by score descending
cards.sort((a, b) => b.score - a.score);

// Distribution: Legendary (10%), Epic (20%), Rare (30%), Common (40%)
const total = cards.length;
const legendCount = Math.floor(total * 0.10);
const epicCount = Math.floor(total * 0.20);
const rareCount = Math.floor(total * 0.30);

let counts = { Legendary: 0, Epic: 0, Rare: 0, Common: 0 };

cards.forEach((card, index) => {
  if (index < legendCount) {
    card.rarity = 'Legendary';
  } else if (index < legendCount + epicCount) {
    card.rarity = 'Epic';
  } else if (index < legendCount + epicCount + rareCount) {
    card.rarity = 'Rare';
  } else {
    card.rarity = 'Common';
  }
  counts[card.rarity]++;
  delete card.score; // Clean up temp property
});

console.log('New Rarity distribution:', counts);
fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2), 'utf8');
