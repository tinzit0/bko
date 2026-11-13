// Formulario único para crear, editar, publicar y eliminar artículos y estudios.
// Se usa desde la portada y la barra de edición (sesión iniciada) y desde el panel de Gestión.
// El contenido se escribe en un editor visual tipo Word (js/rich-text.js) y se guarda como texto seguro.
import {config} from './config.js';
import {cmsRequest,cmsRole,readSession,uploadCmsImage} from './cms-session.js';
import {publicationKinds,publicationColumns,defaultCovers,slugify,todayInChile,formatDate,coverUrl,fileUrl,validatePublication,wordCount,readingMinutes,excerpt,escapeHtml as h} from './publications-model.js';
import {serialize,toEditorHtml,pasteHtml,plainPasteHtml} from './rich-text.js';

const root=new URL('../',import.meta.url).href;
let dialog,form,rich,current,onDone,busy=false,focusBefore,initial='',draftTimer;
const textFields=['kind','title','summary','body','author','area','published_on','cover_url','cover_alt'];
const blank=kind=>({kind,title:'',summary:'',body:'',author:'',area:'',published_on:todayInChile(),cover_url:'',cover_alt:'',file_url:'',file_name:'',published:false,featured:false});
const status=(text,tone='')=>{const el=dialog.querySelector('[data-edit-status]');el.textContent=text;el.dataset.tone=tone};

