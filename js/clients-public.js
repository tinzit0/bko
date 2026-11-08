import {config} from './config.js';
import {publicClientColumns,validateClient} from './clients-model.js';
import {clientsMarkup,bindClients} from './clients-render.js';
const root=document.querySelector('[data-clients]');
if(root){
 try{
  const preview=['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&document.querySelector('meta[name="bko-clients-preview"]')?.content==='local';
  const url=preview?'/__local/clients':config.supabaseUrl+'/rest/v1/bko_clients?select='+publicClientColumns+'&order=sort_order,slug';
  const r=await fetch(url,{headers:preview?{}:{apikey:config.supabasePublishableKey},cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('No se pudo cargar la sección de clientes.');
  const rows=await r.json();if(!Array.isArray(rows)||!rows.every(validateClient))throw Error('Contenido de clientes inválido.');
  root.innerHTML=clientsMarkup(rows,{preview,supabaseUrl:config.supabaseUrl,publishableKey:config.supabasePublishableKey});root.hidden=!root.innerHTML;root.dataset.clientsReady='';
  if(preview&&!root.hidden){root.dataset.clientsPreview='local';root.insertAdjacentHTML('afterbegin','<p class="clients-local-notice" role="note">Vista previa local del catálogo inicial · <a href="?clientes=publicados#clientes">Ver publicados</a></p>')}
  bindClients(root);
  if(!root.hidden){
   for(const navigation of document.querySelectorAll('#navigation,.footer-columns nav')){
    if(navigation.querySelector('[data-client-navigation]'))continue;
    const link=document.createElement('a');link.href='#clientes';link.textContent='Empresas';link.dataset.clientNavigation='';
    const firmLink=[...navigation.querySelectorAll('a')].find(a=>a.hash==='#firma');
    if(firmLink)firmLink.after(link);else navigation.append(link);
   }
  }
  root.querySelectorAll('.clients-featured .client-card').forEach((card,i)=>card.style.setProperty('--client-index',String(i)));
  if(!root.hidden&&'IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion:reduce)').matches){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){root.classList.add('is-revealed');observer.disconnect()}},{threshold:.08});observer.observe(root)}
  if(!root.hidden&&['#clientes','#clientes-completo'].includes(location.hash)){
   requestAnimationFrame(()=>root.scrollIntoView({block:'start',behavior:'instant'}));
  }
  document.dispatchEvent(new CustomEvent('bko:clients-loaded',{detail:{count:rows.length}}));
 }catch{root.replaceChildren();root.hidden=true;root.dataset.clientsReady='error'}
}
