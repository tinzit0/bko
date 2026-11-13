// Formulario único para crear, editar, publicar y eliminar artículos y estudios.
// Se usa desde la portada (sesión iniciada) y desde el panel de Gestión.
import {config} from './config.js';
import {cmsRequest,cmsRole,readSession,uploadCmsImage} from './cms-session.js';
import {publicationKinds,publicationColumns,slugify,todayInChile,coverUrl,fileUrl,validatePublication,bodyMarkup,escapeHtml as h} from './publications-model.js';

let dialog,current,onDone,busy=false,focusBefore,initial='',draftTimer;
const textFields=['kind','title','summary','body','author','area','published_on','cover_url','cover_alt'];
const draftKey=()=>'bko-pub-draft-'+(current?.id||'nueva');
const snapshot=form=>JSON.stringify([...textFields.map(n=>form.elements[n].value),form.elements.featured.checked,form.elements.published.checked,form.elements.file_remove.checked,form.elements.cover_upload.files.length,form.elements.file_upload.files.length]);
const dirty=()=>!!dialog&&snapshot(dialog.querySelector('form'))!==initial;
// Copia local del texto mientras se escribe, para no perderlo si se cierra la ventana o falla la conexión.
function readDraft(){try{const d=JSON.parse(localStorage.getItem(draftKey())||'null');return d&&(!current?.id||d.revision===current.revision)?d:null}catch{return null}}
function clearDraft(){clearTimeout(draftTimer);try{localStorage.removeItem(draftKey())}catch{}}
function storeDraft(){
 clearTimeout(draftTimer);draftTimer=setTimeout(()=>{if(!dialog?.open||!dirty())return;const form=dialog.querySelector('form');
  try{localStorage.setItem(draftKey(),JSON.stringify({revision:current?.revision,saved_at:Date.now(),...Object.fromEntries(textFields.map(n=>[n,form.elements[n].value]))}))}catch{}},600);
}
function closeAsked(){if(busy)return;if(!dirty()||confirm('Tienes cambios sin guardar. ¿Cerrar de todas formas? El texto queda guardado en este navegador y podrás recuperarlo al volver a abrir.'))dialog.close()}

