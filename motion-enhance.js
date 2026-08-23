// Progressive-enhancement layer powered by Motion (motion.dev), loaded as an ES module.
// Deliberately kept separate from script.js: everything here is additive UI polish that
// degrades gracefully (no-ops) if the CDN import fails or the user prefers reduced motion.
// Two things only, both chosen because plain CSS can't do them without fighting the
// hover transforms `.btn` / `.gacha-card` already have:
//   1. Animated number count-ups wherever a stat/percentage is set (window.animateNumber).
//   2. Tactile press feedback (brightness dip, not transform) on buttons and card tiles.

import { animate, press } from "https://cdn.jsdelivr.net/npm/motion@latest/+esm";

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

window.animateNumber = function (el, target, opts) {
  if (!el) return;
  opts = opts || {};
  const suffix = opts.suffix || '';
  const round = opts.round !== false;
  if (reduceMotion) {
    el.textContent = (round ? Math.round(target) : target) + suffix;
    return;
  }
  const current = parseFloat(el.textContent) || 0;
  if (current === target) {
    el.textContent = (round ? Math.round(target) : target) + suffix;
    return;
  }
  animate(current, target, {
    duration: opts.duration || 0.7,
    ease: [0.16, 1, 0.3, 1],
    onUpdate: (v) => { el.textContent = (round ? Math.round(v) : v.toFixed(1)) + suffix; },
    onComplete: () => { el.textContent = (round ? Math.round(target) : target) + suffix; }
  });
};

if (!reduceMotion) {
  // Motion's press() delegates via the selector string, so it automatically covers
  // elements swapped in later by the SPA router without needing to re-bind on navigation.
  press('.btn, .gacha-card, .inv-card, [role="button"]', (element) => {
    const controls = animate(element, { filter: 'brightness(0.85)' }, { type: 'spring', stiffness: 600, damping: 30 });
    return () => {
      controls.stop();
      animate(element, { filter: 'brightness(1)' }, { type: 'spring', stiffness: 400, damping: 25 });
    };
  });
}