export async function canEditPublications(){try{return ['admin','editor'].includes(await cmsRole())}catch{return false}}
export async function loadAllPublications(){return cmsRequest('bko_publications?select='+publicationColumns+'&order=featured.desc,published_on.desc,created_at.desc')}
/** Cambio rápido desde las tarjetas (publicar/ocultar, destacar) sin abrir el formulario. */
export async function quickUpdate(publication,changes){
 const rows=await cmsRequest(`bko_publications?id=eq.${publication.id}&revision=eq.${publication.revision}&select=${publicationColumns}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(changes)});
 if(rows?.length!==1)throw Error('Otra persona modificó esta publicación. Recarga la página e inténtalo de nuevo.');
 return rows[0];
}

// ——— Copia local mientras se escribe y aviso de cambios sin guardar ———
const draftKey=()=>'bko-pub-draft-'+(current?.id||'nueva');
const snapshot=()=>JSON.stringify([...textFields.map(n=>form.elements[n].value),form.elements.featured.checked,form.elements.file_remove.checked,form.elements.cover_upload.files.length,form.elements.file_upload.files.length]);
const dirty=()=>!!dialog&&snapshot()!==initial;
function readDraft(){try{const d=JSON.parse(localStorage.getItem(draftKey())||'null');return d&&(!current?.id||d.revision===current.revision)?d:null}catch{return null}}
function clearDraft(){clearTimeout(draftTimer);try{localStorage.removeItem(draftKey())}catch{}}
function storeDraft(){
 clearTimeout(draftTimer);draftTimer=setTimeout(()=>{if(!dialog?.open||!dirty())return;
  try{localStorage.setItem(draftKey(),JSON.stringify({revision:current?.revision,saved_at:Date.now(),...Object.fromEntries(textFields.map(n=>[n,form.elements[n].value]))}));dialog.querySelector('[data-pub-autosave]').textContent='Copia guardada en este equipo · '+new Date().toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})}catch{}},700);
}
function closeAsked(){if(busy)return;if(!dirty()||confirm('Tienes cambios sin guardar. ¿Cerrar de todas formas?\n\nEl texto queda guardado en este equipo y podrás recuperarlo al volver a abrir.'))dialog.close()}

// ——— Editor visual ———
function syncBody(){
 const md=serialize(rich);form.elements.body.value=md;
 const words=wordCount(md);rich.dataset.empty=String(!rich.textContent.trim()&&!rich.querySelector('img'));
 dialog.querySelector('[data-pub-count]').textContent=words?`${words} ${words===1?'palabra':'palabras'} · ${readingMinutes(md)} min de lectura`:'';
 if(md.length>60000)status('El contenido es demasiado largo (máximo 60.000 caracteres).','error');
}
function loadBody(md){rich.innerHTML=toEditorHtml(md,root);syncBody()}
function cmd(name,value=null){rich.focus();document.execCommand(name,false,value);syncBody();rich.dispatchEvent(new Event('input',{bubbles:true}));refreshToolbar()}
function currentBlock(){const sel=getSelection();let n=sel.rangeCount?sel.getRangeAt(0).startContainer:null;while(n&&n!==rich){if(n.nodeType===1&&/^(P|H2|H3|BLOCKQUOTE|LI|DIV)$/.test(n.tagName))return n.tagName;n=n.parentNode}return 'P'}
function insideEditor(){const sel=getSelection();return sel.rangeCount&&rich.contains(sel.getRangeAt(0).commonAncestorContainer)}
function refreshToolbar(){
 if(!dialog?.open||!insideEditor())return;const block=currentBlock();
 const state={bold:document.queryCommandState('bold'),italic:document.queryCommandState('italic'),h2:block==='H2',h3:block==='H3',quote:block==='BLOCKQUOTE',ul:document.queryCommandState('insertUnorderedList'),ol:document.queryCommandState('insertOrderedList')};
 dialog.querySelectorAll('[data-rt]').forEach(b=>{if(b.dataset.rt in state)b.setAttribute('aria-pressed',String(!!state[b.dataset.rt]))});
}
function toggleBlock(tag){cmd('formatBlock',currentBlock()===tag.toUpperCase()?'<p>':`<${tag}>`)}
let savedRange=null;
function rememberSelection(){const sel=getSelection();if(sel.rangeCount&&rich.contains(sel.getRangeAt(0).commonAncestorContainer))savedRange=sel.getRangeAt(0).cloneRange()}
function restoreSelection(){rich.focus();if(savedRange){const sel=getSelection();sel.removeAllRanges();sel.addRange(savedRange)}}
function addLink(){
 rememberSelection();
 const url=(prompt('Pega la dirección del enlace (https://…) o un correo electrónico:','https://')||'').trim();if(!url||url==='https://')return;
 const href=/^[^\s@/]+@[^\s@]+\.[^\s@]+$/.test(url)?'mailto:'+url:/^www\./i.test(url)?'https://'+url:url;
 if(!/^(https:\/\/|mailto:)[^\s()]+$/.test(href)){status('El enlace debe comenzar con https:// o ser un correo electrónico.','error');return}
 restoreSelection();
 if(getSelection().isCollapsed)cmd('insertHTML',`<a href="${h(href)}">${h(url)}</a>&nbsp;`);else cmd('createLink',href);
}
async function insertImages(files,range){
 const images=[...files].filter(f=>/^image\//.test(f.type));if(!images.length)return;
 if(range){rich.focus();const sel=getSelection();sel.removeAllRanges();sel.addRange(range)}else restoreSelection();
 busy=true;
 try{for(const [i,file] of images.entries()){
  status(`Cargando imagen ${images.length>1?`${i+1} de ${images.length}`:''}…`);
  const url=await uploadCmsImage(file);
  const alt=(prompt('Escribe un pie de foto o descripción breve (opcional):','')??'').replace(/[[\]\n()]/g,' ').trim();
  restoreSelection();cmd('insertHTML',`<figure class="publication-figure" contenteditable="false"><img src="${h(url)}" alt="${h(alt)}">${alt?`<figcaption>${h(alt)}</figcaption>`:''}</figure><p><br></p>`);
  rememberSelection();
 }status('Imagen insertada.','ok')}
 catch(error){status(error.message,'error')}finally{busy=false}
}

// ——— Vista de la tarjeta y portada ———
function coverSource(){const f=form.elements.cover_upload.files[0];return f?URL.createObjectURL(f):coverUrl(form.elements.cover_url.value.trim(),root)}
function renderCard(){
 const kind=form.elements.kind.value,cover=coverSource()||root+defaultCovers[kind],area=form.elements.area.value.trim();
 const summary=form.elements.summary.value.trim()||excerpt(form.elements.body.value,180);
 dialog.querySelector('[data-pub-card]').innerHTML=`<article class="news-card publication-card"><div class="news-image"><img src="${h(cover)}" alt=""></div>
  <div class="news-meta"><span>${h((publicationKinds[kind]+(area?' · '+area:'')).toUpperCase())}</span><span>${h(formatDate(form.elements.published_on.value))}</span></div>
  <h3>${h(form.elements.title.value.trim()||'Título de la publicación')}</h3>${summary?`<p>${h(summary)}</p>`:''}<span class="publication-more">${kind==='estudio'?'VER ESTUDIO':'LEER ARTÍCULO'} <span aria-hidden="true">→</span></span></article>`;
 dialog.querySelector('[data-pub-cover-note]').textContent=coverSource()?'':'Sin imagen propia: se usa la ilustración del tipo de publicación.';
}

function build(){
 if(dialog)return;
 dialog=document.createElement('dialog');dialog.className='bko-edit-dialog bko-publication-dialog';
 dialog.innerHTML=`<form novalidate>
 <header class="bko-pub-head"><h2 data-pub-heading>Nueva publicación</h2><p data-pub-state></p></header>
 <p class="bko-pub-restore" data-pub-restore hidden></p>
 <div class="bko-pub-kinds" role="radiogroup" aria-label="Tipo de publicación">${Object.entries(publicationKinds).map(([v,l])=>`<label><input type="radio" name="kind" value="${v}"><span><strong>${l}</strong><small>${v==='estudio'?'Documento más extenso, idealmente con PDF':'Texto breve de opinión o actualidad'}</small></span></label>`).join('')}</div>
 <label class="bko-pub-title">Título<input name="title" maxlength="220" required placeholder="Ej.: Lo que cambia con la nueva ley de 40 horas"></label>
 <section class="bko-pub-body" aria-labelledby="bko-pub-body-label">
  <span class="bko-pub-label" id="bko-pub-body-label">Contenido</span>
  <div class="bko-pub-toolbar" role="toolbar" aria-label="Formato del texto">
   <span class="bko-rt-group"><button type="button" data-rt="p" title="Texto normal">Texto</button><button type="button" data-rt="h2" aria-pressed="false" title="Subtítulo">Subtítulo</button><button type="button" data-rt="h3" aria-pressed="false" title="Subtítulo menor">Subtítulo menor</button></span>
   <span class="bko-rt-group"><button type="button" data-rt="bold" aria-pressed="false" title="Negrita (Ctrl+B)"><b>N</b></button><button type="button" data-rt="italic" aria-pressed="false" title="Cursiva (Ctrl+I)"><i>C</i></button></span>
   <span class="bko-rt-group"><button type="button" data-rt="ul" aria-pressed="false" title="Lista con viñetas">• Lista</button><button type="button" data-rt="ol" aria-pressed="false" title="Lista numerada">1. Lista</button><button type="button" data-rt="quote" aria-pressed="false" title="Cita destacada">“ Cita</button></span>
   <span class="bko-rt-group"><button type="button" data-rt="link" title="Agregar enlace">Enlace</button><button type="button" data-rt="unlink" title="Quitar enlace">Quitar enlace</button><button type="button" data-rt="image" title="Insertar imagen">Imagen</button></span>
   <span class="bko-rt-group"><button type="button" data-rt="undo" title="Deshacer (Ctrl+Z)" aria-label="Deshacer">↶</button><button type="button" data-rt="redo" title="Rehacer (Ctrl+Y)" aria-label="Rehacer">↷</button></span>
  </div>
  <div class="bko-pub-rich publication-body" contenteditable="true" role="textbox" aria-multiline="true" aria-labelledby="bko-pub-body-label" data-placeholder="Escribe o pega aquí el texto. Puedes copiarlo desde Word o Google Docs: se mantienen títulos, negritas, listas y enlaces. Arrastra fotos para insertarlas." spellcheck="true" lang="es"></div>
  <textarea name="body" hidden></textarea>
  <input type="file" accept="image/jpeg,image/png,image/webp" multiple data-pub-inline-image hidden>
  <p class="bko-pub-meta"><span data-pub-count></span><span data-pub-autosave></span></p>
 </section>
 <label>Resumen <small>Aparece en la tarjeta de la portada. Si lo dejas vacío se usa el comienzo del texto.</small><textarea name="summary" maxlength="600" rows="3"></textarea></label>
 <p class="bko-pub-inline-actions"><button type="button" data-pub-excerpt>USAR EL COMIENZO DEL TEXTO COMO RESUMEN</button></p>
 <div class="bko-pub-grid">
  <label>Autor o autora<input name="author" maxlength="200" list="bko-pub-authors" placeholder="Elige o escribe un nombre"></label>
  <label>Área o tema<input name="area" maxlength="120" list="bko-pub-areas" placeholder="Ej.: Derecho Laboral"></label>
 </div>
 <datalist id="bko-pub-authors"></datalist><datalist id="bko-pub-areas"></datalist>
 <div class="bko-pub-grid"><label>Fecha de publicación<input name="published_on" type="date" required></label><label class="bko-pub-check bko-pub-feature"><input name="featured" type="checkbox"> <span><strong>Destacar en la portada</strong><small>Aparece primero</small></span></label></div>
 <fieldset class="bko-pub-cover-set"><legend>Imagen de portada y vista de la tarjeta</legend>
  <div class="bko-pub-cover-layout">
   <div>
    <label class="bko-pub-drop" data-pub-drop><input name="cover_upload" type="file" accept="image/jpeg,image/png,image/webp"><strong>Arrastra una imagen aquí</strong><span>o toca para elegirla (JPEG, PNG o WebP, hasta 8 MB)</span></label>
    <p class="bko-pub-note" data-pub-cover-note></p>
    <label>Descripción de la imagen <small>(para personas con discapacidad visual)</small><input name="cover_alt" maxlength="500"></label>
    <details class="bko-pub-advanced"><summary>Usar una dirección de imagen</summary><label>Dirección<input name="cover_url" maxlength="2000" placeholder="https://… o assets/…"></label><button type="button" data-pub-cover-clear>QUITAR IMAGEN</button></details>
   </div>
   <div class="bko-pub-card-preview"><span class="bko-pub-note">Así se verá en la portada</span><div data-pub-card></div></div>
  </div>
 </fieldset>
 <fieldset><legend>Documento PDF <small>(opcional, recomendado para estudios)</small></legend>
  <p data-pub-file-current></p>
  <label class="bko-pub-drop bko-pub-drop-small" data-pub-drop><input name="file_upload" type="file" accept="application/pdf"><strong>Arrastra el PDF aquí</strong><span data-pub-file-chosen>o toca para elegirlo (hasta 25 MB)</span></label>
  <label class="bko-pub-check" data-pub-file-remove hidden><input name="file_remove" type="checkbox"> Quitar el documento actual</label>
 </fieldset>
 <p data-edit-status role="status" aria-live="polite"></p>
 <div class="bko-pub-actions">
  <button type="submit" data-action="publish" class="bko-pub-primary">PUBLICAR</button>
  <button type="submit" data-action="draft">GUARDAR BORRADOR</button>
  <button type="button" data-cancel>CANCELAR</button>
  <button type="button" data-pub-delete hidden>ELIMINAR</button>
 </div>
 </form>`;
 document.body.append(dialog);
 form=dialog.querySelector('form');rich=dialog.querySelector('.bko-pub-rich');
 try{document.execCommand('defaultParagraphSeparator',false,'p')}catch{}
 dialog.querySelector('[data-cancel]').onclick=closeAsked;
 dialog.addEventListener('cancel',e=>{e.preventDefault();closeAsked()});
 dialog.addEventListener('close',()=>focusBefore?.focus?.());
 // Barra de formato: mousedown evita perder la selección del texto.
 dialog.querySelectorAll('[data-rt]').forEach(b=>{b.addEventListener('mousedown',e=>e.preventDefault());b.addEventListener('click',()=>{
  const a=b.dataset.rt;
  if(a==='p')cmd('formatBlock','<p>');else if(a==='h2'||a==='h3')toggleBlock(a);else if(a==='quote')toggleBlock('blockquote');
  else if(a==='bold'||a==='italic'||a==='undo'||a==='redo'||a==='unlink')cmd(a);
  else if(a==='ul')cmd('insertUnorderedList');else if(a==='ol')cmd('insertOrderedList');
  else if(a==='link')addLink();else if(a==='image'){rememberSelection();dialog.querySelector('[data-pub-inline-image]').click()}
 })});
 dialog.querySelector('[data-pub-inline-image]').addEventListener('change',e=>{insertImages(e.target.files);e.target.value=''});
 rich.addEventListener('input',()=>{syncBody();renderCard()});
 rich.addEventListener('keyup',refreshToolbar);rich.addEventListener('mouseup',refreshToolbar);
 rich.addEventListener('blur',rememberSelection);
 rich.addEventListener('paste',e=>{
  const cd=e.clipboardData;if(!cd)return;e.preventDefault();
  const files=[...cd.files].filter(f=>/^image\//.test(f.type));if(files.length){insertImages(files);return}
  const html=cd.getData('text/html'),text=cd.getData('text/plain');
  cmd('insertHTML',html?pasteHtml(html,root):plainPasteHtml(text));
 });
 rich.addEventListener('dragover',e=>{if([...e.dataTransfer.types].includes('Files')){e.preventDefault();rich.classList.add('is-drop')}});
 rich.addEventListener('dragleave',()=>rich.classList.remove('is-drop'));
 rich.addEventListener('drop',e=>{
  rich.classList.remove('is-drop');if(!e.dataTransfer.files.length)return;e.preventDefault();
  const range=document.caretRangeFromPoint?.(e.clientX,e.clientY)||(()=>{const p=document.caretPositionFromPoint?.(e.clientX,e.clientY);if(!p)return null;const r=document.createRange();r.setStart(p.offsetNode,p.offset);return r})();
  insertImages(e.dataTransfer.files,range);
 });
 rich.addEventListener('click',e=>{if(e.target.closest('a'))e.preventDefault()});
 document.addEventListener('selectionchange',refreshToolbar);
 // Zonas para soltar archivos (portada y PDF)
 dialog.querySelectorAll('[data-pub-drop]').forEach(zone=>{
  const input=zone.querySelector('input');
  zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('is-drop')});
  zone.addEventListener('dragleave',()=>zone.classList.remove('is-drop'));
  zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('is-drop');const f=e.dataTransfer.files[0];if(!f)return;const dt=new DataTransfer();dt.items.add(f);input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}))});
 });
 form.elements.cover_upload.addEventListener('change',()=>{const f=form.elements.cover_upload.files[0];zone(form.elements.cover_upload,f?`Imagen elegida: ${f.name}`:null);renderCard()});
 form.elements.file_upload.addEventListener('change',()=>{const f=form.elements.file_upload.files[0];dialog.querySelector('[data-pub-file-chosen]').textContent=f?`PDF elegido: ${f.name}`:'o toca para elegirlo (hasta 25 MB)'});
 dialog.querySelector('[data-pub-cover-clear]').onclick=()=>{form.elements.cover_url.value='';form.elements.cover_upload.value='';zone(form.elements.cover_upload,null);renderCard();storeDraft()};
 dialog.querySelector('[data-pub-excerpt]').onclick=()=>{const t=excerpt(form.elements.body.value);if(!t){status('Primero escribe el contenido.','error');return}form.elements.summary.value=t;form.elements.summary.dispatchEvent(new Event('input',{bubbles:true}))};
 form.addEventListener('input',()=>{storeDraft();renderCard()});
 form.addEventListener('change',()=>{storeDraft();renderCard();headings()});
 form.onsubmit=save;
 dialog.querySelector('[data-pub-delete]').onclick=remove;
}
function zone(input,text){const span=input.closest('[data-pub-drop]').querySelector('span');span.textContent=text||'o toca para elegirla (JPEG, PNG o WebP, hasta 8 MB)'}
function headings(){
 const kind=publicationKinds[form.elements.kind.value].toLowerCase();
 dialog.querySelector('[data-pub-heading]').textContent=current.id?`Editar ${kind}`:`Nuevo ${kind}`;
 dialog.querySelector('[data-pub-state]').innerHTML=current.id?(current.published?'<span class="is-live">● Publicada: visible para todos</span>':'<span>○ Borrador: solo la ve el equipo</span>'):'<span>○ Aún no guardada</span>';
 const publish=dialog.querySelector('[data-action=publish]'),draft=dialog.querySelector('[data-action=draft]');
 publish.textContent=current.published?'GUARDAR CAMBIOS':'PUBLICAR';
 draft.textContent=current.published?'PASAR A BORRADOR':'GUARDAR BORRADOR';
}

/** Abre el formulario. `publication` puede ser un registro existente o {kind:'articulo'|'estudio'} para uno nuevo. */
export function openPublicationEditor(publication={kind:'articulo'},{onSaved,authors=[],areas=[]}={}){
 build();focusBefore=document.activeElement;onDone=onSaved;
 current=publication.id?publication:{...blank(publication.kind||'articulo')};
 form.reset();
 for(const name of textFields)if(name!=='kind')form.elements[name].value=current[name]??'';
 form.elements.kind.value=current.kind;
 form.elements.featured.checked=!!current.featured;
 dialog.querySelector('#bko-pub-authors').innerHTML=[...new Set(authors.filter(Boolean))].map(a=>`<option value="${h(a)}">`).join('');
 dialog.querySelector('#bko-pub-areas').innerHTML=[...new Set(['Corporativo','Derecho Laboral','Derecho de Familia','Inmobiliario','Minería','Marítimo y Naviero','Seguros','CAUCE',...areas].filter(Boolean))].map(a=>`<option value="${h(a)}">`).join('');
 const file=fileUrl(current.file_url);
 dialog.querySelector('[data-pub-file-current]').innerHTML=file?`Documento actual: <a href="${h(file)}" target="_blank" rel="noopener">${h(current.file_name||'PDF')}</a>`:'Sin documento adjunto.';
 dialog.querySelector('[data-pub-file-remove]').hidden=!file;
 dialog.querySelector('[data-pub-file-chosen]').textContent='o toca para elegirlo (hasta 25 MB)';zone(form.elements.cover_upload,null);
 dialog.querySelector('[data-pub-delete]').hidden=!current.id;
 dialog.querySelector('[data-pub-autosave]').textContent='';
 loadBody(current.body||'');headings();renderCard();status('');initial=snapshot();
 const saved=readDraft(),restore=dialog.querySelector('[data-pub-restore]');restore.hidden=!saved;
 if(saved){
  restore.innerHTML=`<span>Tienes un texto sin guardar del ${h(new Date(saved.saved_at).toLocaleString('es-CL',{dateStyle:'short',timeStyle:'short'}))}.</span> <button type="button" data-restore-yes>RECUPERAR</button> <button type="button" data-restore-no>DESCARTAR</button>`;
  restore.querySelector('[data-restore-yes]').onclick=()=>{for(const n of textFields)if(typeof saved[n]==='string')form.elements[n].value=saved[n];loadBody(saved.body||'');headings();renderCard();restore.hidden=true;status('Texto recuperado. Recuerda guardar.','ok')};
  restore.querySelector('[data-restore-no]').onclick=()=>{clearDraft();restore.hidden=true};
 }
 dialog.showModal();(current.id?rich:form.elements.title).focus();
}

async function uploadPdf(file){
 if(file.type!=='application/pdf'||file.size>25*1024*1024)throw Error('El documento debe ser un PDF de hasta 25 MB.');
 await cmsRole();const s=readSession();
 const safe=slugify(file.name.replace(/\.pdf$/i,''))||'documento',path=crypto.randomUUID().slice(0,8)+'-'+safe+'.pdf';
 const r=await fetch(config.supabaseUrl+'/storage/v1/object/bko-publications/'+path,{method:'POST',headers:{apikey:config.supabasePublishableKey,Authorization:`Bearer ${s.access_token}`,'Content-Type':'application/pdf'},body:file,signal:AbortSignal.timeout(120000)});
 if(!r.ok)throw Error('No se pudo cargar el PDF. Revisa el tamaño del archivo y tu conexión.');
 return config.supabaseUrl+'/storage/v1/object/public/bko-publications/'+path;
}
async function uniqueSlug(title){
 const base=slugify(title)||'publicacion';
 const rows=await cmsRequest('bko_publications?select=slug&slug=like.'+encodeURIComponent(base+'*'));
 const taken=new Set(rows.map(r=>r.slug));if(!taken.has(base))return base;
 for(let i=2;;i++)if(!taken.has(base+'-'+i))return base+'-'+i;
}

async function save(event){
 event.preventDefault();if(busy)return;const buttons=form.querySelectorAll('button');
 const publish=(event.submitter?.dataset.action||'publish')==='publish';
 syncBody();busy=true;buttons.forEach(b=>b.disabled=true);
 try{
  const v=name=>form.elements[name].value.trim();
  const draft={...current,kind:form.elements.kind.value,title:v('title'),summary:v('summary'),body:form.elements.body.value.replace(/\s+$/,''),author:v('author'),area:v('area'),published_on:form.elements.published_on.value||todayInChile(),cover_url:v('cover_url'),cover_alt:v('cover_alt'),featured:form.elements.featured.checked,published:publish};
  if(draft.title.length<3){form.elements.title.focus();throw Error('Escribe un título de al menos 3 caracteres.')}
  if(draft.published&&!draft.summary&&!draft.body&&!draft.file_url&&!form.elements.file_upload.files[0])throw Error('Para publicar escribe el contenido o adjunta un PDF.');
  if(draft.body.length>60000)throw Error('El contenido es demasiado largo (máximo 60.000 caracteres).');
  if(form.elements.cover_upload.files[0]){status('Cargando imagen de portada…');draft.cover_url=await uploadCmsImage(form.elements.cover_upload.files[0])}
  if(form.elements.file_remove.checked){draft.file_url='';draft.file_name=''}
  if(form.elements.file_upload.files[0]){status('Cargando PDF…');const f=form.elements.file_upload.files[0];draft.file_url=await uploadPdf(f);draft.file_name=f.name.slice(0,200)}
  if(!draft.id)draft.slug=await uniqueSlug(draft.title);
  if(!validatePublication(draft))throw Error('Revisa los campos: la imagen debe ser una dirección https:// y los textos no deben superar el largo permitido.');
  status(publish?'Publicando…':'Guardando…');
  const fields=['kind','title','summary','body','author','area','published_on','cover_url','cover_alt','file_url','file_name','published','featured'],payload=Object.fromEntries(fields.map(k=>[k,draft[k]]));
  const rows=draft.id
   ?await cmsRequest(`bko_publications?id=eq.${draft.id}&revision=eq.${draft.revision}&select=${publicationColumns}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)})
   :await cmsRequest(`bko_publications?select=${publicationColumns}`,{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({...payload,slug:draft.slug})});
  if(rows?.length!==1)throw Error('Otra persona modificó esta publicación. Recarga la página antes de guardar.');
  clearDraft();initial=snapshot();dialog.close();onDone?.(rows[0],draft.id?'updated':'created');
 }catch(error){status(error.message,'error')}finally{busy=false;buttons.forEach(b=>b.disabled=false)}
}
async function remove(){
 if(busy||!current?.id)return;
 if(!confirm(`¿Eliminar definitivamente «${current.title}»?\n\nEsta acción no se puede deshacer. Si solo quieres ocultarla, usa «Pasar a borrador».`))return;
 busy=true;try{await cmsRequest(`bko_publications?id=eq.${current.id}`,{method:'DELETE'});clearDraft();initial=snapshot();dialog.close();onDone?.(current,'deleted')}catch(error){status(error.message,'error')}finally{busy=false}
}
