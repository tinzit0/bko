// Capa cinematográfica: contadores, foco de luz en secciones oscuras y entradas de títulos.
// Sin librerías; todo se detiene con «reducir movimiento» o con la pestaña oculta.
export function initCinema() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const io = 'IntersectionObserver' in window;

  // 1. Contadores: animan el número y restauran exactamente el texto original al terminar.
  const counters = [...document.querySelectorAll('.band-figures dt')];
  const runCounter = dt => {
    const node = [...dt.childNodes].find(n => n.nodeType === Node.TEXT_NODE && /\d/.test(n.textContent));
    if (!node || reduced.matches) return;
    const original = node.textContent;
    const match = original.match(/^(\D*)([\d.]+)(.*)$/s);
    if (!match) return;
    const [, prefix, digits, suffix] = match;
    const target = Number(digits.replace(/\./g, ''));
    const format = n => prefix + n.toLocaleString('es-CL') + suffix;
    const start = performance.now(), duration = target > 10 ? 1800 : 1100;
    const tick = now => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(2, -10 * t);
      node.textContent = t < 1 ? format(Math.round(target * eased)) : original;
      if (t < 1 && !document.hidden) requestAnimationFrame(tick); else node.textContent = original;
    };
    node.textContent = format(0);
    requestAnimationFrame(tick);
  };
  if (io && counters.length) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      runCounter(entry.target);
    }), {threshold: .6});
    counters.forEach(dt => observer.observe(dt));
  }

  // 2. Títulos: marca de visibilidad para el brillo dorado de las cursivas y otros revelados.
  const titledSelector = '.section-heading, .people-services blockquote, .insurance-home-photo, .insurance-leadership-photo, .insurance-presenter-photo, .band-figures, .cauce-preview';
  const titleObserver = io ? new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('cinema-in');
    titleObserver.unobserve(entry.target);
  }), {threshold: .25}) : null;
  const watchTitles = () => document.querySelectorAll(titledSelector).forEach(el => {
    if (el.classList.contains('cinema-in') || el.dataset.cinemaWatched) return;
    el.dataset.cinemaWatched = '';
    if (titleObserver) titleObserver.observe(el); else el.classList.add('cinema-in');
  });
  watchTitles();

  // 3. Foco de luz que sigue al cursor en las secciones oscuras.
  let frame = 0;
  const pending = new Map();
  const addSpots = () => document.querySelectorAll('.practices.dark, .contact.dark, .territory-band, .cauce-preview, .insurance-request.dark, .insurance-presenter').forEach(section => {
    if (section.classList.contains('cinema-spot-host')) return;
    const spot = document.createElement('span');
    spot.className = 'cinema-spot';
    spot.setAttribute('aria-hidden', 'true');
    section.classList.add('cinema-spot-host');
    section.prepend(spot);
    section.addEventListener('pointermove', e => {
      if (reduced.matches || !finePointer.matches || e.pointerType === 'touch') return;
      const r = section.getBoundingClientRect();
      pending.set(section, [e.clientX - r.left, e.clientY - r.top]);
      if (!frame) frame = requestAnimationFrame(() => {
        frame = 0;
        for (const [el, [x, y]] of pending) { el.style.setProperty('--spot-x', `${x}px`); el.style.setProperty('--spot-y', `${y}px`); el.classList.add('spot-on'); }
        pending.clear();
      });
    }, {passive: true});
    section.addEventListener('pointerleave', () => section.classList.remove('spot-on'));
  });
  addSpots();

  // El CMS vuelve a dibujar Personas, CAUCE y Seguros después de cargar: se enganchan los nodos nuevos.
  for (const name of ['bko:firm-loaded', 'bko:content-updated', 'bko:clients-loaded']) document.addEventListener(name, () => requestAnimationFrame(() => { watchTitles(); addSpots(); }));
}

// Cierre animado de las ventanas (.modal): espera la salida antes de cerrar. Sin animación, cierra al instante.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function closeModal(dialog) {
  if (!dialog.open || dialog.classList.contains('is-closing')) return;
  if (reducedMotion.matches) { dialog.close(); return; }
  dialog.classList.add('is-closing');
  const done = () => { dialog.classList.remove('is-closing'); dialog.close(); };
  dialog.addEventListener('animationend', e => { if (e.target === dialog) done(); }, {once: true});
  setTimeout(() => { if (dialog.open && dialog.classList.contains('is-closing')) done(); }, 600);
}
document.addEventListener('click', e => {
  const close = e.target.closest('.modal [data-close-dialog]');
  if (close) { e.preventDefault(); e.stopImmediatePropagation(); closeModal(close.closest('dialog')); return; }
  // Clic fuera del contenido (en el fondo oscuro) también cierra.
  if (e.target instanceof HTMLDialogElement && e.target.classList.contains('modal')) {
    const r = e.target.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeModal(e.target);
  }
}, true);
document.addEventListener('cancel', e => {
  if (e.target instanceof HTMLDialogElement && e.target.classList.contains('modal')) { e.preventDefault(); closeModal(e.target); }
}, true);
