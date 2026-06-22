const fs = require('fs');
const path = require('path');

const BASE = __dirname;

// ─── TIMELINE ────────────────────────────────────────────────────────────────
const timelineCSS = `<style>
.timeline-section { padding: 2rem 0 4rem; }
.timeline-wrapper {
  position: relative;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1rem;
}
.timeline-line {
  position: absolute;
  left: 50%;
  top: 0; bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, transparent, #ff2a85 10%, #ff2a85 90%, transparent);
  box-shadow: 0 0 16px rgba(255,42,133,0.5);
  transform: translateX(-50%);
}
.year-marker {
  text-align: center;
  position: relative;
  z-index: 2;
  margin: 2.5rem 0 1rem;
}
.year-marker-inner {
  display: inline-block;
  background: linear-gradient(135deg, #ff2a85, #c471ed);
  color: #fff;
  font-weight: 900;
  font-size: 1.1rem;
  letter-spacing: 0.1em;
  padding: 0.4rem 1.5rem;
  border-radius: 999px;
  box-shadow: 0 0 20px rgba(255,42,133,0.5);
}
.tl-event {
  display: flex;
  position: relative;
  margin-bottom: 2rem;
  z-index: 1;
}
.tl-event.left {
  justify-content: flex-end;
  padding-right: calc(50% + 2rem);
}
.tl-event.right {
  justify-content: flex-start;
  padding-left: calc(50% + 2rem);
}
.tl-connector {
  position: absolute;
  top: 1.4rem;
  width: 2rem;
  height: 2px;
  background: #ff2a85;
  box-shadow: 0 0 8px rgba(255,42,133,0.6);
}
.tl-event.left .tl-connector {
  right: calc(50% + 0px);
}
.tl-event.right .tl-connector {
  left: calc(50% + 0px);
}
.tl-connector::after {
  content: '';
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 12px; height: 12px;
  border-radius: 50%;
  background: #ff2a85;
  box-shadow: 0 0 12px rgba(255,42,133,0.8);
}
.tl-event.left .tl-connector::after { right: -6px; }
.tl-event.right .tl-connector::after { left: -6px; }
.tl-card {
  background: rgba(20,10,30,0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,42,133,0.2);
  border-radius: 16px;
  padding: 1.2rem 1.5rem;
  max-width: 380px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  opacity: 0;
  transform: translateY(20px);
}
.tl-card.visible {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.tl-card:hover {
  transform: translateY(-4px) !important;
  box-shadow: 0 0 30px rgba(255,42,133,0.4);
  border-color: #ff2a85;
}
.tl-year {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #ff2a85;
  margin-bottom: 0.4rem;
}
.tl-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 0.6rem;
  line-height: 1.3;
}
.tl-desc {
  font-size: 0.88rem;
  color: rgba(255,255,255,0.65);
  line-height: 1.7;
}
.timeline-end {
  text-align: center;
  position: relative;
  z-index: 2;
  margin-top: 3rem;
}
.timeline-end-inner {
  display: inline-block;
  background: rgba(255,42,133,0.1);
  border: 1px solid rgba(255,42,133,0.4);
  color: rgba(255,255,255,0.7);
  padding: 0.8rem 2rem;
  border-radius: 999px;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
}
@media (max-width: 700px) {
  .timeline-line { left: 1.5rem; }
  .tl-event.left, .tl-event.right {
    justify-content: flex-start;
    padding-left: 4rem;
    padding-right: 0;
  }
  .tl-event.left .tl-connector, .tl-event.right .tl-connector { left: 1.5rem; right: auto; }
  .tl-event.left .tl-connector::after, .tl-event.right .tl-connector::after { left: -6px; right: auto; }
  .tl-card { max-width: 100%; }
}
</style>`;

const timelineJS = `<script>
document.addEventListener('DOMContentLoaded', function() {
  var cards = document.querySelectorAll('.tl-card');
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  cards.forEach(function(card) { observer.observe(card); });
});
<\/script>`;

