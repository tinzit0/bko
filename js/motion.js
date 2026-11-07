// Motion uses native browser APIs; no animation library or continuous render loop.
export function initMotion(preference) {
  const root = document.documentElement;
  const hero = document.querySelector('.hero');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const surfaces = [...document.querySelectorAll('.person-portrait, .office-image, .sector, .hero')];
  const parallax = [...document.querySelectorAll('.firm-visual, .territory-band')];
  const visible = new Set();
  const pending = new Map();
  let frame = 0;

  document.querySelectorAll('.sector-grid, .practice-list, .team-grid, .office-grid, .news-grid').forEach(group => {
    [...group.children].forEach((item, index) => item.style.setProperty('--entrance-delay', `${Math.min(index, 3) * 90}ms`));
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
    }, {rootMargin: '100px'});
    parallax.forEach(el => observer.observe(el));
  }

  function resetSurface(el) {
    pending.delete(el);
    el.classList.remove('pointer-active');
    for (const name of ['--pointer-x', '--pointer-y', '--tilt-x', '--tilt-y']) el.style.removeProperty(name);
  }

  function paintPointer() {
    frame = 0;
    if (preference.matches || !finePointer.matches || document.hidden) { pending.clear(); return; }
    for (const [el, point] of pending) {
      el.style.setProperty('--pointer-x', `${point.x * 100}%`);
      el.style.setProperty('--pointer-y', `${point.y * 100}%`);
      el.style.setProperty('--tilt-x', `${(0.5 - point.y) * 4}deg`);
      el.style.setProperty('--tilt-y', `${(point.x - 0.5) * 4}deg`);
      el.classList.add('pointer-active');
    }
    pending.clear();
  }

  for (const el of surfaces) {
    el.addEventListener('pointermove', event => {
      if (preference.matches || !finePointer.matches || event.pointerType === 'touch') return;
      const rect = el.getBoundingClientRect();
      pending.set(el, {x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))});
      if (!frame) frame = requestAnimationFrame(paintPointer);
    }, {passive: true});
    el.addEventListener('pointerleave', () => resetSurface(el));
    el.addEventListener('pointercancel', () => resetSurface(el));
  }

  function reset() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    surfaces.forEach(resetSurface);
    parallax.forEach(el => el.style.removeProperty('--scroll-shift'));
    hero.style.removeProperty('--hero-scroll');
  }

  preference.addEventListener('change', reset);
  finePointer.addEventListener('change', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });

  return function updateMotionScroll() {
    if (preference.matches || document.hidden) return;
    const heroRect = hero.getBoundingClientRect();
    if (heroRect.bottom > 0) hero.style.setProperty('--hero-scroll', `${Math.min(1, Math.max(0, -heroRect.top / heroRect.height))}`);
    // Parallax is confined to large screens and currently visible sections.
    if (innerWidth <= 1000) {
      parallax.forEach(el => el.style.removeProperty('--scroll-shift'));
      return;
    }
    for (const el of visible) {
      const rect = el.getBoundingClientRect();
      const shift = Math.max(-26, Math.min(26, (innerHeight / 2 - rect.top - rect.height / 2) * .06));
      el.style.setProperty('--scroll-shift', `${shift}px`);
    }
  };
}
