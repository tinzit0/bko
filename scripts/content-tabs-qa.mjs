import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const target = await fetch('http://127.0.0.1:9333/json/new?about:blank', {method:'PUT'}).then(r=>r.json());
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
let sequence=0;
const pending=new Map(), errors=[];
ws.addEventListener('message',({data})=>{
  const message=JSON.parse(data);
  if(message.id){const p=pending.get(message.id);pending.delete(message.id);message.error?p.reject(message.error):p.resolve(message.result)}
  if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text);
});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
const evaluate=async expression=>{const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value};
try{
  await call('Runtime.enable');await call('Page.enable');
  await call('Page.navigate',{url:'http://127.0.0.1:3000/'});
  for(let i=0;i<80;i++){
    if(await evaluate("document.querySelector('#personas [data-firm-ready]') || document.querySelector('#personas[data-firm-ready] [role=tab]')"))break;
    await new Promise(r=>setTimeout(r,200));
  }
  const baseline=await evaluate(`({tabs:document.querySelectorAll('[data-content-tabs]').length,openPractices:document.querySelectorAll('#practicas details[open]').length,visiblePanels:[...document.querySelectorAll('[role=tabpanel]')].filter(p=>!p.hidden).length})`);
  assert.equal(baseline.tabs,3);assert.equal(baseline.openPractices,0);assert.equal(baseline.visiblePanels,3);
  const content=await evaluate(`document.querySelector('main').textContent`);
  for(const width of [1440,390,320]){
    await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<700});
    const results=await evaluate(`(()=>{const results=[];for(const bar of document.querySelectorAll('[data-content-tabs]')){for(const tab of bar.querySelectorAll('[role=tab]')){tab.click();const panel=document.getElementById(tab.getAttribute('aria-controls'));results.push(!panel.hidden&&tab.getAttribute('aria-selected')==='true'&&bar.querySelectorAll('[aria-selected=true]').length===1)}bar.querySelector('[role=tab]').click()}return {results,overflow:document.documentElement.scrollWidth>innerWidth}})()`);
    assert.ok(results.results.every(Boolean));assert.equal(results.overflow,false);
  }
  assert.equal(await evaluate("document.querySelector('main').textContent"),content);
  const keyboard=await evaluate(`(()=>{const first=document.querySelector('[data-content-tabs] [role=tab]');first.focus();first.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));return {selected:document.activeElement.getAttribute('aria-selected'),label:document.activeElement.textContent}})()`);
  assert.equal(keyboard.selected,'true');assert.equal(keyboard.label,'Nuestro enfoque');
  const fields=await evaluate(`(async()=>{const {discoverFields}=await import('/js/website-content.js');const fields=discoverFields();return {generated:fields.filter(f=>f.key.includes('content-tabs-')).length,firm:fields.filter(f=>f.element.matches('.firm-copy>p:not(.eyebrow):not(.intro)')).map(f=>f.key)}})()`);
  assert.equal(fields.generated,0);assert.ok(fields.firm.every(key=>key.includes('.firm-copy')||key.includes('div:nth-of-type')));
  await evaluate("document.querySelector('.firm-copy [role=tab]').click();location.hash='#mineria'");
  await new Promise(r=>setTimeout(r,200));
  assert.equal(await evaluate("document.querySelector('#mineria').open"),true);
  // A content reload must preserve one set of controls per article.
  await evaluate("document.dispatchEvent(new Event('bko:firm-loaded'))");
  assert.equal(await evaluate("document.querySelectorAll('[data-content-tabs]').length"),3);
  assert.deepEqual(errors,[]);
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await evaluate("document.querySelector('#personas').scrollIntoView({behavior:'instant'})");
  await new Promise(r=>setTimeout(r,300));
  const screenshot=await call('Page.captureScreenshot',{format:'png'});
  await writeFile(new URL('../artifacts/content-tabs-mobile.png',import.meta.url),Buffer.from(screenshot.data,'base64'));
  console.log(JSON.stringify({baseline,keyboard,fields,widths:[1440,390,320],errors,passed:true},null,2));
}finally{await call('Page.close');ws.close()}
