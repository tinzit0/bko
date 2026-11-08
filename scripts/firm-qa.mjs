// Public pages use the real Supabase API. Admin interaction fixtures stay in this QA harness.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),origin='http://127.0.0.1:3000';
const t=await fetch('http://127.0.0.1:9333/json/new?about:blank',{method:'PUT'}).then(r=>r.json());const ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true})});
let seq=0;const pending=new Map(),exceptions=[],networkFailures=[];
ws.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}}if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==='Network.loadingFailed'&&!m.params.canceled)networkFailures.push(m.params.errorText)});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function waitFor(expression,timeout=18000){const start=Date.now();while(Date.now()-start<timeout){if(await ev(expression))return;await pause(200)}throw Error('Tiempo agotado: '+expression)}
const results=[];
try{
 await call('Runtime.enable');await call('Page.enable');await call('Network.enable');
 for(const width of process.env.BKO_QA_WIDTHS?process.env.BKO_QA_WIDTHS.split(',').map(Number):[1440,820,390,320]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<700});
  for(const path of process.env.BKO_QA_PATHS?process.env.BKO_QA_PATHS.split(','):['index.html','equipo/jorge-ivan-saavedra-bentjerodt.html','equipo/camila-alejandra-kopplin-lanata.html','equipo/fenella-reyes-gonzalo.html','equipo/luis-miranda-chavarria.html','equipo/roxana-ximena-oyarzun-bustamante.html','equipo/estefania-benitez-garcia.html','cauce/index.html','seguros/index.html']){
   await call('Page.navigate',{url:origin+'/'+path});await waitFor("document.readyState==='complete'");await waitFor("!document.querySelector('[data-firm-team]')||document.querySelectorAll('[data-firm-team] .person').length===6");await pause(700);
   await waitFor("[...document.querySelectorAll('[data-firm-team],[data-firm-profile],[data-firm-people],[data-firm-practices],[data-firm-cauce],[data-cauce-preview]')].every(r=>r.hasAttribute('data-firm-ready'))");
   if(path.startsWith('equipo/'))await waitFor("document.querySelector('[data-firm-profile] h1')&&!document.querySelector('.firm-unavailable')");
   await ev("Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode().catch(()=>{})}))");
   const layout=await ev("({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,images:[...document.images].filter(i=>i.naturalWidth===0).map(i=>i.src),unavailable:!!document.querySelector('.firm-unavailable')})");
   if(layout.scrollWidth>width)console.log(await ev("[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1&&getComputedStyle(e).position!=='absolute').slice(0,25).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,100),right:e.getBoundingClientRect().right}))"));
   assert.ok(layout.scrollWidth<=width,`${path} overflow ${width}: ${JSON.stringify(layout)}`);assert.equal(layout.h1,1,path);assert.deepEqual(layout.images,[],path);assert.equal(layout.unavailable,false,path);
   if(path==='index.html'){
    assert.deepEqual(await ev("[...document.querySelectorAll('[data-firm-team] h3')].map(x=>x.textContent)"),['Jorge I. Saavedra Bentjerodt','Camila Alejandra Kopplin Lanata','Fenella Reyes Gonzalo','Luis Miranda Chavarría','Roxana Ximena Oyarzún Bustamante','Estefanía Benítez García']);
    assert.equal(await ev("document.querySelectorAll('[data-firm-practices] details').length"),4);
    await ev("document.querySelector('#contact-form').requestSubmit()");assert.equal(await ev("document.querySelector('#name').getAttribute('aria-invalid')"),'true');
    if(width<1201){await ev("document.querySelector('.menu-toggle').click();document.querySelectorAll('#navigation summary')[1].click()");assert.equal(await ev("document.querySelector('.menu-toggle').getAttribute('aria-expanded')"),'true');await ev("[...document.querySelectorAll('#navigation a')].find(a=>a.hash==='#familia').click()");assert.equal(await ev("document.querySelector('.menu-toggle').getAttribute('aria-expanded')"),'false')}
   }
   if((width===1440||width===390)&&['index.html','cauce/index.html','equipo/jorge-ivan-saavedra-bentjerodt.html'].includes(path)){
    await ev("document.documentElement.style.scrollBehavior='auto';scrollTo(0,0)");await pause(500);const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await mkdir(new URL('artifacts/',root),{recursive:true});await writeFile(new URL(`artifacts/firm-${path.split('/')[0].replace('.html','')}-${width}.png`,root),Buffer.from(shot.data,'base64'));
   }
   results.push({path,...layout});console.log(width,path,'OK');
  }
 }
 // The CAUCE form validates without sending an incomplete inquiry.
 await call('Page.navigate',{url:origin+'/cauce/index.html'});await waitFor("!!document.querySelector('#cauce-form')");await pause(500);await ev("document.querySelector('#cauce-form').requestSubmit()");assert.equal(await ev("document.querySelector('#cauce-name').getAttribute('aria-invalid')"),'true');
 assert.deepEqual(exceptions,[]);await writeFile(new URL('artifacts/firm-update-qa.json',root),JSON.stringify({results,exceptions,networkFailures},null,2));console.log('QA pública completada: '+results.length+' combinaciones de páginas y tamaños.');
}finally{await call('Page.close').catch(()=>{});ws.close()}