// ─── DISCOGRAPHY ─────────────────────────────────────────────────────────────
const discographyCSS = `<style>
.era-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  justify-content: center;
  margin: 1rem 0 2.5rem;
}
.era-tab {
  font-family: 'Outfit', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.5rem 1.2rem;
  border: 1.5px solid rgba(255,42,133,0.35);
  border-radius: 999px;
  background: rgba(255,42,133,0.07);
  color: rgba(255,255,255,0.7);
  cursor: pointer;
  transition: all 0.25s ease;
}
.era-tab:hover, .era-tab.active {
  border-color: #ff2a85;
  color: #fff;
  background: rgba(255,42,133,0.2);
  box-shadow: 0 0 16px rgba(255,42,133,0.4);
}
.disco-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}
.era-card {
  background: rgba(15,8,25,0.65);
  backdrop-filter: blur(12px);
  border: 1.5px solid rgba(255,42,133,0.2);
  border-radius: 18px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  opacity: 1;
}
.era-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 0 30px rgba(255,42,133,0.35);
  border-color: rgba(255,42,133,0.6);
}
.card-banner {
  height: 6px;
  background: linear-gradient(90deg, #ff2a85, #c471ed, #12c2e9);
}
.card-body { padding: 1.5rem; }
.era-badge {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #ff2a85;
  margin-right: 0.5rem;
}
.type-badge {
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(255,255,255,0.45);
  background: rgba(255,255,255,0.07);
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.12);
}
.card-title {
  font-size: 1.3rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  color: #fff;
  margin: 0.6rem 0 0.3rem;
}
.card-year {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.45);
  margin-bottom: 1rem;
  font-weight: 500;
}
.track-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.track-list li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.88rem;
  color: rgba(255,255,255,0.75);
  padding: 0.3rem 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.track-num {
  min-width: 1.6rem;
  color: #ff2a85;
  font-weight: 700;
  font-size: 0.78rem;
}
.spotify-btn {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.45rem 1rem;
  background: rgba(30,215,96,0.12);
  border: 1px solid rgba(30,215,96,0.35);
  color: #1ED760;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  text-decoration: none;
  letter-spacing: 0.05em;
  transition: all 0.2s ease;
}
.spotify-btn:hover {
  background: rgba(30,215,96,0.25);
  color: #1ED760;
  box-shadow: 0 0 12px rgba(30,215,96,0.3);
  transform: translateY(-2px);
}
.hero-sub {
  font-size: 1rem;
  color: rgba(255,255,255,0.65);
  letter-spacing: 0.08em;
  margin-top: 0.5rem;
}
@media (max-width: 600px) {
  .disco-grid { grid-template-columns: 1fr; }
  .era-tab { font-size: 0.72rem; padding: 0.4rem 0.9rem; }
}
</style>`;

const discographyJS = `<script>
document.addEventListener('DOMContentLoaded', function() {
  var tabs = document.querySelectorAll('.era-tab');
  var cards = document.querySelectorAll('.era-card');
  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      tabs.forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var filter = tab.dataset.filter;
      cards.forEach(function(card) {
        if (filter === 'ALL' || card.dataset.era === filter) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
});
<\/script>`;

