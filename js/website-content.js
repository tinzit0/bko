import {mediaUrl} from './insurance-render.js';
export function pageKey(){const script=document.querySelector('script[src*="visual-editor.js"]');const root=new URL('../',new URL(script.getAttribute('src'),location.href));let path=location.pathname.slice(root.pathname.length);return path===''?'index.html':path.endsWith('/')?path+'index.html':path}
export function discoverFields(){
 const fields=[];const roots=[document.querySelector('main'),document.querySelector('footer')].filter(Boolean);
 const selector=el=>{if(el.id)return'#'+CSS.escape(el.id);if(el.tagName==='MAIN')return'main';if(el.tagName==='FOOTER')return'footer';const peers=[...el.parentElement.children].filter(n=>n.tagName===el.tagName);return selector(el.parentElement)+'>'+el.tagName.toLowerCase()+`:nth-of-type(${peers.indexOf(el)+1})`};
 for(const root of roots){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){
   const el=node.parentElement,text=node.nodeValue.trim();if(text.length<2||el.closest('script,style,svg,noscript,form,dialog,[data-insurance-catalog],[data-roxana-profile],[data-roxana-name],[data-roxana-role],[data-roxana-intro],[data-roxana-specialties],[data-insurance-title],[data-insurance-subtitle],[data-insurance-main-cta]'))continue;
   const index=[...el.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).indexOf(node),key=selector(el)+'|text:'+index;
   fields.push({key,type:'text',value:text,label:(el.closest('section[id]')?.id||'Página')+' · '+text.slice(0,85),node,element:el});
  }
  root.querySelectorAll('img').forEach(img=>{if(img.closest('[data-insurance-catalog],[data-roxana-profile]')||img.hasAttribute('data-roxana-image'))return;const url=new URL(img.getAttribute('src'),location.href),base=new URL('../',import.meta.url);const value=url.origin===base.origin&&url.pathname.startsWith(base.pathname+'assets/')?url.pathname.slice(base.pathname.length):img.getAttribute('src');fields.push({key:selector(img)+'|image',type:'image',value,alt:img.alt,label:'Fotografía · '+img.alt,element:img})});
 }
 return fields;
}
export function applyField(field,saved,base=''){
 if(!saved||saved.type!==field.type||typeof saved.value!=='string')return;
 if(field.type==='text'){if(saved.value.length<=10000){const old=field.node.nodeValue;field.node.nodeValue=(old.match(/^\s*/)?.[0]||'')+saved.value+(old.match(/\s*$/)?.[0]||'')}}
 else{const url=mediaUrl(saved.value,base);if(!url)return;field.element.src=url;field.element.removeAttribute('srcset');field.element.removeAttribute('sizes');field.element.alt=typeof saved.alt==='string'?saved.alt:field.element.alt}
}
export function validateWebsite(value){return value&&typeof value.pages==='object'&&Object.entries(value.pages).length<=40&&Object.entries(value.pages).every(([path,fields])=>/^(index.html|equipo\/[a-z0-9-]+\.html|seguros\/index.html)$/.test(path)&&fields&&typeof fields==='object'&&Object.keys(fields).length<=1500&&Object.entries(fields).every(([key,f])=>key.length<=1500&&f&&['text','image'].includes(f.type)&&typeof f.value==='string'&&f.value.length<=10000&&(f.type!=='image'||!!mediaUrl(f.value))&&(f.alt===undefined||typeof f.alt==='string'&&f.alt.length<=1000)))}
