// QA local con Edge/Chrome y Chrome DevTools Protocol, sin dependencias npm.
import { writeFile, mkdir, access, unlink } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const target = await fetch('http://127.0.0.1:9333/json/new?http://127.0.0.1:3000', {method:'PUT'}).then(r => r.json());
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject) => { ws.addEventListener('open',resolve,{once:true}); ws.addEventListener('error',reject,{once:true}); });
let sequence = 0;
const pending = new Map();
const exceptions = [];
ws.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.id) { const item = pending.get(message.id); if (!item) return; pending.delete(message.id); message.error ? item.reject(new Error(JSON.stringify(message.error))) : item.resolve(message.result); }
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
});
function call(method,params={}) { return new Promise((resolve,reject) => { const id = ++sequence; pending.set(id,{resolve,reject}); ws.send(JSON.stringify({id,method,params})); }); }
async function evaluate(expression) {
  const value = await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if (value.exceptionDetails) throw new Error(JSON.stringify(value.exceptionDetails));
  return value.result.value;
}
async function pause(ms=500) { await new Promise(resolve => setTimeout(resolve,ms)); }
try {
  await call('Runtime.enable'); await call('Page.enable'); await call('Page.bringToFront');
  await pause(600);
  // Optimización de codificación: no altera la composición de las imágenes generadas.
  for (const name of ['hero','santiago']) {
    try { await access(new URL(`assets/${name}.png`,root)); } catch { continue; }
    const data = await evaluate(`(async()=>{const blob=await fetch('/assets/${name}.png').then(r=>r.blob());const bitmap=await createImageBitmap(blob);const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;canvas.getContext('2d').drawImage(bitmap,0,0);return canvas.toDataURL('image/webp',.86)})()`);
    if (!data.startsWith('data:image/webp;base64,')) throw new Error('WebP encoder unavailable');
    await writeFile(new URL(`assets/${name}.webp`,root),Buffer.from(data.split(',')[1],'base64'));
    await unlink(new URL(`assets/${name}.png`,root));
    console.log(`WebP optimizado: ${name}`);
  }
  await mkdir(new URL('artifacts/',root),{recursive:true});
  const results = [];
  for (const width of [1440,1024,768,390,320]) {
    const height = width > 700 ? 1000 : 844;
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});
    await call('Page.navigate',{url:'http://127.0.0.1:3000'}); await pause(1600);
    const layout = await evaluate(`({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,sections:document.querySelectorAll('main section[id]').length,h1:document.querySelectorAll('h1').length,missingImages:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src)})`);
    if (layout.scrollWidth > width) {
      const overflow = await evaluate(`([...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.right>innerWidth+1&&getComputedStyle(el).position!=='absolute'}).map(el=>({tag:el.tagName,class:el.className?.baseVal??el.className,right:el.getBoundingClientRect().right})))`);
      throw new Error(`Desbordamiento a ${width}px: ${layout.scrollWidth} ${JSON.stringify(overflow)}`);
    }
    if (layout.sections !== 10 || layout.h1 !== 1) throw new Error(`Estructura inesperada: ${JSON.stringify(layout)}`);
    // Recorrer para activar las entradas al hacer scroll.
    await evaluate(`document.documentElement.style.scrollBehavior='auto'`);
    await evaluate(`(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=600){scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,90))}scrollTo({top:0,behavior:'instant'})})()`); await pause(1000);
    const visible = await evaluate(`({hero:getComputedStyle(document.querySelector('.hero-content')).opacity,reveals:document.querySelectorAll('.reveal.is-visible').length,total:document.querySelectorAll('.reveal').length})`);
    console.log('Visibilidad',width,JSON.stringify(visible));
    if (visible.hero !== '1' || visible.reveals < visible.total - 6) throw new Error('Elementos no visibles tras scroll');
    await evaluate(`Promise.all([...document.images].map(img=>img.decode().catch(()=>{})))`);
    layout.missingImages = await evaluate(`[...document.images].filter(img=>!img.complete||img.naturalWidth===0).map(img=>img.src)`);
    if (layout.missingImages.length) throw new Error('Imágenes sin cargar: '+layout.missingImages.join(', '));
    if (width === 1440 || width === 390) {
      const shot = await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height:await evaluate('document.documentElement.scrollHeight'),scale:1}});
      await writeFile(new URL(`artifacts/bko-${width}.png`,root),Buffer.from(shot.data,'base64'));
      const viewport = await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
      await writeFile(new URL(`artifacts/bko-${width}-inicio.png`,root),Buffer.from(viewport.data,'base64'));
    }
    results.push(layout);
  }
  // Menú móvil y acordeones.
  await evaluate(`document.querySelector('.menu-toggle').click()`);
  if (!await evaluate(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='true'`)) throw new Error('Menú no abre');
  await evaluate(`document.querySelector('#navigation a[href="#firma"]').click()`);
  if (!await evaluate(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')==='false'`)) throw new Error('Menú no cierra al navegar');
  await evaluate(`document.querySelector('.highlights a[href="#mineria"]').click()`);
  if (!await evaluate(`document.querySelector('#mineria').open`)) throw new Error('Enlace no abre acordeón');
  await evaluate(`document.querySelector('[data-open-privacy]').click()`);
  if (!await evaluate(`document.querySelector('#privacy-dialog').open`)) throw new Error('Privacidad no abre');
  await evaluate(`document.querySelector('#privacy-dialog [data-close-dialog]').click()`);
  await evaluate(`document.querySelector('#contact-form').requestSubmit()`);
  if (!await evaluate(`document.querySelector('#name').getAttribute('aria-invalid')==='true'`)) throw new Error('No valida formulario vacío');
  // Simula transporte SOLO en QA, nunca en el sitio. Verifica fallo y confirmación real del contrato.
  await evaluate(`window.bkoOriginalFetch=window.fetch;window.fetch=async()=>new Response(JSON.stringify({ok:false}),{status:503});const f=document.querySelector('#contact-form');for(const[k,v]of Object.entries({name:'Prueba Local',email:'qa@example.org',city:'Calama',area:'Derecho laboral',message:'Consulta de prueba local sin envío real.'})){f.elements[k].value=v}f.elements.privacy.checked=true;f.requestSubmit()`); await pause(300);
  if (await evaluate(`document.querySelector('#form-status').dataset.state`) !== 'error') throw new Error('Debe indicar error cuando falla almacenamiento');
  await evaluate(`window.fetch=async()=>new Response(JSON.stringify({ok:true,id:'123e4567-e89b-12d3-a456-426614174000'}),{status:201});document.querySelector('#contact-form').requestSubmit()`); await pause(300);
  if (await evaluate(`document.querySelector('#form-status').dataset.state`) !== 'success') throw new Error('No procesa confirmación');
  await evaluate(`window.fetch=window.bkoOriginalFetch;delete window.bkoOriginalFetch`);
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  const reduced = await evaluate(`getComputedStyle(document.documentElement).scrollBehavior==='auto'`);
  if (!reduced) throw new Error('No respeta movimiento reducido');
  if (exceptions.length) throw new Error('Errores de JavaScript: '+exceptions.join(', '));
  console.log(JSON.stringify({viewports:results,menu:'OK',accordions:'OK',privacy:'OK',formValidation:'OK',storageFailure:'OK',confirmedSuccess:'OK',reducedMotion:'OK',jsExceptions:exceptions},null,2));
} finally { await call('Page.close').catch(()=>{}); ws.close(); }