// ─── WORLD TOUR ───────────────────────────────────────────────────────────────
const worldtourCSS = `<style>
#tour-map {
  width: 100%;
  height: 500px;
  border-radius: 18px;
  border: 1.5px solid rgba(255,42,133,0.35);
  box-shadow: 0 0 40px rgba(255,42,133,0.2);
  overflow: hidden;
  z-index: 1;
}
.map-title { text-align: center; margin-bottom: 1.5rem; }
.map-title h2 {
  font-size: clamp(1.5rem, 4vw, 2.2rem);
  font-weight: 900;
  background: linear-gradient(135deg, #fff, #ff2a85);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.map-title p { color: rgba(255,255,255,0.5); font-size: 0.9rem; margin-top: 0.4rem; }
.tour-toggle-bar {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.tour-btn {
  font-family: 'Outfit', sans-serif;
  font-size: 0.88rem;
  font-weight: 700;
  padding: 0.6rem 1.8rem;
  border-radius: 999px;
  border: 2px solid;
  cursor: pointer;
  transition: all 0.25s ease;
  letter-spacing: 0.05em;
}
.tour-btn-bp { border-color: #ff2a85; background: rgba(255,42,133,0.08); color: #ff8fab; }
.tour-btn-bp.active { background: #ff2a85; color: #fff; box-shadow: 0 0 20px rgba(255,42,133,0.5); }
.tour-btn-dl { border-color: #a855f7; background: rgba(168,85,247,0.08); color: #c084fc; }
.tour-btn-dl.active { background: #a855f7; color: #fff; box-shadow: 0 0 20px rgba(168,85,247,0.5); }
.map-legend {
  display: flex;
  gap: 2rem;
  justify-content: center;
  margin: 1rem 0;
  flex-wrap: wrap;
}
.legend-item { display: flex; align-items: center; gap: 0.6rem; font-size: 0.88rem; color: rgba(255,255,255,0.7); }
.legend-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
.legend-dot-bp { background: #ff2a85; box-shadow: 0 0 8px #ff2a85; }
.legend-dot-dl { background: #a855f7; box-shadow: 0 0 8px #a855f7; }
#map-section { margin-bottom: 2rem; }
.stats-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}
.stats-strip .stat-card {
  background: rgba(20,10,30,0.6);
  border: 1.5px solid rgba(255,42,133,0.2);
  border-radius: 14px;
  padding: 1.2rem;
  text-align: center;
}
.stats-strip .stat-card .stat-icon { font-size: 1.6rem; margin-bottom: 0.3rem; }
.stat-num-bp { font-size: 2rem; font-weight: 900; color: #ff2a85; line-height: 1; }
.stat-num-dl { font-size: 2rem; font-weight: 900; color: #a855f7; line-height: 1; }
.stats-strip .stat-label { font-size: 0.78rem; color: rgba(255,255,255,0.5); margin-top: 0.3rem; }
.city-list-section { margin-top: 2rem; }
.city-list-title {
  font-size: 1.1rem;
  font-weight: 800;
  margin: 1.5rem 0 1rem;
  letter-spacing: 0.05em;
}
.city-list-title-bp { color: #ff2a85; }
.city-list-title-dl { color: #a855f7; }
.city-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.city-chip {
  background: rgba(255,42,133,0.06);
  border: 1px solid rgba(255,42,133,0.18);
  border-radius: 10px;
  padding: 0.7rem 1rem;
  font-size: 0.83rem;
  line-height: 1.5;
}
.city-chip strong { color: #ff2a85; display: block; font-size: 0.88rem; }
.city-chip span { color: rgba(255,255,255,0.65); }
.city-chip em { color: rgba(255,255,255,0.35); font-style: normal; font-size: 0.76rem; }
</style>`;

