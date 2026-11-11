// Navegación por anclas fiable aunque las secciones del CMS se dibujen después de cargar la página.
export function initAnchorScroll({ onNavigate = () => {} } = {}) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const byHash = hash => hash && hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
  const samePage = url => url.origin === location.origin && url.pathname.replace(/index\.html$/, '') === location.pathname.replace(/index\.html$/, '');

  // Enlaces "pagina.html#seccion" que apuntan a la página actual: desplazarse sin recargar.
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href*="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    const target = byHash(url.hash);
    if (!target || !samePage(url)) return;
    e.preventDefault();
    onNavigate(url.hash);
    target.scrollIntoView({ block: 'start', behavior: reduced.matches ? 'auto' : 'smooth' });
    if (location.hash !== url.hash) history.pushState(null, '', url.hash);
  });

  // Al llegar con un ancla desde otra página se vuelve a alinear la sección mientras el contenido
  // dinámico cambia la altura de la página, salvo que la persona ya se haya desplazado por su cuenta.
  if (byHash(location.hash) || location.hash.length > 1) {
    let userMoved = false;
    const stop = () => { userMoved = true; };
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(type => addEventListener(type, stop, { once: true, passive: true }));
    const align = () => {
      const target = byHash(location.hash);
      if (userMoved || !target || target.hidden) return;
      onNavigate(location.hash);
      target.scrollIntoView({ block: 'start', behavior: 'instant' });
    };
    [0, 150, 500, 1000, 1800, 3000].forEach(ms => setTimeout(align, ms));
    addEventListener('load', () => { align(); setTimeout(align, 400); });
  }
}
