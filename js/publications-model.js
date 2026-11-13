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
// Texto sin marcas de formato (para resúmenes, búsqueda y conteo de palabras).
export function plainText(body){
 return String(body||'').replace(/!\[[^\]\n]*\]\(\S+\)/g,' ').replace(/\[([^\]\n]+)\]\([^)\s]+\)/g,'$1').replace(/^(#{2,3} |[-•] |\d+[.)] |> ?)/gm,'').replace(/\*\*|\*/g,'').replace(/\s+/g,' ').trim();
}
export const wordCount=body=>plainText(body).split(' ').filter(Boolean).length;
export const readingMinutes=body=>Math.max(1,Math.round(wordCount(body)/200));
/** Primeras frases del contenido, hasta `max` caracteres, sin cortar palabras. */
export function excerpt(body,max=240){
 // Solo párrafos normales: los subtítulos, listas, citas e imágenes no sirven como resumen.
 const paragraphs=String(body||'').replace(/\r\n?/g,'\n').split(/\n\s*\n/).map(b=>b.trim()).filter(b=>b&&!/^(#{2,3} |[-•] |\d+[.)] |> ?|!\[)/.test(b));
 const text=plainText(paragraphs.join('\n\n'))||plainText(body);if(text.length<=max)return text;
 const cut=text.slice(0,max),sentence=cut.lastIndexOf('. ');
 return sentence>max*0.5?cut.slice(0,sentence+1):cut.slice(0,cut.lastIndexOf(' ')).replace(/[,;:]$/,'')+'…';
}
export function matchesSearch(p,query){
 const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
 const words=norm(query).split(/\s+/).filter(Boolean);if(!words.length)return true;
 const hay=norm([p.title,p.summary,p.author,p.area,publicationKinds[p.kind],plainText(p.body)].join(' '));
 return words.every(w=>hay.includes(w));
}
/** Otras publicaciones para «Sigue leyendo»: primero del mismo tipo y área. */
export function relatedPublications(p,rows,limit=3){
 return sortPublications(rows.filter(r=>r.slug!==p.slug&&r.published)).map(r=>[r,(r.kind===p.kind?2:0)+(p.area&&r.area===p.area?3:0)]).sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([r])=>r);
}
// Formato en línea sobre texto escapado: **negrita**, *cursiva* y [texto](https://… o mailto:…).
export function inlineMarkup(text){
 return escapeHtml(text)
  .replace(/\[([^\]\n]+)\]\(((?:https:\/\/|mailto:)[^\s()]+)\)/g,(m,label,url)=>`<a href="${url}"${url.startsWith('https:')?' target="_blank" rel="noopener noreferrer"':''}>${label}</a>`)
  .replace(/\*\*([^*\n]+?)\*\*/g,'<strong>$1</strong>')
  .replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g,'$1<em>$2</em>');
}
// Texto plano a HTML seguro. Bloques separados por línea vacía:
// «## » subtítulo, «### » subtítulo menor, «- » lista, «1. » lista numerada, «> » cita, «![descripción](https://…)» imagen.
export function bodyMarkup(body,base=''){
 return String(body||'').replace(/\r\n?/g,'\n').split(/\n\s*\n/).map(block=>block.trim()).filter(Boolean).map(block=>{
  if(block.startsWith('### '))return `<h3>${inlineMarkup(block.slice(4).trim())}</h3>`;
  if(block.startsWith('## '))return `<h2>${inlineMarkup(block.slice(3).trim())}</h2>`;
  const image=block.match(/^!\[([^\]\n]*)\]\((\S+)\)$/);
  if(image){const src=coverUrl(image[2],base);if(src)return `<figure class="publication-figure"><img src="${escapeHtml(src)}" alt="${escapeHtml(image[1])}" loading="lazy" decoding="async">${image[1]?`<figcaption>${escapeHtml(image[1])}</figcaption>`:''}</figure>`}
  const lines=block.split('\n').map(l=>l.trim());
  if(lines.every(l=>/^[-•]\s+/.test(l)))return `<ul>${lines.map(l=>`<li>${inlineMarkup(l.replace(/^[-•]\s+/,''))}</li>`).join('')}</ul>`;
  if(lines.every(l=>/^\d+[.)]\s+/.test(l)))return `<ol>${lines.map(l=>`<li>${inlineMarkup(l.replace(/^\d+[.)]\s+/,''))}</li>`).join('')}</ol>`;
  if(lines.every(l=>l.startsWith('>')))return `<blockquote><p>${lines.map(l=>inlineMarkup(l.replace(/^>\s?/,''))).join('<br>')}</p></blockquote>`;
  return `<p>${lines.map(inlineMarkup).join('<br>')}</p>`;
 }).join('');
}
