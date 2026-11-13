// Formulario único para crear, editar, publicar y eliminar artículos y estudios.
// Se usa desde la portada (sesión iniciada) y desde el panel de Gestión.
import {config} from './config.js';
import {cmsRequest,cmsRole,readSession,uploadCmsImage} from './cms-session.js';
import {publicationKinds,publicationColumns,slugify,todayInChile,coverUrl,fileUrl,validatePublication,escapeHtml as h} from './publications-model.js';

let dialog,current,onDone,busy=false,focusBefore;
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
 <div class="bko-pub-grid">
  <label>Tipo<select name="kind">${Object.entries(publicationKinds).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label>
  <label>Fecha de publicación<input name="published_on" type="date" required></label>
 </div>
 <label>Título<input name="title" maxlength="220" required></label>
 <label>Resumen <small>(aparece en la tarjeta de la portada)</small><textarea name="summary" maxlength="600" rows="3"></textarea></label>
 <label>Contenido <small>Separa los párrafos con una línea vacía. Escribe «## » al inicio para un subtítulo y «- » para listas.</small><textarea name="body" maxlength="60000" rows="12"></textarea></label>
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
 dialog.querySelector('[data-cancel]').onclick=()=>{if(!busy)dialog.close()};
 dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault()});
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
 preview();status('');dialog.showModal();form.elements.title.focus();
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
  dialog.close();onDone?.(rows[0],draft.id?'updated':'created');
 }catch(error){status(error.message)}finally{busy=false;buttons.forEach(b=>b.disabled=false)}
}
async function remove(){
 if(busy||!current?.id)return;
 if(!confirm(`¿Eliminar definitivamente «${current.title}»? Esta acción no se puede deshacer.`))return;
 busy=true;try{await cmsRequest(`bko_publications?id=eq.${current.id}`,{method:'DELETE'});dialog.close();onDone?.(current,'deleted')}catch(error){status(error.message)}finally{busy=false}
}
