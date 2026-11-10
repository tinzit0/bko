// Progressive enhancement: the full copy remains readable without JavaScript.
let sequence = 0;
function tabs(root, label, groups, {wrap = true} = {}) {
  if (!root || root.querySelector(':scope > [data-content-tabs]')) return;
  groups = groups.filter(group => group.nodes.length);
  if (groups.length < 2) return;
  const bar = document.createElement('nav');
  bar.className = 'content-tabs';
  bar.dataset.contentTabs = '';
  bar.setAttribute('role', 'tablist');
  bar.setAttribute('aria-label', label);
  const id = `content-tabs-${++sequence}`;
  const panels = groups.map((group, index) => {
    const panel = wrap ? document.createElement('div') : group.nodes[0];
    if (wrap) {
      root.insertBefore(panel, group.nodes[0]);
      panel.append(...group.nodes);
    }
    panel.id ||= `${id}-panel-${index}`;
    panel.classList.add('content-tab-panel');
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `${id}-tab-${index}`);
    panel.tabIndex = 0;
    return panel;
  });
  const buttons = groups.map((group, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = `${id}-tab-${index}`;
    button.textContent = group.label;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', panels[index].id);
    button.addEventListener('click', () => select(index));
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % groups.length;
      if (event.key === 'ArrowLeft') next = (index + groups.length - 1) % groups.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = groups.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      select(next);
      buttons[next].focus();
    });
    bar.append(button);
    return button;
  });
  function select(index) {
    panels.forEach((panel, i) => { panel.hidden = i !== index; });
    buttons.forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === index));
      button.tabIndex = i === index ? 0 : -1;
    });
  }
  // Inserting a nav preserves the original paragraph/div indices used by the CMS.
  const firstPanel = [...root.children].find(child => panels.includes(child));
  root.insertBefore(bar, firstPanel);
  select(0);
}

export function initContentTabs() {
  if (!document.querySelector('#firma')) return;
  const copy = document.querySelector('.firm-copy');
  tabs(copy, 'Conoce la firma', [
    {label: 'Nuestro enfoque', nodes: [...copy.querySelectorAll(':scope > p:not(.eyebrow):not(.intro)')].slice(0, 1)},
    {label: 'Presencia', nodes: [...copy.querySelectorAll(':scope > p:not(.eyebrow):not(.intro)')].slice(1)}
  ], {wrap: false});

  function enhancePeople() {
    document.querySelectorAll('#personas .service-grid > article').forEach(article => {
      const paragraphs = [...article.querySelectorAll(':scope > p:not(.eyebrow)')];
      tabs(article, article.querySelector('.eyebrow')?.textContent || 'Información del servicio', [
        {label: 'Resumen', nodes: paragraphs.slice(0, 1)},
        {label: 'Servicios', nodes: [...paragraphs.slice(1), ...article.querySelectorAll(':scope > ul')]},
        {label: 'Equipo', nodes: [...article.querySelectorAll(':scope > .area-specialists, :scope > .area-legal')]}
      ]);
    });
    document.querySelectorAll('#practicas details.practice').forEach(detail => {
      detail.open = detail.id === location.hash.slice(1);
    });
  }
  enhancePeople();
  document.addEventListener('bko:firm-loaded', enhancePeople);
}