const worldtourJS = `<script>
document.addEventListener('DOMContentLoaded', function() {
  if (typeof L === 'undefined') { console.warn('Leaflet not loaded'); return; }
  var bpStops = [
    { city: 'Seoul', coords: [37.5665, 126.9780], venue: 'KSPO Dome', date: 'Sep 2022' },
    { city: 'Los Angeles', coords: [34.0522, -118.2437], venue: 'Crypto.com Arena', date: 'Feb 2023' },
    { city: 'New York', coords: [40.7128, -74.0060], venue: 'Prudential Center', date: 'Feb 2023' },
    { city: 'Dallas', coords: [32.7767, -96.7970], venue: 'American Airlines Center', date: 'Feb 2023' },
    { city: 'Chicago', coords: [41.8781, -87.6298], venue: 'United Center', date: 'Mar 2023' },
    { city: 'London', coords: [51.5074, -0.1278], venue: 'The O2 Arena', date: 'Mar 2023' },
    { city: 'Paris', coords: [48.8566, 2.3522], venue: 'Accor Arena', date: 'Mar 2023' },
    { city: 'Barcelona', coords: [41.3851, 2.1734], venue: 'Palau Sant Jordi', date: 'Mar 2023' },
    { city: 'Amsterdam', coords: [52.3676, 4.9041], venue: 'Ziggo Dome', date: 'Apr 2023' },
    { city: 'Sydney', coords: [-33.8688, 151.2093], venue: 'Qudos Bank Arena', date: 'Jun 2023' },
    { city: 'Bangkok', coords: [13.7563, 100.5018], venue: 'Impact Arena', date: 'Jun 2023' },
    { city: 'Singapore', coords: [1.3521, 103.8198], venue: 'National Stadium', date: 'Jul 2023' },
    { city: 'Jakarta', coords: [-6.2088, 106.8456], venue: 'Gelora Bung Karno', date: 'Jul 2023' }
  ];
  var dlStops = [
    { city: 'Seoul', coords: [37.5665, 126.9780], venue: 'Olympic Stadium', date: 'Mar 2026' },
    { city: 'Tokyo', coords: [35.6762, 139.6503], venue: 'Tokyo Dome', date: 'Mar 2026' },
    { city: 'Los Angeles', coords: [34.0522, -118.2437], venue: 'SoFi Stadium', date: 'Apr 2026' },
    { city: 'New York', coords: [40.7128, -74.0060], venue: 'MetLife Stadium', date: 'Apr 2026' },
    { city: 'London', coords: [51.5074, -0.1278], venue: 'Wembley Stadium', date: 'May 2026' },
    { city: 'Paris', coords: [48.8566, 2.3522], venue: 'Stade de France', date: 'May 2026' },
    { city: 'Berlin', coords: [52.5200, 13.4050], venue: 'Olympiastadion', date: 'May 2026' },
    { city: 'Dubai', coords: [25.2048, 55.2708], venue: 'Coca-Cola Arena', date: 'Jun 2026' },
    { city: 'Mumbai', coords: [19.0760, 72.8777], venue: 'DY Patil Stadium', date: 'Jun 2026' },
    { city: 'Bangkok', coords: [13.7563, 100.5018], venue: 'National Stadium', date: 'Jun 2026' },
    { city: 'Manila', coords: [14.5995, 120.9842], venue: 'Philippine Arena', date: 'Jul 2026' }
  ];

  var map = L.map('tour-map', { center: [25, 10], zoom: 2, zoomControl: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(map);

  function makeIcon(color) {
    return L.divIcon({
      className: '',
      html: '<div style="width:14px;height:14px;border-radius:50%;background:'+color+';border:2px solid #fff;box-shadow:0 0 8px '+color+'"></div>',
      iconSize: [14,14], iconAnchor: [7,7]
    });
  }

  var bpLayer = L.layerGroup();
  var dlLayer = L.layerGroup();

  bpStops.forEach(function(s) {
    L.marker(s.coords, {icon: makeIcon('#ff2a85')})
      .bindPopup('<b style="color:#ff2a85">\\uD83C\\uDF38 '+s.city+'<\\/b><br><span style="font-size:0.85em">'+s.venue+'<\\/span><br><em style="color:#aaa;font-size:0.8em">'+s.date+'<\\/em>')
      .addTo(bpLayer);
  });
  dlStops.forEach(function(s) {
    L.marker(s.coords, {icon: makeIcon('#a855f7')})
      .bindPopup('<b style="color:#a855f7">\\u26A1 '+s.city+'<\\/b><br><span style="font-size:0.85em">'+s.venue+'<\\/span><br><em style="color:#aaa;font-size:0.8em">'+s.date+'<\\/em>')
      .addTo(dlLayer);
  });
  bpLayer.addTo(map);

  function renderGrid(stops, id, color) {
    var el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = stops.map(function(s) {
      return '<div class="city-chip"><strong>'+s.city+'<\\/strong><span>'+s.venue+'<\\/span><br><em>'+s.date+'<\\/em><\\/div>';
    }).join('');
  }
  renderGrid(bpStops, 'bp-city-grid', '#ff2a85');
  renderGrid(dlStops, 'dl-city-grid', '#a855f7');

  window.switchTour = function(tour) {
    var bp = document.getElementById('btn-bp');
    var dl = document.getElementById('btn-dl');
    if (bp) bp.classList.toggle('active', tour==='bp');
    if (dl) dl.classList.toggle('active', tour==='dl');
    if (tour==='bp') { map.removeLayer(dlLayer); bpLayer.addTo(map); }
    else { map.removeLayer(bpLayer); dlLayer.addTo(map); }
  };
});
<\/script>`;

// ─── GALLERY ──────────────────────────────────────────────────────────────────
const galleryCSS = `<style>
/* Force gallery cards visible immediately */
.photo-card {
  opacity: 1 !important;
  transform: none !important;
  break-inside: avoid;
  margin-bottom: 1rem;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  border: 1.5px solid rgba(255,42,133,0.18);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.photo-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 0 30px rgba(255,42,133,0.55);
  border-color: rgba(255,42,133,0.7);
}
.photo-card img {
  width: 100%;
  display: block;
  object-fit: cover;
}
.photo-card.hidden { display: none !important; }
/* Lightbox */
#lightbox {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(5,0,15,0.93);
  backdrop-filter: blur(20px);
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
}
#lightbox.open { display: flex; }
#lb-img {
  max-width: min(90vw, 900px);
  max-height: 75vh;
  border-radius: 12px;
  object-fit: contain;
  box-shadow: 0 0 60px rgba(255,42,133,0.3);
}
.lb-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}
.lb-btn {
  width: 2.8rem; height: 2.8rem;
  border-radius: 50%;
  border: 1.5px solid rgba(255,42,133,0.5);
  background: rgba(255,42,133,0.15);
  color: #fff;
  font-size: 1.3rem;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.lb-btn:hover { background: rgba(255,42,133,0.4); box-shadow: 0 0 16px rgba(255,42,133,0.6); }
.lb-caption { color: rgba(255,255,255,0.7); font-size: 0.9rem; text-align: center; }
.lb-counter { color: rgba(255,255,255,0.4); font-size: 0.82rem; }
</style>`;

