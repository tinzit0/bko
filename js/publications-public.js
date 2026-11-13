// Artículos y estudios: portada (#actualidad) y página publicaciones/index.html.
// Visitantes ven solo lo publicado. Con sesión admin/editor aparecen los controles para agregar y editar.
import {config} from './config.js';
import {publicationKinds,publicationColumns,defaultCovers,coverUrl,fileUrl,formatDate,bodyMarkup,sortPublications,validatePublication,escapeHtml as h} from './publications-model.js';

const root=new URL('../',import.meta.url).href;
const pageUrl=slug=>root+'publicaciones/index.html'+(slug?'?p='+encodeURIComponent(slug):'');
const home=document.querySelector('[data-publications]'),page=document.querySelector('[data-publications-page]');
let rows=[],editor=false,editorModule,filter='todos';

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
 editorModule.openPublicationEditor(publication,{authors:authors(),onSaved:(saved,action)=>{
  if(action==='deleted'&&page&&new URLSearchParams(location.search).get('p')===saved.slug){location.href=pageUrl();return}
  refresh(action==='deleted'?'Publicación eliminada.':saved.published?'Publicación guardada y visible para los visitantes.':'Guardada como borrador: solo la ve el equipo.');
 }});
}

function card(p){
 const cover=coverUrl(p.cover_url,root)||root+defaultCovers[p.kind],kind=publicationKinds[p.kind];
 const label=p.kind==='estudio'?'VER ESTUDIO':'LEER ARTÍCULO';
 return `<article class="news-card publication-card${p.published?'':' is-draft'}" data-kind="${h(p.kind)}">
  <a class="publication-link" href="${h(pageUrl(p.slug))}">
   <div class="news-image"><img src="${h(cover)}" alt="${h(p.cover_alt)}" loading="lazy" decoding="async" width="900" height="600"></div>
   <div class="news-meta"><span>${h((kind+(p.area?' · '+p.area:'')).toUpperCase())}</span><span>${h(formatDate(p.published_on))}</span></div>
   <h3>${h(p.title)}</h3>${p.summary?`<p>${h(p.summary)}</p>`:''}
   <span class="publication-more">${label}${p.file_url?' · PDF':''} <span aria-hidden="true">→</span></span>
  </a>
  ${editor?`<div class="publication-admin">${p.published?'':'<span class="publication-badge">BORRADOR</span>'}${p.featured?'<span class="publication-badge is-featured">DESTACADA</span>':''}<button type="button" data-pub-edit="${h(p.id)}">EDITAR</button></div>`:''}
 </article>`;
}
function tools(where){
 return editor?`<div class="publications-tools" data-publications-tools><div><strong>Administración</strong><span>Agrega artículos y estudios. Los borradores solo los ve el equipo.</span></div><button type="button" data-pub-new="articulo">+ AGREGAR ARTÍCULO</button><button type="button" data-pub-new="estudio">+ AGREGAR ESTUDIO</button>${where==='home'?`<a href="${h(pageUrl())}">GESTIONAR TODAS</a>`:''}<p data-pub-status role="status" aria-live="polite"></p></div>`:'';
}
function bind(scope){
 scope.querySelectorAll('[data-pub-new]').forEach(b=>b.onclick=()=>edit({kind:b.dataset.pubNew}));
 scope.querySelectorAll('[data-pub-edit]').forEach(b=>b.onclick=()=>edit(rows.find(r=>r.id===b.dataset.pubEdit)));
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

function renderList(){
 const counts={todos:rows.length,articulo:rows.filter(r=>r.kind==='articulo').length,estudio:rows.filter(r=>r.kind==='estudio').length};
 const list=sortPublications(rows).filter(r=>filter==='todos'||r.kind===filter);
 document.title='Artículos y estudios | BKO Consultores';
 page.innerHTML=`<header class="publications-hero"><p class="eyebrow">BKO / ACTUALIDAD</p><h1>Artículos y <em>estudios.</em></h1><p>Análisis, perspectivas y documentos preparados por el equipo de BKO Consultores.</p></header>
 ${tools('page')}
 ${rows.length?`<div class="publications-filter" role="group" aria-label="Filtrar publicaciones">${[['todos','Todos'],['articulo','Artículos'],['estudio','Estudios']].map(([k,l])=>`<button type="button" data-filter="${k}" aria-pressed="${filter===k}">${l} <span>${counts[k]}</span></button>`).join('')}</div>`:''}
 ${list.length?`<div class="news-grid publications-grid">${list.map(card).join('')}</div>`:`<p class="publications-empty">${rows.length?'No hay publicaciones de este tipo todavía.':'Pronto publicaremos aquí nuestros artículos y estudios.'}</p>`}`;
 page.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;renderList()});
 bind(page);
}