// Barra de formato: aplica las marcas sobre el texto seleccionado.
function surround(area,before,after,sample){
 const {selectionStart:a,selectionEnd:b,value}=area,sel=value.slice(a,b)||sample;
 area.setRangeText(before+sel+after,a,b,'end');area.setSelectionRange(a+before.length,a+before.length+sel.length);
}
function block(area,make,sample){
 const {selectionStart:a,selectionEnd:b,value}=area;
 const start=value.lastIndexOf('\n',a-1)+1,endIdx=value.indexOf('\n',b),end=endIdx<0?value.length:endIdx;
 const lines=value.slice(start,end).split('\n').filter(l=>l.trim());
 const text=(lines.length?lines:[sample]).map((l,i)=>make(l.replace(/^(#{2,3} |[-•] |\d+[.)] |> ?)/,''),i)).join('\n');
 const head=value.slice(0,start),tail=value.slice(end);
 const pre=!head||/\n\s*\n$/.test(head)?'':head.endsWith('\n')?'\n':'\n\n';
 const post=!tail||/^\n\s*\n/.test(tail)?'':'\n';
 area.setRangeText(pre+text+post,start,end,'end');area.setSelectionRange(start+pre.length,start+pre.length+text.length);
}
function insertBlock(area,text){const a=area.selectionEnd,head=area.value.slice(0,a),pre=!head||/\n\s*\n$/.test(head)?'':head.endsWith('\n')?'\n':'\n\n';area.setRangeText(pre+text+'\n\n',a,a,'end')}
function format(kind){
 const area=dialog.querySelector('form').elements.body;
 if(area.hidden)dialog.querySelector('[data-pub-preview-toggle]').click();
 area.focus();
 if(kind==='bold')surround(area,'**','**','texto en negrita');
 else if(kind==='italic')surround(area,'*','*','texto en cursiva');
 else if(kind==='h2')block(area,l=>'## '+l,'Subtítulo');
 else if(kind==='h3')block(area,l=>'### '+l,'Subtítulo menor');
 else if(kind==='ul')block(area,l=>'- '+l,'Elemento de la lista');
 else if(kind==='ol')block(area,(l,i)=>(i+1)+'. '+l,'Primer elemento');
 else if(kind==='quote')block(area,l=>'> '+l,'Texto de la cita');
 else if(kind==='link'){
  const url=(prompt('Dirección del enlace (https://… o un correo):','https://')||'').trim();if(!url||url==='https://')return;
  const href=/^[^\s@/]+@[^\s@]+\.[^\s@]+$/.test(url)?'mailto:'+url:url;
  if(!/^(https:\/\/|mailto:)[^\s()]+$/.test(href)){status('El enlace debe comenzar con https:// o ser un correo electrónico.');return}
  surround(area,'[','](' + href + ')','texto del enlace');
 }
 else if(kind==='image'){dialog.querySelector('[data-pub-inline-image]').click();return}
 area.dispatchEvent(new Event('input',{bubbles:true}));
}
async function inlineImage(file){
 if(!file)return;const area=dialog.querySelector('form').elements.body;
 const alt=(prompt('Descripción breve de la imagen (se muestra como pie de foto; puede quedar vacía):','')??'').replace(/[[\]\n()]/g,' ').trim();
 busy=true;try{status('Cargando imagen…');const url=await uploadCmsImage(file);insertBlock(area,'!['+alt+']('+url+')');status('Imagen insertada en el texto.');area.dispatchEvent(new Event('input',{bubbles:true}))}
 catch(error){status(error.message)}finally{busy=false}
}
function renderPreview(){
 const box=dialog.querySelector('[data-pub-preview]');if(box.hidden)return;
 const html=bodyMarkup(dialog.querySelector('form').elements.body.value,new URL('../',import.meta.url).href);
 box.innerHTML=html||'<p class="bko-pub-empty">Todavía no hay contenido.</p>';
}
const blank=kind=>({kind,title:'',summary:'',body:'',author:'',area:'',published_on:todayInChile(),cover_url:'',cover_alt:'',file_url:'',file_name:'',published:false,featured:false});

export async function canEditPublications(){try{return ['admin','editor'].includes(await cmsRole())}catch{return false}}
export async function loadAllPublications(){return cmsRequest('bko_publications?select='+publicationColumns+'&order=featured.desc,published_on.desc,created_at.desc')}

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

function build(){
 if(dialog)return;
 dialog=document.createElement('dialog');dialog.className='bko-edit-dialog bko-publication-dialog';
 dialog.innerHTML=`<form novalidate><h2 data-pub-heading>Nueva publicación</h2>
 <p class="bko-pub-restore" data-pub-restore hidden></p>
 <div class="bko-pub-grid">
  <label>Tipo<select name="kind">${Object.entries(publicationKinds).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label>
  <label>Fecha de publicación<input name="published_on" type="date" required></label>
 </div>
 <label>Título<input name="title" maxlength="220" required></label>
 <label>Resumen <small>(aparece en la tarjeta de la portada)</small><textarea name="summary" maxlength="600" rows="3"></textarea></label>
 <div class="bko-pub-body">
  <span class="bko-pub-label" id="bko-pub-body-label">Contenido</span>
  <div class="bko-pub-toolbar" role="toolbar" aria-label="Formato del contenido">
   <button type="button" data-fmt="bold" title="Negrita"><b>N</b></button><button type="button" data-fmt="italic" title="Cursiva"><i>C</i></button>
   <button type="button" data-fmt="h2" title="Subtítulo">Subtítulo</button><button type="button" data-fmt="h3" title="Subtítulo menor">Subtítulo menor</button>
   <button type="button" data-fmt="ul" title="Lista con viñetas">• Lista</button><button type="button" data-fmt="ol" title="Lista numerada">1. Lista</button>
   <button type="button" data-fmt="quote" title="Cita destacada">“ Cita</button><button type="button" data-fmt="link" title="Enlace">Enlace</button>
   <button type="button" data-fmt="image" title="Insertar imagen en el texto">Imagen</button>
   <button type="button" data-pub-preview-toggle aria-pressed="false">VISTA PREVIA</button>
  </div>
  <input type="file" accept="image/jpeg,image/png,image/webp" data-pub-inline-image hidden>
  <textarea name="body" maxlength="60000" rows="14" aria-labelledby="bko-pub-body-label" placeholder="Escribe aquí el artículo. Deja una línea vacía entre párrafos."></textarea>
  <div class="bko-pub-preview publication-body" data-pub-preview hidden></div>
  <details class="bko-pub-help"><summary>Cómo dar formato al texto</summary><ul>
   <li>Deja una <b>línea vacía</b> entre párrafos.</li>
   <li><code>**texto**</code> se ve en <b>negrita</b> y <code>*texto*</code> en <i>cursiva</i>.</li>
   <li><code>## Título</code> crea un subtítulo y <code>### Título</code>, uno menor.</li>
   <li><code>- elemento</code> crea una lista con viñetas y <code>1. elemento</code>, una numerada.</li>
   <li><code>&gt; texto</code> crea una cita destacada.</li>
   <li><code>[texto](https://…)</code> crea un enlace. El botón <b>Imagen</b> sube una foto y la inserta en el texto.</li>
  </ul><p>Los botones de arriba aplican el formato al texto seleccionado. Usa <b>Vista previa</b> para ver cómo quedará.</p></details>
 </div>
 <div class="bko-pub-grid">
  <label>Autor o autora<input name="author" maxlength="200" list="bko-pub-authors"></label>
  <label>Área o tema<input name="area" maxlength="120" placeholder="Ej.: Derecho Laboral"></label>
 </div>
 <datalist id="bko-pub-authors"></datalist>
 <fieldset><legend>Imagen de portada</legend>
  <div class="bko-pub-cover" data-pub-cover-preview></div>
  <label>Cargar imagen (JPEG, PNG o WebP, hasta 8 MB)<input name="cover_upload" type="file" accept="image/jpeg,image/png,image/webp"></label>
  <label>o dirección de la imagen<input name="cover_url" maxlength="2000" placeholder="https://… o assets/…"></label>
  <label>Descripción de la imagen<input name="cover_alt" maxlength="500"></label>
 </fieldset>
 <fieldset><legend>Documento PDF <small>(opcional, recomendado para estudios)</small></legend>
  <p data-pub-file-current></p>
  <label>Cargar PDF (hasta 25 MB)<input name="file_upload" type="file" accept="application/pdf"></label>
  <label class="bko-pub-check" data-pub-file-remove hidden><input name="file_remove" type="checkbox"> Quitar el documento actual</label>
 </fieldset>
 <label class="bko-pub-check"><input name="featured" type="checkbox"> Destacar en la portada</label>
 <label class="bko-pub-check"><input name="published" type="checkbox"> Publicada (visible para todos los visitantes)</label>
 <p data-edit-status role="status" aria-live="polite"></p>
 <div><button type="submit">GUARDAR</button><button type="button" data-pub-delete hidden>ELIMINAR</button><button type="button" data-cancel>CANCELAR</button></div>
 </form>`;
 document.body.append(dialog);
 const form=dialog.querySelector('form');
 dialog.querySelector('[data-cancel]').onclick=closeAsked;
 dialog.addEventListener('cancel',e=>{e.preventDefault();closeAsked()});
 dialog.querySelectorAll('[data-fmt]').forEach(b=>b.addEventListener('click',()=>format(b.dataset.fmt)));
 dialog.querySelector('[data-pub-inline-image]').addEventListener('change',e=>{inlineImage(e.target.files[0]);e.target.value=''});
 dialog.querySelector('[data-pub-preview-toggle]').addEventListener('click',e=>{const box=dialog.querySelector('[data-pub-preview]'),on=box.hidden;box.hidden=!on;form.elements.body.hidden=on;e.currentTarget.setAttribute('aria-pressed',String(on));e.currentTarget.textContent=on?'VOLVER A EDITAR':'VISTA PREVIA';renderPreview()});
 form.addEventListener('input',()=>{storeDraft();renderPreview()});
 form.addEventListener('change',storeDraft);
 form.elements.body.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if((e.ctrlKey||e.metaKey)&&!e.altKey&&(k==='b'||k==='i')){e.preventDefault();format(k==='b'?'bold':'italic')}});
 dialog.addEventListener('close',()=>focusBefore?.focus?.());
 form.elements.cover_url.addEventListener('input',preview);
 form.elements.kind.addEventListener('change',()=>{if(!current?.id)dialog.querySelector('[data-pub-heading]').textContent='Nuevo '+publicationKinds[form.elements.kind.value].toLowerCase()});
 form.elements.cover_upload.addEventListener('change',()=>{const f=form.elements.cover_upload.files[0];if(f)preview(URL.createObjectURL(f))});
 form.onsubmit=save;
 dialog.querySelector('[data-pub-delete]').onclick=remove;
}
function preview(src){
 const form=dialog.querySelector('form'),url=typeof src==='string'?src:coverUrl(form.elements.cover_url.value.trim(),new URL('../',import.meta.url).href);
 dialog.querySelector('[data-pub-cover-preview]').innerHTML=url?`<img src="${h(url)}" alt="">`:'<span>Sin imagen: se usará la ilustración del tipo de publicación.</span>';
}
const status=text=>dialog.querySelector('[data-edit-status]').textContent=text;

/** Abre el formulario. `publication` puede ser un registro existente o {kind:'articulo'|'estudio'} para uno nuevo. */
export function openPublicationEditor(publication={kind:'articulo'},{onSaved,authors=[]}={}){
 build();focusBefore=document.activeElement;onDone=onSaved;
 current=publication.id?publication:{...blank(publication.kind||'articulo')};
 const form=dialog.querySelector('form');form.reset();
 for(const name of['kind','title','summary','body','author','area','published_on','cover_url','cover_alt'])form.elements[name].value=current[name]??'';
 form.elements.featured.checked=!!current.featured;form.elements.published.checked=!!current.published;
 dialog.querySelector('#bko-pub-authors').innerHTML=[...new Set(authors)].map(a=>`<option value="${h(a)}">`).join('');
 dialog.querySelector('[data-pub-heading]').textContent=current.id?'Editar publicación':`Nuevo ${publicationKinds[current.kind].toLowerCase()}`;
 const file=fileUrl(current.file_url);
 dialog.querySelector('[data-pub-file-current]').innerHTML=file?`Documento actual: <a href="${h(file)}" target="_blank" rel="noopener">${h(current.file_name||'PDF')}</a>`:'Sin documento adjunto.';
 dialog.querySelector('[data-pub-file-remove]').hidden=!file;
 dialog.querySelector('[data-pub-delete]').hidden=!current.id;
 const box=dialog.querySelector('[data-pub-preview]'),toggle=dialog.querySelector('[data-pub-preview-toggle]');box.hidden=true;form.elements.body.hidden=false;toggle.textContent='VISTA PREVIA';toggle.setAttribute('aria-pressed','false');
 preview();status('');initial=snapshot(form);
 const saved=readDraft(),restore=dialog.querySelector('[data-pub-restore]');restore.hidden=!saved;
 if(saved){
  restore.innerHTML=`<span>Hay un texto sin guardar del ${h(new Date(saved.saved_at).toLocaleString('es-CL',{dateStyle:'short',timeStyle:'short'}))}.</span> <button type="button" data-restore-yes>RECUPERAR</button> <button type="button" data-restore-no>DESCARTAR</button>`;
  restore.querySelector('[data-restore-yes]').onclick=()=>{for(const n of textFields)if(typeof saved[n]==='string')form.elements[n].value=saved[n];preview();restore.hidden=true;status('Texto recuperado. Recuerda guardar.')};
  restore.querySelector('[data-restore-no]').onclick=()=>{clearDraft();restore.hidden=true};
 }
 dialog.showModal();form.elements.title.focus();
}

async function save(event){
 event.preventDefault();if(busy)return;const form=event.target,buttons=form.querySelectorAll('button');
 busy=true;buttons.forEach(b=>b.disabled=true);
 try{
  const v=name=>form.elements[name].value.trim();
  const draft={...current,kind:form.elements.kind.value,title:v('title'),summary:v('summary'),body:form.elements.body.value.replace(/\s+$/,''),author:v('author'),area:v('area'),published_on:form.elements.published_on.value||todayInChile(),cover_url:v('cover_url'),cover_alt:v('cover_alt'),featured:form.elements.featured.checked,published:form.elements.published.checked};
  if(draft.title.length<3)throw Error('Escribe un título de al menos 3 caracteres.');
  if(draft.published&&!draft.summary&&!draft.body&&!draft.file_url&&!form.elements.file_upload.files[0])throw Error('Para publicar agrega un resumen, contenido o un PDF.');
  if(form.elements.cover_upload.files[0]){status('Cargando imagen…');draft.cover_url=await uploadCmsImage(form.elements.cover_upload.files[0])}
  if(form.elements.file_remove.checked){draft.file_url='';draft.file_name=''}
  if(form.elements.file_upload.files[0]){status('Cargando PDF…');const f=form.elements.file_upload.files[0];draft.file_url=await uploadPdf(f);draft.file_name=f.name.slice(0,200)}
  if(!draft.id)draft.slug=await uniqueSlug(draft.title);
  if(!validatePublication(draft))throw Error('Revisa los campos: la imagen debe ser una dirección HTTPS o assets/ y los textos no deben superar el largo permitido.');
  status('Guardando…');
  const fields=['kind','title','summary','body','author','area','published_on','cover_url','cover_alt','file_url','file_name','published','featured'],payload=Object.fromEntries(fields.map(k=>[k,draft[k]]));
  const rows=draft.id
   ?await cmsRequest(`bko_publications?id=eq.${draft.id}&revision=eq.${draft.revision}&select=${publicationColumns}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)})
   :await cmsRequest(`bko_publications?select=${publicationColumns}`,{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({...payload,slug:draft.slug})});
  if(rows?.length!==1)throw Error('Otra persona modificó esta publicación. Recarga la página antes de guardar.');
  clearDraft();initial=snapshot(form);dialog.close();onDone?.(rows[0],draft.id?'updated':'created');
 }catch(error){status(error.message)}finally{busy=false;buttons.forEach(b=>b.disabled=false)}
}
async function remove(){
 if(busy||!current?.id)return;
 if(!confirm(`¿Eliminar definitivamente «${current.title}»? Esta acción no se puede deshacer.`))return;
 busy=true;try{await cmsRequest(`bko_publications?id=eq.${current.id}`,{method:'DELETE'});clearDraft();initial=snapshot(dialog.querySelector('form'));dialog.close();onDone?.(current,'deleted')}catch(error){status(error.message)}finally{busy=false}
}
