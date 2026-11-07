import { config } from './config.js';
import { validateConsultation } from './validation.js';
import { initMotion } from './motion.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const header = $('#header');
const menu = $('.menu-toggle');
const nav = $('#navigation');

function closeMenu() {
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Abrir menú');
  nav.classList.remove('is-open');
  document.body.classList.remove('menu-open');
}
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  nav.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
});
nav.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenu(); } });
document.addEventListener('click', e => { if (!header.contains(e.target)) closeMenu(); });
matchMedia('(min-width:1001px)').addEventListener('change', e => { if (e.matches) closeMenu(); });

if ('IntersectionObserver' in window && !motion.matches) {
  document.documentElement.classList.add('js-motion');
  const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); reveal.unobserve(entry.target); }
  }), { threshold: .07 });
  $$('.reveal').forEach(el => reveal.observe(el));
}
motion.addEventListener('change', e => { if (e.matches) document.documentElement.classList.remove('js-motion'); });

let ticking = false;
const updateMotionScroll = initMotion(motion);
const sectionLinks = $$('#navigation a');
const sections = sectionLinks.map(link => $(link.getAttribute('href'))).sort((a,b) => a.offsetTop - b.offsetTop);
function updateScroll() {
  const y = window.scrollY;
  header.classList.toggle('scrolled', y > 30);
  const max = document.documentElement.scrollHeight - innerHeight;
  $('.reading-progress').style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  let active = sections[0];
  for (const section of sections) if (section.getBoundingClientRect().top <= 155) active = section;
  for (const link of sectionLinks) {
    const current = link.hash === `#${active.id}`;
    link.classList.toggle('active', current);
    if (current) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current');
  }
  if (!motion.matches && innerWidth > 700 && y < $('#inicio').offsetHeight) $('.hero-landscape').style.transform = `translateY(${Math.min(y * .14, 85)}px)`;
  else $('.hero-landscape').style.transform = '';
  updateMotionScroll();
  ticking = false;
}
window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(updateScroll); ticking = true; } }, { passive: true });
window.addEventListener('resize', () => { if (!ticking) { requestAnimationFrame(updateScroll); ticking = true; } }, { passive: true });
updateScroll();

// Abrir el área correcta antes de que el navegador se desplace a su ancla.
function openPractice(hash) {
  const target = document.getElementById(hash.replace('#',''));
  if (target?.matches('details')) {
    target.open = true;
    target.classList.add('is-visible');
  }
}
$$('a[href^="#"]').forEach(link => link.addEventListener('click', () => openPractice(link.hash)));
window.addEventListener('hashchange', () => openPractice(location.hash));
openPractice(location.hash);
$$('[data-area]').forEach(link => link.addEventListener('click', () => { $('#area').value = link.dataset.area; }));

const whatsappMessage = 'Hola, quisiera solicitar información sobre los servicios de BKO Bentjerodt Koplin y Oyarzun Consultores.';
$$('[data-whatsapp]').forEach(link => {
  link.href = `https://wa.me/56974826025?text=${encodeURIComponent(whatsappMessage)}`;
  link.addEventListener('click', () => window.dispatchEvent(new CustomEvent('bko:contact-click', {detail:{channel:'whatsapp'}})));
});
$$('[data-email]').forEach(slot => {
  const email = config.emails[slot.dataset.email];
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
  const link = document.createElement('a'); link.href = `mailto:${email}`; link.textContent = email;
  slot.replaceChildren(link);
});
$('#year').textContent = new Date().getFullYear();
$$('[data-open-privacy]').forEach(button => button.addEventListener('click', () => $('#privacy-dialog').showModal()));
$$('[data-open-credits]').forEach(button => button.addEventListener('click', () => $('#credits-dialog').showModal()));
$$('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$$('dialog').forEach(dialog => dialog.addEventListener('click', e => {
  const rect = dialog.getBoundingClientRect();
  if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) dialog.close();
}));

