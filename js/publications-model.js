// Modelo compartido de artículos y estudios (portada, página de publicaciones, editor y pruebas).
export const publicationKinds=Object.freeze({articulo:'Artículo',estudio:'Estudio'});
export const publicationColumns='id,slug,kind,title,summary,body,author,area,published_on,cover_url,cover_alt,file_url,file_name,published,featured,revision,created_at';
export const defaultCovers=Object.freeze({articulo:'assets/editorial/analisis.svg',estudio:'assets/editorial/publicaciones.svg'});
export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function slugify(text){
 return String(text||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90).replace(/-+$/,'');
}
export function todayInChile(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago'}).format(new Date())}
export function formatDate(iso){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(iso||''))return '';
 const [y,m,d]=iso.split('-').map(Number);
 return new Date(Date.UTC(y,m-1,d)).toLocaleDateString('es-CL',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
}
// Portada: rutas assets/ del sitio o HTTPS. Documento: solo HTTPS.
export function coverUrl(value,base=''){
 if(typeof value!=='string'||!value)return '';
 if(/^assets\/[a-zA-Z0-9/._-]+$/.test(value)&&!value.includes('..'))return base+value;
 try{const u=new URL(value);return u.protocol==='https:'?u.href:''}catch{return ''}
}
export function fileUrl(value){try{const u=new URL(value);return u.protocol==='https:'?u.href:''}catch{return ''}}

export function validatePublication(p){
 const str=(v,max,min=0)=>typeof v==='string'&&v.trim().length>=min&&v.length<=max;
 return !!p&&typeof p==='object'&&str(p.slug,120,3)&&/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)&&Object.hasOwn(publicationKinds,p.kind)&&str(p.title,220,3)&&str(p.summary,600)&&str(p.body,60000)&&str(p.author,200)&&str(p.area,120)&&/^\d{4}-\d{2}-\d{2}$/.test(p.published_on)&&str(p.cover_url,2000)&&(p.cover_url===''||!!coverUrl(p.cover_url))&&str(p.cover_alt,500)&&str(p.file_url,2000)&&(p.file_url===''||!!fileUrl(p.file_url))&&str(p.file_name,200)&&typeof p.published==='boolean'&&typeof p.featured==='boolean';
}
// Destacados primero, luego por fecha de publicación (más reciente primero).
export function sortPublications(rows){
 return [...rows].sort((a,b)=>Number(b.featured)-Number(a.featured)||b.published_on.localeCompare(a.published_on)||String(b.created_at||'').localeCompare(String(a.created_at||'')));
}
// Texto plano a HTML seguro: párrafos separados por línea vacía, «## » para subtítulos y «- » para listas.
export function bodyMarkup(body){
 return String(body||'').replace(/\r\n?/g,'\n').split(/\n\s*\n/).map(block=>block.trim()).filter(Boolean).map(block=>{
  if(block.startsWith('## '))return `<h2>${escapeHtml(block.slice(3).trim())}</h2>`;
  const lines=block.split('\n').map(l=>l.trim());
  if(lines.every(l=>/^[-•]\s+/.test(l)))return `<ul>${lines.map(l=>`<li>${escapeHtml(l.replace(/^[-•]\s+/,''))}</li>`).join('')}</ul>`;
  return `<p>${lines.map(escapeHtml).join('<br>')}</p>`;
 }).join('');
}
