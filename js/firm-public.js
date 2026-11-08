import {config} from './config.js';
import {validateRecord,visibleRecords,insuranceProfile,profilePath} from './firm-model.js';
import {teamMarkup,peopleMarkup,practiceMarkup,profileMarkup,cauceMarkup,caucePreview,firmNavigation} from './firm-render.js';
import {loadInsuranceContent,applyInsuranceContent} from './cms-public.js';
const base=new URL('../',import.meta.url),local=location.pathname===base.pathname||location.pathname===base.pathname+'index.html'?'':'../';
const targets=[...document.querySelectorAll('[data-firm-team],[data-firm-people],[data-firm-practices],[data-firm-cauce],[data-firm-profile],[data-cauce-preview]')];
const notice='<div class="firm-unavailable" role="status"><h2>Contenido no disponible</h2><p>Intenta recargar la página o contacta a BKO para recibir orientación.</p></div>';
export async function loadFirm(){
 const response=await fetch(config.supabaseUrl+'/rest/v1/bko_content?select=*&order=sort_order,id',{headers:{apikey:config.supabasePublishableKey},cache:'no-store',signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error('No se pudo cargar el contenido.');
 const rows=await response.json();if(!Array.isArray(rows)||!rows.every(validateRecord))throw Error('Contenido inválido.');return rows;
}
function seo(row){const d=row.data,title=d.seoTitle||`${d.name||d.title} | BKO Consultores`,description=d.seoDescription||d.intro.split('\n\n')[0];document.title=title;for(const [s,value]of [['meta[name=description]',description],['meta[property="og:title"]',title],['meta[property="og:description"]',description]])document.querySelector(s)?.setAttribute('content',value);const schema=document.querySelector('script[type="application/ld+json"]');if(schema)schema.textContent=JSON.stringify({'@context':'https://schema.org','@type':row.kind==='professional'?'Person':'Service',name:d.name||d.title,description,url:location.href.split('?')[0]});}
try{
 const [rows,insurance]=await Promise.all([loadFirm(),loadInsuranceContent()]);const records=visibleRecords(rows).map(r=>insuranceProfile(r,insurance));
 for(const root of targets){
  if(root.hasAttribute('data-firm-team'))root.innerHTML=teamMarkup(records,local);
  if(root.hasAttribute('data-firm-people'))root.innerHTML=peopleMarkup(records,local);
  if(root.hasAttribute('data-firm-practices'))root.innerHTML=practiceMarkup(records);
  if(root.hasAttribute('data-cauce-preview'))root.innerHTML=caucePreview(records,local);
  if(root.hasAttribute('data-firm-profile')){const id=root.dataset.firmProfile||new URLSearchParams(location.search).get('id'),row=records.find(r=>r.id===id&&r.kind==='professional');root.innerHTML=row?profileMarkup(row,local,records):notice;if(row)seo(row);else{document.title='Perfil no disponible | BKO';document.querySelector('script[type="application/ld+json"]')?.remove();document.querySelector('meta[name=robots]')?.setAttribute('content','noindex,nofollow')}}
  if(root.hasAttribute('data-firm-cauce')){const row=records.find(r=>r.id==='cauce');root.innerHTML=row?cauceMarkup(row,records,local):notice;document.querySelector('#solicitud-cauce')?.toggleAttribute('hidden',!row);if(row)seo(row)}
  root.setAttribute('data-firm-ready','');
 }
 const nav=document.querySelector('#navigation');if(nav)nav.innerHTML=firmNavigation(records,local);
 const teamNav=document.querySelector('[data-team-navigation]');if(teamNav){teamNav.replaceChildren();for(const [href,label]of [[local+'index.html#equipo','Nuestro equipo'],...records.filter(r=>r.kind==='professional').map(r=>[local+profilePath(r.id),r.data.name||'Asistente de la firma'])]){const a=document.createElement('a');a.href=href;a.textContent=label;teamNav.append(a)}}
 // Roxana keeps one source of truth, shared with the insurance CMS and CRM.
 if(insurance)applyInsuranceContent(insurance);
 document.dispatchEvent(new CustomEvent('bko:firm-loaded',{detail:{records}}));
 if(location.hash){const target=document.getElementById(location.hash.slice(1));if(target?.matches('details'))target.open=true;if(target&&targets.some(root=>root.contains(target)))target.scrollIntoView({block:'start'})}
}catch{
 for(const root of targets){root.innerHTML=notice;root.setAttribute('data-firm-ready','')}
 const form=document.querySelector('#solicitud-cauce');if(form)form.hidden=true;
 document.dispatchEvent(new Event('bko:firm-error'));
}
// Native details menus remain keyboard-operable and close when focus moves outside.
const navigation=document.querySelector('#navigation');
navigation?.addEventListener('click',event=>{const summary=event.target.closest('summary');if(summary)navigation.querySelectorAll('.nav-group[open]').forEach(group=>{if(group!==summary.parentElement)group.open=false})});
document.addEventListener('click',event=>{if(navigation&&!navigation.contains(event.target))navigation.querySelectorAll('.nav-group[open]').forEach(group=>group.open=false)});
document.addEventListener('keydown',event=>{if(event.key==='Escape')navigation?.querySelectorAll('.nav-group[open]').forEach(group=>{group.open=false;group.querySelector('summary').focus()})});
