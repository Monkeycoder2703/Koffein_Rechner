'use strict';
/* UI-Politur: Spotlight, das dem Mauszeiger folgt, und leichte 3D-Neigung der Getränke-Kacheln. */
(() => {
  const SPOT = '.panel,.drink,.size-opt,.tabs';
  document.addEventListener('pointermove', (e) => {
    const el = e.target.closest && e.target.closest(SPOT); if (!el) return;
    const r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    el.style.setProperty('--mx', x + 'px'); el.style.setProperty('--my', y + 'px');
    if (!REDUCED && !LITE && el.classList.contains('drink')) {
      el.style.setProperty('--ry', ((x / r.width - .5) * 14).toFixed(1) + 'deg'); el.style.setProperty('--rx', ((.5 - y / r.height) * 14).toFixed(1) + 'deg');
    }
  }, { passive: true });
  document.addEventListener('pointerout', (e) => {
    const el = e.target.closest && e.target.closest('.drink');
    if (el && !el.contains(e.relatedTarget)) { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); }
  }, { passive: true });
})();
// Beim Scrollen pausieren die Hintergrund-Animationen: das Handy hat dann alle Kraft für das flüssige Wischen
(() => {
  const r = document.documentElement; let tm = 0, on = false;
  addEventListener('scroll', () => {
    if (!on) { on = true; r.classList.add('scrolling'); }
    clearTimeout(tm); tm = setTimeout(() => { on = false; r.classList.remove('scrolling'); }, 160);
  }, { passive: true });
})();