let turnstileToken = '';
let widgetId;
if (config.turnstileSiteKey) {
  window.bkoTurnstileReady = () => {
    widgetId = window.turnstile.render('#turnstile-container', {
      sitekey:config.turnstileSiteKey, theme:'dark',
      callback:token => { turnstileToken = token; },
      'expired-callback':() => { turnstileToken = ''; },
      'error-callback':() => { turnstileToken = ''; },
    });
  };
  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=bkoTurnstileReady&render=explicit';
  script.async = true; script.defer = true; document.head.append(script);
}

const form = $('#contact-form');
const status = $('#form-status');
let formStartedAt = Date.now();
let submitting = false;
function showStatus(message, state) { status.textContent = message; status.dataset.state = state; }
form.addEventListener('input', e => {
  const input = e.target;
  if (input.id && $(`#${input.id}-error`)) { $(`#${input.id}-error`).textContent = ''; input.removeAttribute('aria-invalid'); }
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting) return;
  const data = Object.fromEntries(new FormData(form));
  for (const key in data) if (typeof data[key] === 'string') data[key] = data[key].trim();
  data.privacy = $('#privacy').checked;
  const errors = validateConsultation(data);
  $$('.field-error').forEach(el => { el.textContent = ''; });
  $$('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  for (const [key, error] of Object.entries(errors)) { $(`#${key}-error`).textContent = error; $(`#${key}`).setAttribute('aria-invalid','true'); }
  if (Object.keys(errors).length) { showStatus('Revisa los campos indicados antes de enviar.', 'error'); $(`#${Object.keys(errors)[0]}`).focus(); return; }
  if (data.website || Date.now() - formStartedAt < 3000) { showStatus('Espera unos segundos e inténtalo nuevamente.', 'error'); return; }
  if (config.turnstileSiteKey && !turnstileToken) { showStatus('Completa la verificación de seguridad.', 'error'); return; }
  const button = form.querySelector('[type=submit]');
  submitting = true; button.disabled = true; button.querySelector('span').textContent = 'Enviando consulta…'; form.setAttribute('aria-busy', 'true');
  showStatus('Estamos enviando tu consulta.', 'pending');
  try {
    const response = await fetch(`${config.supabaseUrl}/functions/v1/contact`, {
      method:'POST', headers:{'Content-Type':'application/json','apikey':config.supabasePublishableKey},
      body:JSON.stringify({...data, startedAt:formStartedAt, turnstileToken}), signal:AbortSignal.timeout(18000),
    });
    const result = await response.json().catch(() => ({}));
    if (response.status === 429) throw new Error('Has realizado varias consultas. Espera una hora o escríbenos por WhatsApp.');
    if (!response.ok || result.ok !== true || typeof result.id !== 'string') throw new Error('No pudimos confirmar la recepción. Inténtalo más tarde o contáctanos por WhatsApp al +56 9 7482 6025.');
    showStatus('Tu consulta fue recibida correctamente. Gracias por contactar a BKO.', 'success');
    // Conversión sin datos personales: conectar GTM/GA4 solo después del consentimiento.
    window.dispatchEvent(new CustomEvent('bko:consultation-sent', {detail:{channel:'form'}}));
    form.reset(); formStartedAt = Date.now();
  } catch (error) {
    showStatus(error.name === 'TimeoutError' ? 'La conexión tardó demasiado. No pudimos confirmar la recepción; contáctanos por WhatsApp al +56 9 7482 6025 antes de reenviar.' : error.message === 'Failed to fetch' ? 'No pudimos conectar con el formulario. Tus datos siguen aquí. Puedes escribirnos por WhatsApp al +56 9 7482 6025.' : error.message, 'error');
  } finally {
    submitting = false; button.disabled = false; button.querySelector('span').textContent = 'Enviar consulta'; form.removeAttribute('aria-busy');
    if (widgetId !== undefined && window.turnstile) { window.turnstile.reset(widgetId); turnstileToken = ''; }
  }
});
