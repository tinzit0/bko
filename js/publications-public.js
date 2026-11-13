// Artículos y estudios: portada (#actualidad) y página publicaciones/index.html.
// Visitantes ven solo lo publicado. Con sesión admin/editor aparecen los controles para agregar, editar,
// publicar/ocultar y destacar directamente desde las tarjetas.
import {config} from './config.js';
import {setNewsVisible} from './news-visibility.js';
import {publicationKinds,publicationColumns,defaultCovers,coverUrl,fileUrl,formatDate,bodyMarkup,sortPublications,validatePublication,readingMinutes,excerpt,matchesSearch,relatedPublications,escapeHtml as h} from './publications-model.js';

const root=new URL('../',import.meta.url).href;
const pageUrl=slug=>root+'publicaciones/index.html'+(slug?'?p='+encodeURIComponent(slug):'');
const home=document.querySelector('[data-publications]'),page=document.querySelector('[data-publications-page]');
let rows=[],editor=false,editorModule,filter='todos',query='';

async function loadPublished(){
 const r=await fetch(`${config.supabaseUrl}/rest/v1/bko_publications?select=${publicationColumns}&published=eq.true&order=featured.desc,published_on.desc,created_at.desc`,{headers:{apikey:config.supabasePublishableKey},cache:'no-store',signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw Error('No se pudieron cargar las publicaciones.');
 const data=await r.json();return Array.isArray(data)?data.filter(validatePublication):[];
}
async function load(){
 editorModule??=await import('./publications-editor.js');
 editor=await editorModule.canEditPublications();
 if(editor){try{rows=(await editorModule.loadAllPublications()).filter(validatePublication);return}catch{}}
 rows=await loadPublished();
}
const authors=()=>[...rows.map(r=>r.author),...[...document.querySelectorAll('[data-team-navigation] a')].slice(1).map(a=>a.textContent.trim())].filter(Boolean);
function edit(publication){
 editorModule.openPublicationEditor(publication,{authors:authors(),areas:rows.map(r=>r.area),onSaved:(saved,action)=>{
  if(action==='deleted'&&page&&new URLSearchParams(location.search).get('p')===saved.slug){location.href=pageUrl();return}
  refresh(action==='deleted'?'Publicación eliminada.':saved.published?'Listo: la publicación está visible para todos.':'Guardada como borrador: solo la ve el equipo.',saved.published&&action!=='deleted'?saved:null);
 }});
}
async function quick(id,changes,message){
 const p=rows.find(r=>r.id===id);if(!p)return;
 document.querySelectorAll('[data-pub-quick]').forEach(b=>b.disabled=true);
 try{await editorModule.quickUpdate(p,changes);await refresh(message)}
 catch(error){document.querySelectorAll('[data-pub-status]').forEach(el=>el.textContent=error.message);document.querySelectorAll('[data-pub-quick]').forEach(b=>b.disabled=false)}
}

function card(p){
 const cover=coverUrl(p.cover_url,root)||root+defaultCovers[p.kind],kind=publicationKinds[p.kind];
 const label=p.kind==='estudio'?'VER ESTUDIO':'LEER ARTÍCULO',summary=p.summary||excerpt(p.body,180);
 return `<article class="news-card publication-card${p.published?'':' is-draft'}" data-kind="${h(p.kind)}">
  <a class="publication-link" href="${h(pageUrl(p.slug))}">
   <div class="news-image"><img src="${h(cover)}" alt="${h(p.cover_alt)}" loading="lazy" decoding="async" width="900" height="600"></div>
   <div class="news-meta"><span>${h((kind+(p.area?' · '+p.area:'')).toUpperCase())}</span><span>${h(formatDate(p.published_on))}${p.body?` · ${readingMinutes(p.body)} MIN`:''}</span></div>
   <h3>${h(p.title)}</h3>${summary?`<p>${h(summary)}</p>`:''}
   <span class="publication-more">${label}${p.file_url?' · PDF':''} <span aria-hidden="true">→</span></span>
  </a>
  ${editor?`<div class="publication-admin">${p.published?'<span class="publication-badge is-live">PUBLICADA</span>':'<span class="publication-badge">BORRADOR</span>'}${p.featured?'<span class="publication-badge is-featured">★ DESTACADA</span>':''}
   <div class="publication-admin-actions"><button type="button" data-pub-edit="${h(p.id)}">EDITAR</button><button type="button" data-pub-quick="publish" data-id="${h(p.id)}">${p.published?'OCULTAR':'PUBLICAR'}</button><button type="button" data-pub-quick="feature" data-id="${h(p.id)}">${p.featured?'QUITAR ★':'★ DESTACAR'}</button></div></div>`:''}
 </article>`;
}
function tools(where){
 if(!editor)return '';
 const drafts=rows.filter(r=>!r.published).length,live=rows.length-drafts;
 return `<div class="publications-tools" data-publications-tools><div><strong>Administración de artículos y estudios</strong><span>${rows.length?`${live} ${live===1?'publicada':'publicadas'} · ${drafts} ${drafts===1?'borrador':'borradores'}. Los borradores solo los ve el equipo.`:'Todavía no hay publicaciones. ¡Crea la primera!'}</span></div><button type="button" class="is-primary" data-pub-new="articulo">+ NUEVO ARTÍCULO</button><button type="button" data-pub-new="estudio">+ NUEVO ESTUDIO</button>${where==='home'?`<a href="${h(pageUrl())}">VER Y GESTIONAR TODAS</a>`:''}<p data-pub-status role="status" aria-live="polite"></p></div>`;
}
function bind(scope){
 scope.querySelectorAll('[data-pub-new]').forEach(b=>b.onclick=()=>edit({kind:b.dataset.pubNew}));
 scope.querySelectorAll('[data-pub-edit]').forEach(b=>b.onclick=()=>edit(rows.find(r=>r.id===b.dataset.pubEdit)));
 scope.querySelectorAll('[data-pub-quick]').forEach(b=>b.onclick=()=>{
  const p=rows.find(r=>r.id===b.dataset.id);if(!p)return;
  if(b.dataset.pubQuick==='publish'){
   if(!p.published&&!p.summary&&!p.body&&!p.file_url){edit(p);return}
   quick(p.id,{published:!p.published},p.published?'Publicación oculta: ahora es un borrador.':'Publicada: ya la ven todos los visitantes.');
  }else quick(p.id,{featured:!p.featured},p.featured?'Ya no está destacada.':'Destacada: aparece primero en la portada.');
 });
}

let placeholders;
function renderHome(){
 placeholders??=home.innerHTML;
 const section=home.closest('section'),list=sortPublications(rows).slice(0,3);
 section.querySelector('[data-publications-tools]')?.remove();section.querySelector('.publications-footer')?.remove();
 if(list.length){home.innerHTML=list.map(card).join('');home.classList.add('has-publications')}
 else{home.innerHTML=placeholders;home.classList.remove('has-publications')}
 const note=section.querySelector('.small-note');if(note)note.hidden=rows.some(r=>r.published);
 if(editor)home.insertAdjacentHTML('beforebegin',tools('home'));
 if(rows.length)home.insertAdjacentHTML('afterend',`<div class="publications-footer"><a class="button profile-link" href="${h(pageUrl())}">VER TODOS LOS ARTÍCULOS Y ESTUDIOS <span aria-hidden="true">→</span></a></div>`);
 bind(section);
}

function renderGrid(){
 const grid=page.querySelector('[data-publications-results]');if(!grid)return;
 const list=sortPublications(rows).filter(r=>(filter==='todos'||r.kind===filter)&&matchesSearch(r,query));
 grid.innerHTML=list.length?`<div class="news-grid publications-grid">${list.map(card).join('')}</div>`:`<p class="publications-empty">${rows.length?(query?`No encontramos publicaciones con «${h(query)}».`:'No hay publicaciones de este tipo todavía.'):'Pronto publicaremos aquí nuestros artículos y estudios.'}</p>`;
 const count=page.querySelector('[data-publications-count]');if(count)count.textContent=`${list.length} ${list.length===1?'resultado':'resultados'}`;
 page.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(filter===b.dataset.filter)));
 bind(grid);
}
function renderList(){
 const counts={todos:rows.length,articulo:rows.filter(r=>r.kind==='articulo').length,estudio:rows.filter(r=>r.kind==='estudio').length};
 document.title='Artículos y estudios | BKO Consultores';
 page.innerHTML=`<header class="publications-hero"><p class="eyebrow">BKO / ACTUALIDAD</p><h1>Artículos y <em>estudios.</em></h1><p>Análisis, perspectivas y documentos preparados por el equipo de BKO Consultores.</p></header>
 ${tools('page')}
 ${rows.length?`<div class="publications-controls"><div class="publications-filter" role="group" aria-label="Filtrar publicaciones">${[['todos','Todos'],['articulo','Artículos'],['estudio','Estudios']].map(([k,l])=>`<button type="button" data-filter="${k}" aria-pressed="${filter===k}">${l} <span>${counts[k]}</span></button>`).join('')}</div>
 <label class="publications-search"><span>Buscar</span><input type="search" placeholder="Tema, título o autor…" value="${h(query)}" data-publications-search></label><span class="publications-count" data-publications-count aria-live="polite"></span></div>`:''}
 <div data-publications-results></div>`;
 page.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;renderGrid()});
 page.querySelector('[data-publications-search]')?.addEventListener('input',e=>{query=e.target.value.trim();renderGrid()});
 bind(page);renderGrid();
}

