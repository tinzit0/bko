import { initLuxury } from './luxury.js';
import { initCinema } from './cinema.js';
import { initMusic } from './music.js';
import { initAnchorScroll } from './anchor-scroll.js';
import { config } from './config.js';
initAnchorScroll();
initLuxury();
initCinema();
initMusic();
const menu=document.querySelector('.menu-toggle');
const nav=document.querySelector('#navigation');
const header=document.querySelector('#header');
function closeMenu(){menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Abrir menú');nav.classList.remove('is-open');document.body.classList.remove('menu-open')}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');nav.classList.toggle('is-open',open);document.body.classList.toggle('menu-open',open)});
nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
document.addEventListener('click',e=>{if(!header.contains(e.target))closeMenu()});
matchMedia('(min-width:1201px)').addEventListener('change',e=>{if(e.matches)closeMenu()});
window.addEventListener('scroll',()=>header.classList.toggle('scrolled',scrollY>30),{passive:true});
const activeArea=document.querySelector('.insurance-page')?'#seguros':'#equipo';
document.querySelectorAll('#navigation a').forEach(a=>{a.classList.remove('active');a.removeAttribute('aria-current');if(a.hash===activeArea){a.classList.add('active');a.setAttribute('aria-current','page')}});
document.querySelector('#year').textContent=new Date().getFullYear();
for(const [selector,id]of [['[data-open-privacy]','privacy-dialog'],['[data-open-credits]','credits-dialog']])document.querySelectorAll(selector).forEach(b=>b.addEventListener('click',()=>document.getElementById(id).showModal()));
document.querySelectorAll('[data-close-dialog]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));

// Correos del pie: se muestran solo los configurados; los vacíos no se exponen como texto provisional.
document.querySelectorAll('[data-email]').forEach(slot=>{const email=config.emails[slot.dataset.email];if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){slot.remove();return}const a=document.createElement('a');a.href=`mailto:${email}`;a.textContent=email;slot.replaceChildren(a)});
