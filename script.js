// Redirect to https
var loc = window.location.href + '';
if (loc.indexOf('http://') == 0 && !loc.includes('localhost') && !loc.includes('127.0.0.1')) {
  window.location.href = loc.replace('http://', 'https://');
}

// Overlay functions
function on() {
  const overlay = document.getElementById("overlay");
  if (overlay) overlay.style.display = "block";
}

function off() {
  const overlay = document.getElementById("overlay");
  if (overlay) overlay.style.display = "none";
}

// Music Player Logic
const tracks = [
  { name: "Lovesick Girls", url: "https://cdn.glitch.com/ac49c1e8-2791-4469-b308-8ddd9a3408bf%2FLovesick%20Girls%20-%20BLACKPINK.mp3?v=1616217641144" },
  { name: "Whistle", url: "https://cdn.glitch.com/ac49c1e8-2791-4469-b308-8ddd9a3408bf%2FBLACKPINK%20-%20Whistle%20(Color%20Coded%20Lyrics%20EngRomHan%EA%B0%80%EC%82%AC).mp3?v=1626500595855" },
  { name: "Love To Hate Me", url: "https://cdn.glitch.com/ac49c1e8-2791-4469-b308-8ddd9a3408bf%2FBLACKPINK%20Love%20To%20Hate%20Me%20Lyrics%20(Color%20Coded%20Lyrics).mp3?v=1626502705785" },
  { name: "How You Like That", url: "https://cdn.glitch.com/ac49c1e8-2791-4469-b308-8ddd9a3408bf%2FBLACKPINK%20-%20How%20You%20Like%20That%20M%20V.mp3?v=1613726851952" }
];

let currentTrackIndex = 0;
let audio = new Audio(tracks[currentTrackIndex].url);

document.addEventListener('DOMContentLoaded', () => {
  const playPauseBtn = document.getElementById('play-pause-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const trackName = document.getElementById('track-name');

  if (playPauseBtn && trackName) {
    trackName.textContent = tracks[currentTrackIndex].name;

    playPauseBtn.addEventListener('click', () => {
      if (audio.paused) {
        audio.play();
        playPauseBtn.innerHTML = '&#10074;&#10074;'; // Pause icon
      } else {
        audio.pause();
        playPauseBtn.innerHTML = '&#9658;'; // Play icon
      }
    });

    nextBtn.addEventListener('click', playNext);
    prevBtn.addEventListener('click', playPrev);

    audio.addEventListener('ended', playNext);
  }
});

function playNext() {
  currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
  loadAndPlayTrack();
}

function playPrev() {
  currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
  loadAndPlayTrack();
}

function loadAndPlayTrack() {
  const wasPlaying = !audio.paused;
  audio.src = tracks[currentTrackIndex].url;
  document.getElementById('track-name').textContent = tracks[currentTrackIndex].name;
  
  if (wasPlaying) {
    audio.play();
  }
}
