// Codifica las fotografías locales sin filtros, estiramientos ni ampliación.
// Requiere el servidor local :3000 y Edge/Chrome con CDP en :9333.
import { writeFile } from 'node:fs/promises';
const photos = [
  ['assets/personas/camila.jpeg', 'assets/personas/camila', [480, 960]],
  ['assets/personas/roxana.png', 'assets/personas/roxana', [367]],
  ['assets/oficinas/calama/WhatsApp Image 2026-11-05 at 22.49.38.jpeg', 'assets/oficinas/calama/interior', [480, 960]],
  ['assets/oficinas/santiago/WhatsApp Image 2026-11-05 at 22.48.40.jpeg', 'assets/oficinas/santiago/interior', [480, 960]],
  ['assets/oficinas/puerto varas/WhatsApp Image 2026-11-05 at 22.48.52.jpeg', 'assets/oficinas/puerto varas/interior', [480, 960]],
];
const target = await fetch('http://127.0.0.1:9333/json/new?http://127.0.0.1:3000', {method:'PUT'}).then(r => r.json());
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject) => { ws.addEventListener('open',resolve,{once:true}); ws.addEventListener('error',reject,{once:true}); });
let sequence = 0;
const pending = new Map();
ws.addEventListener('message', ({data}) => {
  const message = JSON.parse(data);
  if (!message.id) return;
  const item = pending.get(message.id);
  pending.delete(message.id);
  message.error ? item.reject(new Error(JSON.stringify(message.error))) : item.resolve(message.result);
});
const call = (method,params={}) => new Promise((resolve,reject) => { const id = ++sequence; pending.set(id,{resolve,reject}); ws.send(JSON.stringify({id,method,params})); });
try {
  await call('Page.enable');
  await call('Page.navigate',{url:'http://127.0.0.1:3000'});
  for (const [source, destination, widths] of photos) {
    for (const width of widths) {
      const expression = `(async()=>{const response=await fetch(${JSON.stringify('/'+encodeURI(source))});if(!response.ok)throw new Error('Foto ausente');const bitmap=await createImageBitmap(new Blob([await response.arrayBuffer()],{type:${JSON.stringify(source.endsWith('.png')?'image/png':'image/jpeg')}}));const canvas=document.createElement('canvas');canvas.width=Math.min(${width},bitmap.width);canvas.height=Math.round(bitmap.height*canvas.width/bitmap.width);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/webp',.88)})()`;
      const result = await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
      if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
      const data = result.result.value;
      if (!data.startsWith('data:image/webp;base64,')) throw new Error('Codificador WebP no disponible');
      const bytes = Buffer.from(data.split(',')[1],'base64');
      await writeFile(new URL(`../${destination}-${width}.webp`,import.meta.url),bytes);
      console.log(`${destination}-${width}.webp: ${bytes.length} bytes`);
    }
  }
} finally {
  await call('Page.close');
  ws.close();
}
