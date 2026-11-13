// Editor visual (tipo Word) para el contenido de artículos y estudios.
// Lo que se ve en pantalla se convierte al formato de texto seguro de publications-model.js
// (**negrita**, *cursiva*, ## subtítulo, listas, citas, enlaces e imágenes). Nunca se guarda HTML.
import {bodyMarkup,inlineMarkup} from './publications-model.js';

const BLOCKS=new Set(['P','DIV','SECTION','ARTICLE','HEADER','FOOTER','MAIN','H1','H2','H3','H4','H5','H6','UL','OL','LI','BLOCKQUOTE','FIGURE','TABLE','THEAD','TBODY','TR','PRE','HR']);
const safeHref=href=>{const v=String(href||'').trim();return /^(https:\/\/|mailto:)[^\s()]+$/.test(v)?v:''};
const safeSrc=src=>{const v=String(src||'').trim();return /^https:\/\/[^\s()]+$/.test(v)?v:''};

function wrap(text,mark){
 const m=text.match(/^(\s*)([\s\S]*?)(\s*)$/);
 return m[2]?`${m[1]}${mark}${m[2]}${mark}${m[3]}`:text;
}
function inline(node){
 let out='';
 for(const child of node.childNodes){
  if(child.nodeType===3){out+=child.nodeValue.replace(/[\n\r\t]+/g,' ').replace(/ /g,' ');continue}
  if(child.nodeType!==1)continue;
  const tag=child.tagName,style=child.style||{};
  if(tag==='BR'){out+='\n';continue}
  if(tag==='IMG'||tag==='SCRIPT'||tag==='STYLE'||tag==='FIGURE')continue;
  let inner=inline(child);
  const bold=tag==='B'||tag==='STRONG'||/^(bold|[6-9]00)$/.test(style.fontWeight||'');
  const italic=tag==='I'||tag==='EM'||style.fontStyle==='italic';
  if(tag==='A'){const href=safeHref(child.getAttribute('href'));inner=href&&inner.trim()?`[${inner.trim().replace(/[[\]]/g,'')}](${href})`:inner}
  if(italic&&!bold)inner=wrap(inner.replace(/\*/g,''),'*');
  if(bold)inner=wrap(inner.replace(/\*\*/g,''),'**');
  out+=inner;
 }
 return out;
}
const clean=text=>text.split('\n').map(l=>l.replace(/ {2,}/g,' ').trim()).filter(Boolean).join('\n');
function image(el){
 const img=el.tagName==='IMG'?el:el.querySelector('img');const src=safeSrc(img?.getAttribute('src'));if(!src)return '';
 const alt=(el.querySelector?.('figcaption')?.textContent||img.getAttribute('alt')||'').replace(/[[\]\n()]/g,' ').trim();
 return `![${alt}](${src})`;
}
function blocks(container,out=[]){
 let buffer=null;
 const flush=()=>{if(buffer!==null){const t=clean(buffer);if(t)out.push(t);buffer=null}};
 for(const child of container.childNodes){
  if(child.nodeType===3||(child.nodeType===1&&!BLOCKS.has(child.tagName)&&child.tagName!=='IMG')){
   if(child.nodeType===1&&child.querySelector?.('img')){flush();const md=image(child);if(md)out.push(md)}
   buffer=(buffer??'')+(child.nodeType===3?child.nodeValue.replace(/[\n\r\t]+/g,' ').replace(/ /g,' '):inline({childNodes:[child]}));continue;
  }
  if(child.nodeType!==1)continue;
  flush();const tag=child.tagName;
  if(tag==='IMG'||tag==='FIGURE'){const md=image(child);if(md)out.push(md);continue}
  if(tag==='H1'||tag==='H2'){const t=clean(inline(child)).replace(/\n/g,' ');if(t)out.push('## '+t);continue}
  if(/^H[3-6]$/.test(tag)){const t=clean(inline(child)).replace(/\n/g,' ');if(t)out.push('### '+t);continue}
  if(tag==='UL'||tag==='OL'){
   const items=[...child.querySelectorAll('li')].map(li=>{const c=li.cloneNode(true);c.querySelectorAll('ul,ol').forEach(n=>n.remove());return clean(inline(c)).replace(/\n/g,' ')}).filter(Boolean);
   if(items.length)out.push(items.map((t,i)=>(tag==='OL'?`${i+1}. `:'- ')+t).join('\n'));continue;
  }
  if(tag==='BLOCKQUOTE'){const inner=[];blocks(child,inner);const t=inner.map(b=>b.replace(/^(#{2,3} |[-•] |\d+[.)] |> ?)/gm,'')).join('\n');if(t.trim())out.push(t.split('\n').map(l=>'> '+l).join('\n'));continue}
  if(tag==='TABLE'){[...child.querySelectorAll('tr')].forEach(tr=>{const t=[...tr.children].map(td=>clean(inline(td)).replace(/\n/g,' ')).filter(Boolean).join(' | ');if(t)out.push(t)});continue}
  if(tag==='HR')continue;
  if([...child.children].some(c=>BLOCKS.has(c.tagName)||c.tagName==='IMG'))blocks(child,out);
  else{const t=clean(inline(child));if(t)out.push(t)}
 }
 flush();return out;
}
/** Convierte el contenido del editor (o HTML pegado) al formato de texto seguro. */
export function serialize(root){return blocks(root).join('\n\n')}

/** HTML seguro para el editor a partir del texto guardado. Las imágenes no se editan como texto. */
export function toEditorHtml(body,base){
 const html=bodyMarkup(body,base);
 return html.replace(/<figure class="publication-figure">/g,'<figure class="publication-figure" contenteditable="false">')||'<p><br></p>';
}
export function pasteHtml(html,base){
 const doc=new DOMParser().parseFromString(html,'text/html');
 const md=serialize(doc.body);
 return /\n\n|^(#{2,3} |[-•] |\d+[.)] |> |!\[)/m.test(md)?bodyMarkup(md,base):inlineMarkup(md).replace(/\n/g,'<br>');
}
export function plainPasteHtml(text){
 const md=String(text||'').replace(/\r\n?/g,'\n').trim();
 return md.includes('\n')?md.split(/\n\s*\n/).map(p=>`<p>${inlineMarkup(p).replace(/\n/g,'<br>')}</p>`).join(''):inlineMarkup(md);
}