function renderDetail(slug){
 const p=rows.find(r=>r.slug===slug);
 if(!p){document.title='Publicación no disponible | BKO';page.innerHTML=`<div class="publication-article"><p class="eyebrow">BKO / ACTUALIDAD</p><h1>Publicación no disponible</h1><p>Es posible que haya sido retirada o que el enlace no sea correcto.</p><a class="button button-gold" href="${h(pageUrl())}">VER TODAS LAS PUBLICACIONES</a></div>`;return}
 const cover=coverUrl(p.cover_url,root),file=fileUrl(p.file_url),kind=publicationKinds[p.kind];
 document.title=`${p.title} | BKO Consultores`;
 const description=document.querySelector('meta[name="description"]');if(description&&p.summary)description.content=p.summary;
 page.innerHTML=`${editor?`<div class="publications-tools" data-publications-tools><div><strong>Administración</strong><span>${p.published?'Publicada: visible para todos.':'Borrador: solo la ve el equipo.'}</span></div><button type="button" data-pub-edit="${h(p.id)}">EDITAR ESTA PUBLICACIÓN</button><p data-pub-status role="status" aria-live="polite"></p></div>`:''}
 <article class="publication-article">
  <a class="publication-back" href="${h(pageUrl())}">← TODOS LOS ARTÍCULOS Y ESTUDIOS</a>
  <p class="eyebrow">${h((kind+(p.area?' · '+p.area:'')).toUpperCase())}</p>
  <h1>${h(p.title)}</h1>
  <p class="publication-byline">${p.author?`<span>${h(p.author)}</span>`:''}<time datetime="${h(p.published_on)}">${h(formatDate(p.published_on))}</time></p>
  ${p.summary?`<p class="publication-lead">${h(p.summary)}</p>`:''}
  ${cover?`<figure class="publication-cover"><img src="${h(cover)}" alt="${h(p.cover_alt)}" decoding="async"></figure>`:''}
  <div class="publication-body">${bodyMarkup(p.body)}</div>
  ${file?`<div class="publication-file"><div><strong>${p.kind==='estudio'?'Documento del estudio':'Documento adjunto'}</strong><span>${h(p.file_name||'PDF')}</span></div><a class="button button-gold" href="${h(file)}" target="_blank" rel="noopener">ABRIR PDF <span aria-hidden="true">↗</span></a></div>`:''}
  <div class="publication-contact"><p>¿Quieres conversar sobre este tema con nuestro equipo?</p><a class="button profile-link" href="${h(root)}index.html#contacto">CONTACTAR A BKO</a></div>
 </article>`;
 bind(page);
}

function render(){
 if(home)renderHome();
 if(page){const slug=new URLSearchParams(location.search).get('p');slug?renderDetail(slug):renderList()}
}
async function refresh(message){
 try{await load()}catch{rows=[]}
 render();
 if(message)document.querySelectorAll('[data-pub-status]').forEach(el=>el.textContent=message);
}
if(home||page){
 if(page)page.setAttribute('aria-busy','true');
 await refresh();page?.removeAttribute('aria-busy');
 window.addEventListener('bko:session-change',()=>refresh());
 window.addEventListener('bko:publications-changed',()=>refresh());
 window.addEventListener('storage',e=>{if(e.key==='bko-admin-session')refresh()});
}
