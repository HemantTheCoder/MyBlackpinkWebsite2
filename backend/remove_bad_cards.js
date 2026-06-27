const fs = require('fs');
const path = require('path');

const cardsPath = path.join(__dirname, 'cards.json');
let cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

const badUrls = [
  'Munch_Girls_on_the_pier.jpg',
  'Young_Girls_Strike_a_Pose',
  'Kim_Ji-su_from_acrofan.jpg',
  'Girl_of_the_Welayta_people.jpg'
];

// Look for other bad Kim Ji-su or unrelated ones
// Let's filter out anything that has these substrings
const originalLength = cards.length;
cards = cards.filter(card => {
  return !badUrls.some(bad => card.url.includes(bad));
});

// There is one more image, a guy in a black hoodie. Let's find his URL.
// It might be named "Ji_Soo" (actor Ji Soo).
cards = cards.filter(card => {
  if (card.url.includes('Ji_Soo') || card.url.includes('Actor_Ji_Soo')) {
    // We only want Kim_Ji-soo of Blackpink, so we'll allow "Kim_Ji-soo" or "Blackpink"
    if (!card.url.toLowerCase().includes('kim_ji-soo') && !card.url.toLowerCase().includes('blackpink')) {
      console.log('Removing possible bad Ji Soo:', card.url);
      return false;
    }
  }
  
  // Actually let's just log anything that has Ji-su or Ji-soo but not Blackpink
  if (card.url.toLowerCase().includes('ji-su') || card.url.toLowerCase().includes('ji-soo')) {
      if (!card.url.toLowerCase().includes('blackpink') && !card.url.toLowerCase().includes('dior') && !card.url.toLowerCase().includes('sydney') && !card.url.toLowerCase().includes('marie_claire') && !card.url.toLowerCase().includes('170517')) {
          console.log('Suspicious Jisoo URL:', card.url);
      }
  }

  // The 4th image is actually a Korean man with a black hoodie. Let's see if we can find him.
  // Wait, I saw an image with red lips on a white grid background in the screenshots?
  // Ah, the 4th screenshot has red lips on a split face. Wait, let me re-examine the screenshots.
  return true;
});

console.log(`Removed ${originalLength - cards.length} bad cards.`);
fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2), 'utf8');
