// Pestaña «Artículos y estudios» del panel de Gestión. Usa el mismo formulario que la portada.
import {readSession} from './cms-session.js';
import {canEditPublications,loadAllPublications,openPublicationEditor} from './publications-editor.js';
import {publicationKinds,formatDate,sortPublications,escapeHtml as h} from './publications-model.js';

const button=document.createElement('button');button.type='button';button.className='button profile-link';button.textContent='ARTÍCULOS Y ESTUDIOS';button.hidden=true;
const section=document.createElement('section');section.id='publications-panel';section.hidden=true;
section.innerHTML=`<h2>Artículos y estudios</h2>
<p>Crea, edita y publica artículos y estudios. También puedes hacerlo directamente en la portada, en la sección Actualidad, con la sesión iniciada.</p>
<div class="admin-toolbar"><button type="button" class="button button-gold" data-pub-new="articulo">+ NUEVO ARTÍCULO</button><button type="button" class="button button-gold" data-pub-new="estudio">+ NUEVO ESTUDIO</button><a class="button profile-link" href="../index.html#actualidad" target="_blank" rel="noopener">VER EN LA PORTADA ↗</a><a class="button profile-link" href="../publicaciones/index.html" target="_blank" rel="noopener">VER PÁGINA DE PUBLICACIONES ↗</a></div>
<p data-pub-status role="status" aria-live="polite"></p>
<div class="admin-publications" data-pub-list></div>`;
document.querySelector('.admin-tabs').append(button);document.querySelector('#workspace').append(section);
let rows=[];
const out=text=>section.querySelector('[data-pub-status]').textContent=text;

function render(){
 const list=section.querySelector('[data-pub-list]');
 if(!rows.length){list.innerHTML='<p>Aún no hay publicaciones. Usa «Nuevo artículo» o «Nuevo estudio» para comenzar.</p>';return}
 list.innerHTML=`<table><thead><tr><th>Título</th><th>Tipo</th><th>Fecha</th><th>Estado</th><th><span class="visually-hidden">Acciones</span></th></tr></thead><tbody>${sortPublications(rows).map(p=>`<tr><td><strong>${h(p.title)}</strong>${p.author?`<small>${h(p.author)}</small>`:''}</td><td>${h(publicationKinds[p.kind])}${p.file_url?' · PDF':''}</td><td>${h(formatDate(p.published_on))}</td><td>${p.published?'Publicada':'Borrador'}${p.featured?' · Destacada':''}</td><td><button type="button" class="button profile-link" data-pub-edit="${h(p.id)}">EDITAR</button> <a class="button profile-link" href="../publicaciones/index.html?p=${encodeURIComponent(p.slug)}" target="_blank" rel="noopener">VER</a></td></tr>`).join('')}</tbody></table>`;
 list.querySelectorAll('[data-pub-edit]').forEach(b=>b.onclick=()=>edit(rows.find(r=>r.id===b.dataset.pubEdit)));
}
function edit(p){openPublicationEditor(p,{authors:rows.map(r=>r.author),onSaved:(saved,action)=>{load();out(action==='deleted'?'Publicación eliminada.':saved.published?'Guardada y publicada en la web.':'Guardada como borrador.')}})}
async function load(){try{rows=await loadAllPublications();render()}catch(error){out(error.message.startsWith('No se pudo')?'No se pudieron cargar las publicaciones. Verifica que la migración de publicaciones esté aplicada en Supabase.':error.message)}}
section.querySelectorAll('[data-pub-new]').forEach(b=>b.onclick=()=>edit({kind:b.dataset.pubNew}));
async function authorize(){button.hidden=!(await canEditPublications());if(button.hidden)section.hidden=true}
button.onclick=()=>{if(button.hidden)return;document.querySelectorAll('#workspace>section').forEach(el=>el.hidden=true);section.hidden=false;document.querySelectorAll('.admin-tabs button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));out('Cargando…');load().then(()=>{if(section.querySelector('[data-pub-status]').textContent==='Cargando…')out('')})};
document.querySelector('.admin-tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(b&&b!==button){section.hidden=true;button.setAttribute('aria-pressed','false')}});
window.addEventListener('bko:workspace-ready',authorize);
window.addEventListener('bko:session-change',()=>{if(!readSession())section.hidden=true;authorize()});
await authorize();
