// Browser inspection against the real public API. No interception, sign-in or writes.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const target=await fetch('http://127.0.0.1:9333/json/new?about:blank',{method:'PUT'}).then(r=>r.json());
const ws=new WebSocket(target.webSocketDebuggerUrl),pending=new Map();let sequence=0;
await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
const exceptions=[],consoleErrors=[],requests=new Map(),failures=[];
ws.addEventListener('message',({data})=>{
 const m=JSON.parse(data);
 if(m.id){const item=pending.get(m.id);if(item){pending.delete(m.id);m.error?item.reject(m.error):item.resolve(m.result)}}
 if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails.text);
 if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')consoleErrors.push(m.params.args.map(a=>a.value||a.description).join(' '));
 if(m.method==='Network.responseReceived')requests.set(m.params.requestId,{url:m.params.response.url,status:m.params.response.status,type:m.params.type});
 if(m.method==='Network.loadingFailed')failures.push({error:m.params.errorText,type:m.params.type});
});
const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitFor(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await pause(150)}throw Error('Timeout: '+expression)}
try{
 await call('Page.enable');await call('Runtime.enable');await call('Network.enable');await call('Performance.enable');
 await call('Page.navigate',{url:'http://127.0.0.1:3000/#clientes'});
 await waitFor("document.querySelector('[data-clients]')?.dataset.clientsPreview==='local'");
 await waitFor("document.querySelector('#clientes').getBoundingClientRect().top<180");
 assert.equal(await evaluate("document.querySelectorAll('#navigation [data-client-navigation]').length"),1);
 assert.equal(await evaluate("document.querySelector('#navigation [data-client-navigation]').textContent"),'Empresas');
 const directAnchor=await evaluate("({top:document.querySelector('#clientes').getBoundingClientRect().top,scrollY})");
 const compactLayouts=[];
 for(const width of [1440,820,390,320]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:960,deviceScaleFactor:1,mobile:width<700});
  const compact=await evaluate("({width:innerWidth,height:document.querySelector('#clientes').offsetHeight,visibleCards:[...document.querySelectorAll('[data-clients] .client-card')].filter(c=>c.checkVisibility()).length,open:document.querySelector('.clients-directory').open,scrollWidth:document.documentElement.scrollWidth})");
  assert.equal(compact.visibleCards,4);assert.equal(compact.open,false);assert.ok(compact.height<720);assert.ok(compact.scrollWidth<=width);compactLayouts.push(compact);
  if(width===1440||width===390){await evaluate("Promise.all([...document.querySelectorAll('.clients-featured img')].map(i=>{i.loading='eager';return i.decode()}))");await evaluate("document.querySelector('#clientes').scrollIntoView({block:'start',behavior:'instant'})");await pause(600);const clip=await evaluate("(()=>{const r=document.querySelector('#clientes').getBoundingClientRect();return {x:0,y:r.top+scrollY,width:innerWidth,height:r.height,scale:1}})()");const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip});await writeFile(new URL('../artifacts/clients-compact-'+width+'.png',import.meta.url),Buffer.from(shot.data,'base64'))}
 }
 await evaluate("document.querySelector('[data-open-clients]').click()");
 await waitFor("document.querySelector('.clients-featured').hidden");
 assert.equal(await evaluate("[...document.querySelectorAll('[data-clients] .client-card')].filter(c=>c.checkVisibility()).length"),22);
 assert.equal(await evaluate("document.querySelectorAll('.clients-all .client-card').length"),22);
 assert.equal(await evaluate("new Set([...document.querySelectorAll('.clients-all .client-card')].map(e=>e.dataset.clientSlug)).size"),22);
 assert.equal(await evaluate("document.querySelectorAll('.clients-all img').length"),13);
 assert.equal(await evaluate("document.querySelectorAll('.clients-all .client-wordmark').length"),9);
 await evaluate("document.querySelector('[data-client-filter=turismo]').click()");
 assert.equal(await evaluate("document.querySelectorAll('.clients-all .client-card:not([hidden])').length"),4);
 await evaluate("document.querySelector('[data-client-filter=all]').click()");
 const localLayouts=[];
 for(const [width,columns] of [[1440,5],[820,3],[390,2]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:960,deviceScaleFactor:1,mobile:width<700});
  await evaluate("Promise.all([...document.querySelectorAll('[data-clients] img')].map(i=>{i.loading='eager';return i.decode()}))");
  const layout=await evaluate("({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,columns:getComputedStyle(document.querySelector('.clients-all')).gridTemplateColumns.split(' ').length,broken:[...document.querySelectorAll('[data-clients] img')].filter(i=>!i.naturalWidth).length})");
  assert.equal(layout.columns,columns);assert.equal(layout.broken,0);assert.ok(layout.scrollWidth<=width);localLayouts.push(layout);
  if(width===1440||width===390){await evaluate("document.querySelector('#clientes').scrollIntoView({block:'start',behavior:'instant'})");await pause(600);const clip=await evaluate("(()=>{const r=document.querySelector('#clientes').getBoundingClientRect();return {x:0,y:r.top+scrollY,width:innerWidth,height:r.height,scale:1}})()");const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip});await writeFile(new URL('../artifacts/clients-local-'+width+'.png',import.meta.url),Buffer.from(shot.data,'base64'))}
 }
 await call('Page.navigate',{url:'http://127.0.0.1:3000/?vista=compacta#clientes-completo'});
 await waitFor("document.querySelector('[data-clients]')?.dataset.clientsPreview==='local'");
 assert.equal(await evaluate("document.querySelector('.clients-directory').open"),false);
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:960,deviceScaleFactor:1,mobile:false});
 await call('Page.navigate',{url:'http://127.0.0.1:3000/?clientes=publicados'});
 await waitFor("document.querySelector('[data-clients]')?.hasAttribute('data-clients-ready')");
 const publicState=await evaluate("({ready:document.querySelector('[data-clients]').dataset.clientsReady,hidden:document.querySelector('[data-clients]').hidden,sections:document.querySelectorAll('[data-clients]').length,overflow:document.documentElement.scrollWidth>innerWidth,navigation:performance.getEntriesByType('navigation').map(n=>({duration:n.duration,domContentLoaded:n.domContentLoadedEventEnd}))})");
 assert.notEqual(publicState.ready,'error');assert.equal(publicState.sections,1);assert.equal(publicState.overflow,false);
 const [requestId,clientRequest]=[...requests.entries()].find(([,r])=>r.url.includes('/rest/v1/bko_clients?')&&r.type!=='Preflight')||[];assert.equal(clientRequest?.status,200);
 const response=await call('Network.getResponseBody',{requestId});
 const published=JSON.parse(response.base64Encoded?Buffer.from(response.body,'base64').toString('utf8'):response.body);
 assert.ok(Array.isArray(published));assert.equal(publicState.hidden,published.length===0);publicState.publishedCount=published.length;
 await call('Page.navigate',{url:'http://127.0.0.1:3000/admin/index.html'});
 await waitFor("!!document.querySelector('#clients-admin-panel')");
 const login=await evaluate("({visible:!document.querySelector('#login').hidden,adminTabHidden:document.querySelector('[data-tab=clients]').hidden,passwordType:document.querySelector('[name=password]').type,heading:document.querySelector('#clients-admin-panel h2').textContent})");
 assert.ok(login.visible&&login.adminTabHidden);assert.equal(login.passwordType,'password');
 const metrics=await call('Performance.getMetrics');
 assert.deepEqual(exceptions,[]);assert.deepEqual(consoleErrors,[]);
 const report={checkedAt:new Date().toISOString(),browser:'Microsoft Edge via CDP; MCP browsers could not launch Chrome',transport:'local catalogue preview and real public API; no interception; no mutations',localPreview:{count:22,logos:13,wordmarks:9,filters:true,menuLink:true,directAnchor,compactLayouts,expandedWithoutRepeatedSelection:true,layouts:localLayouts},publicState,clientRequest,login,exceptions,consoleErrors,networkFailures:failures,httpErrors:[...requests.values()].filter(r=>r.status>=400),metrics:metrics.metrics.filter(m=>['JSHeapUsedSize','Nodes','LayoutCount','TaskDuration'].includes(m.name))};
 await writeFile(new URL('../artifacts/clients-live-browser-qa.json',import.meta.url),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
}finally{await call('Page.close').catch(()=>{});ws.close()}
