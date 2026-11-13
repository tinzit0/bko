// Música ambiental: reproduce assets/audio/musica-2.mp3 en bucle, con entrada y salida suaves.
// Nunca suena sola: el navegador exige un clic. Si el visitante la activó, al cambiar de página
// continúa desde el mismo punto con su primera interacción. Se silencia al ocultar la pestaña.
const STORE = 'bko-music';
const POSITION = 'bko-music-time';
const VOLUME = 0.15;
const FADE_IN = 2500;
const FADE_OUT = 1200;

let audio, button, playing = false, fadeFrame = 0;

function remember(on) { try { localStorage.setItem(STORE, on ? 'on' : 'off'); } catch {} }
// No suena al entrar: solo continúa en otras páginas si el visitante la activó con el botón (12-11-2026).
function wanted() { try { return localStorage.getItem(STORE) === 'on'; } catch { return false; } }
function savedTime() { try { return Number(sessionStorage.getItem(POSITION)) || 0; } catch { return 0; } }
function saveTime() { try { if (audio) sessionStorage.setItem(POSITION, String(audio.currentTime)); } catch {} }

function fadeTo(target, ms, done) {
  cancelAnimationFrame(fadeFrame);
  const from = audio.volume, start = performance.now();
  const step = now => {
    const t = Math.min(1, (now - start) / ms);
    audio.volume = from + (target - from) * (t * t * (3 - 2 * t));
    if (t < 1) fadeFrame = requestAnimationFrame(step); else done?.();
  };
  fadeFrame = requestAnimationFrame(step);
}

function getAudio() {
  if (audio) return audio;
  audio = new Audio(new URL('../assets/audio/musica-2.mp3', import.meta.url).href);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0;
  const start = savedTime();
  if (start) audio.addEventListener('loadedmetadata', () => { if (start < audio.duration) audio.currentTime = start; }, {once: true});
  audio.addEventListener('waiting', () => button?.classList.add('is-loading'));
  audio.addEventListener('playing', () => button?.classList.remove('is-loading'));
  addEventListener('pagehide', saveTime);
  return audio;
}

async function play() {
  if (playing) return;
  const a = getAudio();
  playing = true;
  render();
  try { await a.play(); } catch { playing = false; button?.classList.remove('is-loading'); render(); return; }
  if (!playing) return;
  fadeTo(VOLUME, FADE_IN);
}

function pause({keepPreference = false} = {}) {
  if (!playing) return;
  playing = false;
  if (!keepPreference) remember(false);
  render();
  fadeTo(0, FADE_OUT, () => { if (!playing) { audio.pause(); saveTime(); } });
}

function render() {
  if (!button) return;
  button.classList.toggle('is-playing', playing);
  button.setAttribute('aria-pressed', String(playing));
  button.setAttribute('aria-label', playing ? 'Pausar música' : 'Reproducir música');
  button.querySelector('.music-label').textContent = playing ? 'Pausar música' : 'Música ambiental';
}

export function initMusic() {
  if (document.querySelector('.music-toggle')) return;
  button = document.createElement('button');
  button.type = 'button';
  button.className = 'music-toggle';
  button.innerHTML = '<span class="music-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="music-label"></span>';
  button.addEventListener('click', () => {
    if (playing) pause(); else { remember(true); play(); }
  });
  document.body.append(button);
  render();

  // Arranque automático: intenta sonar al cargar. Si el navegador bloquea el audio sin interacción
  // (Chrome, Safari y Edge lo hacen en la primera visita), empieza con el primer clic, toque o tecla.
  if (wanted()) {
    const events = ['pointerdown', 'touchend', 'keydown'];
    const resume = e => {
      if (e.target.closest?.('.music-toggle')) { stop(); return; }
      stop();
      if (wanted()) play();
    };
    const stop = () => { button.classList.remove('is-waiting'); events.forEach(n => removeEventListener(n, resume, true)); };
    const a = getAudio();
    a.play().then(() => {
      playing = true;
      render();
      fadeTo(VOLUME, FADE_IN);
    }).catch(() => {
      button.classList.add('is-waiting');
      events.forEach(n => addEventListener(n, resume, true));
    });
  }

  // Pestaña oculta: silencio; al volver, continúa si estaba sonando.
  let resumeOnShow = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playing) { resumeOnShow = true; pause({keepPreference: true}); }
    else if (!document.hidden && resumeOnShow) { resumeOnShow = false; play(); }
  });
}
