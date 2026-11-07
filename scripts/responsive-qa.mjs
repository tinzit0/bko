// QA con Edge/Chrome CDP en :9333 y servidor local en :3000.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const target=await fetch('http://127.0.0.1:9333/json/new?http://127.0.0.1:3000',{method:'PUT'}).then(r=>r.json());
const ws=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})});
let sequence=0;const pending=new Map();const exceptions=[];
ws.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);if(!p)return;pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails.text)});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const sizes=[[320,568],[360,800],[390,844],[430,932],[600,960],[650,900],[768,1024],[820,1180],[1024,768],[1180,820],[1280,800],[1440,900],[1920,1080],[2560,1440],[844,390]];
const results=[];
try{
 await mkdir(new URL('../artifacts/',import.meta.url),{recursive:true});
 await call('Page.enable');await call('Runtime.enable');
 // Stable screenshots; the standard browser QA separately exercises animated mode.
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 for(const [width,height] of sizes){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=1200});
  await call('Emulation.setTouchEmulationEnabled',{enabled:width<=1200});
  await call('Page.navigate',{url:'http://127.0.0.1:3000'});await pause(350);
  const layout=await evaluate(`(async()=>{
    for(const img of document.images)img.loading='eager';
    await Promise.all([...document.images].map(i=>i.decode()));
    const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return{top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height}};
    const columns=selector=>getComputedStyle(document.querySelector(selector)).gridTemplateColumns.split(' ').length;
    const hero=rect('.hero-content'),locations=rect('.hero-locations'),heading=rect('.header');
    const badSectors=[...document.querySelectorAll('.sector')].filter(el=>{const c=el.querySelector('.sector-content').getBoundingClientRect(),r=el.getBoundingClientRect();return c.top<r.top||c.bottom>r.bottom+1||c.left<r.left||c.right>r.right+1}).length;
    return{width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,sectorColumns:columns('.sector-grid'),teamColumns:columns('.team-grid'),formColumns:columns('.form-grid'),inputFont:parseFloat(getComputedStyle(document.querySelector('#email')).fontSize),menuVisible:getComputedStyle(document.querySelector('.menu-toggle')).display!=='none',menuWidth:rect('.menu-toggle').width,menuHeight:rect('.menu-toggle').height,heroBelowHeader:hero.top>=heading.bottom-1,heroLocationsClear:hero.bottom<=locations.top+1,badSectors,missingImages:[...document.images].filter(i=>!i.naturalWidth).length};
  })()`);
  assert.ok(layout.scrollWidth<=width,`Desbordamiento: ${JSON.stringify(layout)}`);
  assert.equal(layout.missingImages,0);assert.equal(layout.badSectors,0,`Texto fuera de tarjeta a ${width}`);
  assert.equal(layout.heroBelowHeader,true,`Hero bajo cabecera a ${width}`);assert.equal(layout.heroLocationsClear,true,`Hero superpuesto a ubicaciones a ${width}`);
  if(width<=1200){
    assert.equal(layout.menuVisible,true);assert.ok(layout.menuWidth>=44&&layout.menuHeight>=44);assert.ok(layout.inputFont>=16);
    await evaluate(`document.querySelector('.menu-toggle').click()`);
    await pause(100);
    const nav=await evaluate(`(()=>{const nav=document.querySelector('#navigation');const r=nav.getBoundingClientRect();const header=document.querySelector('.header').getBoundingClientRect();return{open:document.querySelector('.menu-toggle').getAttribute('aria-expanded'),top:r.top,headerBottom:header.bottom,bottom:r.bottom,scrollable:nav.scrollHeight>=nav.clientHeight,targets:[...nav.querySelectorAll('a')].every(a=>a.getBoundingClientRect().height>=44)}})()`);
    assert.equal(nav.open,'true');assert.equal(nav.top,nav.headerBottom);assert.ok(nav.bottom<=height+1);assert.equal(nav.targets,true);
    await evaluate(`document.querySelector('#navigation a[href="#equipo"]').click()`);await pause(100);
    assert.equal(await evaluate(`document.querySelector('.menu-toggle').getAttribute('aria-expanded')`),'false');
    await evaluate(`document.querySelector('#email').focus()`);await pause(60);
    if(width<=600)assert.equal(await evaluate(`getComputedStyle(document.querySelector('.whatsapp-float')).pointerEvents`),'none');
    await evaluate(`document.querySelector('#email').blur();scrollTo({top:0,behavior:'instant'})`);
  }
  if(width===390||width===820||width===1180){
    for(const id of ['inicio','sectores','presencia','contacto']){
      await evaluate(`document.querySelector('#${id}').scrollIntoView({behavior:'instant'})`);await pause(100);
      const clip=await evaluate(`(()=>{const r=document.querySelector('#${id}').getBoundingClientRect();return{x:0,y:r.top+scrollY,width:innerWidth,height:r.height,scale:1}})()`);
      const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip});
      await writeFile(new URL('../artifacts/responsive-'+width+'-'+id+'.png',import.meta.url),Buffer.from(shot.data,'base64'));
    }
  }
  results.push(layout);console.log(`${width} × ${height}: OK`);
 }
 await call('Emulation.setDeviceMetricsOverride',{width:1024,height:768,deviceScaleFactor:1,mobile:false});await pause(100);
 await evaluate(`document.querySelector('.menu-toggle').click()`);
 await call('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});await pause(150);
 assert.equal(await evaluate(`document.body.classList.contains('menu-open')`),false,'El menú debe desbloquear el scroll al pasar a escritorio');
 assert.deepEqual(exceptions,[]);
 await writeFile(new URL('../artifacts/responsive-qa-results.json',import.meta.url),JSON.stringify({viewports:results,orientationMenu:'OK',exceptions},null,2));
}finally{await call('Page.close');ws.close()}
