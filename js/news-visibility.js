// La sección «Actualidad» y su enlace del menú se ocultan mientras no haya artículos o estudios publicados.
// Con sesión del equipo se muestran siempre, para poder agregar el primero.
import {config} from './config.js';
const key='bko-news-visible',root=document.documentElement;
const signedIn=()=>{try{return !!(localStorage.getItem('bko-admin-session')||sessionStorage.getItem('bko-admin-session'))}catch{return false}};
export function setNewsVisible(on){root.classList.toggle('bko-news',!!on);try{sessionStorage.setItem(key,on?'1':'0')}catch{}}
let cached=null;try{cached=sessionStorage.getItem(key)}catch{}
if(cached==='1'||signedIn())root.classList.add('bko-news');
async function check(){
 if(signedIn()){setNewsVisible(true);return}
 try{
  const r=await fetch(`${config.supabaseUrl}/rest/v1/bko_publications?select=id&published=eq.true&limit=1`,{headers:{apikey:config.supabasePublishableKey},cache:'no-store',signal:AbortSignal.timeout(8000)});
  const rows=r.ok?await r.json():[];setNewsVisible(Array.isArray(rows)&&rows.length>0);
 }catch{}
}
check();
window.addEventListener('bko:session-change',check);
window.addEventListener('bko:publications-changed',check);