function share(p){
 const url=pageUrl(p.slug),text=`${p.title} — BKO Consultores`;
 return `<div class="publication-share"><span>Compartir</span>
  <a href="https://wa.me/?text=${encodeURIComponent(text+'\n'+url)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
  <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}" target="_blank" rel="noopener noreferrer">LinkedIn</a>
  <a href="mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}">Correo</a>
  <button type="button" data-pub-copy>Copiar enlace</button><span class="publication-share-status" data-pub-share-status role="status" aria-live="polite"></span></div>`;
}
function renderDetail(slug){
 const p=rows.find(r=>r.slug===slug);
 if(!p){document.title='Publicación no disponible | BKO';page.innerHTML=`<div class="publication-article"><p class="eyebrow">BKO / ACTUALIDAD</p><h1>Publicación no disponible</h1><p>Es posible que haya sido retirada o que el enlace no sea correcto.</p><a class="button button-gold" href="${h(pageUrl())}">VER TODAS LAS PUBLICACIONES</a></div>`;return}
 const cover=coverUrl(p.cover_url,root),file=fileUrl(p.file_url),kind=publicationKinds[p.kind],related=relatedPublications(p,rows);
 document.title=`${p.title} | BKO Consultores`;
 const description=document.querySelector('meta[name="description"]');if(description)description.content=p.summary||excerpt(p.body,160);
 page.innerHTML=`${editor?`<div class="publications-tools" data-publications-tools><div><strong>${p.published?'● Publicada':'○ Borrador'}</strong><span>${p.published?'Visible para todos los visitantes.':'Solo la ve el equipo. Publícala cuando esté lista.'}</span></div><button type="button" class="is-primary" data-pub-edit="${h(p.id)}">EDITAR</button><button type="button" data-pub-quick="publish" data-id="${h(p.id)}">${p.published?'OCULTAR':'PUBLICAR'}</button><button type="button" data-pub-quick="feature" data-id="${h(p.id)}">${p.featured?'QUITAR ★':'★ DESTACAR'}</button><p data-pub-status role="status" aria-live="polite"></p></div>`:''}
 <article class="publication-article">
  <a class="publication-back" href="${h(pageUrl())}">← TODOS LOS ARTÍCULOS Y ESTUDIOS</a>
  <p class="eyebrow">${h((kind+(p.area?' · '+p.area:'')).toUpperCase())}</p>
  <h1>${h(p.title)}</h1>
  <p class="publication-byline">${p.author?`<span>${h(p.author)}</span>`:''}<time datetime="${h(p.published_on)}">${h(formatDate(p.published_on))}</time>${p.body?`<span>${readingMinutes(p.body)} min de lectura</span>`:''}</p>
  ${p.summary?`<p class="publication-lead">${h(p.summary)}</p>`:''}
  ${cover?`<figure class="publication-cover"><img src="${h(cover)}" alt="${h(p.cover_alt)}" decoding="async"></figure>`:''}
  <div class="publication-body">${bodyMarkup(p.body,root)}</div>
  ${file?`<div class="publication-file"><div><strong>${p.kind==='estudio'?'Documento del estudio':'Documento adjunto'}</strong><span>${h(p.file_name||'PDF')}</span></div><a class="button button-gold" href="${h(file)}" target="_blank" rel="noopener">ABRIR PDF <span aria-hidden="true">↗</span></a></div>`:''}
  ${p.published?share(p):''}
  <div class="publication-contact"><p>¿Quieres conversar sobre este tema con nuestro equipo?</p><a class="button profile-link" href="${h(root)}index.html#contacto">CONTACTAR A BKO</a></div>
 </article>
 ${related.length?`<section class="publication-related"><h2>Sigue leyendo</h2><div class="news-grid publications-grid">${related.map(card).join('')}</div></section>`:''}`;
 bind(page);
 page.querySelector('[data-pub-copy]')?.addEventListener('click',async()=>{const msg=page.querySelector('[data-pub-share-status]');try{await navigator.clipboard.writeText(pageUrl(p.slug));msg.textContent='Enlace copiado.'}catch{msg.textContent=pageUrl(p.slug)}});
}

function render(){
 if(home)renderHome();
 if(page){const slug=new URLSearchParams(location.search).get('p');slug?renderDetail(slug):renderList()}
}
async function refresh(message,justPublished){
 try{await load()}catch{rows=[]}
 render();setNewsVisible(editor||rows.some(r=>r.published));
 if(message)document.querySelectorAll('[data-pub-status]').forEach(el=>{el.textContent=message;if(justPublished&&!page){const a=document.createElement('a');a.href=pageUrl(justPublished.slug);a.textContent=' Ver publicación →';el.append(a)}});
}
if(home||page){
 if(page)page.setAttribute('aria-busy','true');
 await refresh();page?.removeAttribute('aria-busy');
 window.addEventListener('bko:session-change',()=>refresh());
 window.addEventListener('bko:publications-changed',()=>refresh());
 window.addEventListener('storage',e=>{if(e.key==='bko-admin-session')refresh()});
}