const galleryJS = `<script>
document.addEventListener('DOMContentLoaded', function() {
  var cards = Array.from(document.querySelectorAll('.photo-card'));
  var filterBtns = document.querySelectorAll('.filter-btn');
  var countEl = document.getElementById('count-num');

  // Filter buttons
  filterBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      filterBtns.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var filter = btn.dataset.filter;
      var vis = 0;
      cards.forEach(function(card) {
        if (filter === 'all' || card.dataset.member === filter) {
          card.classList.remove('hidden');
          vis++;
        } else {
          card.classList.add('hidden');
        }
      });
      if (countEl) countEl.textContent = vis;
    });
  });

  // Build lightbox
  var lb = document.createElement('div');
  lb.id = 'lightbox';
  lb.innerHTML = '<img id="lb-img" src="" alt=""><div class="lb-controls"><button class="lb-btn" id="lb-prev">&#8592;<\\/button><span class="lb-counter" id="lb-count">1 / 11<\\/span><button class="lb-btn" id="lb-next">&#8594;<\\/button><button class="lb-btn" id="lb-close">&#10005;<\\/button><\\/div><div class="lb-caption" id="lb-caption"><\\/div>';
  document.body.appendChild(lb);

  var currentIdx = 0;
  function visCards() { return cards.filter(function(c) { return !c.classList.contains('hidden'); }); }
  function openLb(idx) {
    currentIdx = idx;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    showSlide();
  }
  function closeLb() { lb.classList.remove('open'); document.body.style.overflow = ''; }
  function showSlide() {
    var vc = visCards();
    var card = vc[currentIdx];
    var img = card && card.querySelector('img');
    document.getElementById('lb-img').src = img ? img.src : '';
    document.getElementById('lb-caption').textContent = card ? (card.dataset.label || '') : '';
    document.getElementById('lb-count').textContent = (currentIdx+1) + ' / ' + vc.length;
  }
  document.getElementById('lb-close').onclick = closeLb;
  document.getElementById('lb-prev').onclick = function() {
    var vc = visCards();
    currentIdx = (currentIdx - 1 + vc.length) % vc.length;
    showSlide();
  };
  document.getElementById('lb-next').onclick = function() {
    var vc = visCards();
    currentIdx = (currentIdx + 1) % vc.length;
    showSlide();
  };
  lb.addEventListener('click', function(e) { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', function(e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'ArrowRight') { var vc=visCards(); currentIdx=(currentIdx+1)%vc.length; showSlide(); }
    if (e.key === 'ArrowLeft') { var vc=visCards(); currentIdx=(currentIdx-1+vc.length)%vc.length; showSlide(); }
    if (e.key === 'Escape') closeLb();
  });
  cards.forEach(function(card, i) {
    card.addEventListener('click', function() {
      var vc = visCards();
      var idx = vc.indexOf(card);
      if (idx !== -1) openLb(idx);
    });
  });
});
<\/script>`;

// ─── INJECT HELPER ────────────────────────────────────────────────────────────
function inject(filename, cssBlock, jsBlock) {
  const filepath = path.join(BASE, filename);
  let html = fs.readFileSync(filepath, 'utf8');

  // Inject CSS before </head> (only once, avoid duplicates)
  if (!html.includes('/* INJECTED-PAGE-CSS */')) {
    const markedCSS = cssBlock.replace('<style>', '<style>/* INJECTED-PAGE-CSS */\n');
    html = html.replace('</head>', markedCSS + '\n</head>');
  }

  // Inject JS before </body> (only once, avoid duplicates)
  if (!html.includes('/* INJECTED-PAGE-JS */')) {
    const markedJS = jsBlock.replace('<script>', '<script>/* INJECTED-PAGE-JS */\n');
    html = html.replace('</body>', markedJS + '\n</body>');
  }

  fs.writeFileSync(filepath, html, 'utf8');
  console.log('✅ Updated: ' + filename);
}

// ─── RUN ──────────────────────────────────────────────────────────────────────
inject('timeline.html',    timelineCSS,    timelineJS);
inject('discography.html', discographyCSS, discographyJS);
inject('worldtour.html',   worldtourCSS,   worldtourJS);
inject('gallery.html',     galleryCSS,     galleryJS);

console.log('\n🎉 All 4 pages updated successfully!');
