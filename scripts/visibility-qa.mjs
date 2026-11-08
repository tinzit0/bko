import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const t=await fetch('http://127.0.0.1:9333/json/new?http://127.0.0.1:3000/index.html',{method:'PUT'}).then(r=>r.json()),ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let seq=0;const pending=new Map(),exceptions=[];
ws.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails.text)});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function contrast(a,b){const lum=s=>{const c=s.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722};const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
try{
 await call('Runtime.enable');await call('Page.enable');await call('DOM.enable');await call('CSS.enable');
 for(let i=0;i<90;i++){if(await ev("document.querySelector('[data-firm-people]')?.hasAttribute('data-firm-ready')"))break;await pause(200)}
 assert.ok(await ev("!!document.querySelector('#laboral .button.profile-link')"));
 const results=[];
 for(const width of [1440,820,390,320]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<700});
  const buttons=await ev(`([...document.querySelectorAll('#personas .button.profile-link')].map(e=>{const s=getComputedStyle(e),card=e.closest('article'),r=e.getBoundingClientRect(),p=card.getBoundingClientRect();let b=e,bg=s.backgroundColor;while(bg==='rgba(0, 0, 0, 0)'&&b.parentElement){b=b.parentElement;bg=getComputedStyle(b).backgroundColor}return{text:e.textContent.trim(),color:s.color,background:bg,visible:s.display!=='none'&&s.visibility==='visible',width:r.width,inside:r.left>=p.left&&r.right<=p.right+1,href:e.getAttribute('href')}}))`);
  for(const button of buttons){button.contrast=contrast(button.color,button.background);assert.ok(button.visible&&button.width>0&&button.inside,JSON.stringify({width,...button}));assert.ok(button.contrast>=4.5,JSON.stringify({width,...button}));assert.equal(button.href,'index.html#contacto')}
  assert.ok(await ev('document.documentElement.scrollWidth<=innerWidth'));
  if(width===1440||width===390){await ev("(()=>{document.documentElement.style.scrollBehavior='auto';const a=document.querySelector('#laboral .button.profile-link');scrollTo(0,a.getBoundingClientRect().bottom+scrollY-innerHeight+120)})()");await pause(300);const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(new URL(`artifacts/orientation-fixed-${width}.png`,root),Buffer.from(shot.data,'base64'))}
  results.push({width,buttons});
 }
 const {root:dom}=await call('DOM.getDocument'),{nodeId}=await call('DOM.querySelector',{nodeId:dom.nodeId,selector:'#laboral .button.profile-link'});await call('CSS.forcePseudoState',{nodeId,forcedPseudoClasses:['hover']});
 await pause(600);const hover=await ev("(()=>{const s=getComputedStyle(document.querySelector('#laboral .button.profile-link'));return{color:s.color,background:s.backgroundColor}})()");assert.ok(contrast(hover.color,hover.background)>=4.5,JSON.stringify(hover));await call('CSS.forcePseudoState',{nodeId,forcedPseudoClasses:[]});
 await ev("document.querySelector('#laboral .button.profile-link').click()");await pause(900);assert.equal(await ev('location.hash'),'#contacto');
 assert.deepEqual(exceptions,[]);await writeFile(new URL('artifacts/visibility-fixes-qa.json',root),JSON.stringify({orientation:results,hover,contactNavigation:true,exceptions},null,2));console.log('Visibilidad y contraste de orientación: escritorio, tablet, móvil, hover y enlace OK.');
}finally{await call('Page.close');ws.close()}
