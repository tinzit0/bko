// Transport fixtures exist only in this local QA harness; no fake backend in the site.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {insuranceDefault} from '../js/insurance-content.js';
const t=await fetch('http://127.0.0.1:9333/json/new?http://127.0.0.1:3000',{method:'PUT'}).then(r=>r.json());
const ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true})});
let seq=0;const pending=new Map(),exceptions=[];let saved=structuredClone(insuranceDefault),revision=1,failSubmit=true,submitted=null,crmUpdated=false;
const uuid='123e4567-e89b-12d3-a456-426614174000';
const record={id:uuid,name:'Prueba Local Seguros',email:'qa@example.org',phone:'+56912345678',city:'Calama',company:'Empresa QA',area:'Negocios y seguros corporativos',insurance_type:'Construcción',activity:'Construcción',message:'Necesitamos orientación para un proyecto de prueba local.',created_at:'2026-11-07T12:00:00Z',privacy_accepted:true,commercial_consent:true,responsible_id:'roxana',status:'new',quotation_followup:false};
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
ws.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);if(!p)return;pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails.text);if(m.method==='Fetch.requestPaused')mock(m.params).catch(error=>exceptions.push(error.message))});
async function mock({requestId,request}){
 const u=new URL(request.url);let result=null,status=200;const payload=request.postData?JSON.parse(request.postData):{};
 if(request.method==='OPTIONS'){await call('Fetch.fulfillRequest',{requestId,responseCode:204,responseHeaders:[{name:'Access-Control-Allow-Origin',value:'http://127.0.0.1:3000'},{name:'Access-Control-Allow-Headers',value:'apikey,authorization,content-type,prefer'},{name:'Access-Control-Allow-Methods',value:'GET,POST,PATCH,OPTIONS'}]});return}
 if(u.pathname.includes('/auth/v1/token'))result={access_token:'qa-only-token',refresh_token:'qa-only-refresh',expires_in:3600,user:{id:uuid}};
 else if(u.pathname.includes('/functions/v1/contact')){submitted=payload;status=failSubmit?503:201;result=failSubmit?{ok:false}:{ok:true,id:uuid}}
 else if(u.pathname.endsWith('/site_content')){if(request.method==='PATCH'){saved=payload.value;revision++}result=[{key:'insurance',value:saved,revision}]}
 else if(u.pathname.endsWith('/bko_admin_members'))result=[{role:'admin'}];
 else if(u.pathname.endsWith('/insurance_responsibles'))result=[{id:'roxana',name:'Roxana Ximena Oyarzún Bustamante',active:true}];
 else if(u.pathname.endsWith('/consultations')){if(request.method==='PATCH'){Object.assign(record,payload);crmUpdated=true}result=[record]}
 else if(u.pathname.endsWith('/insurance_metrics'))result={received:1,pending:record.status==='new'?1:0,construction:1,guarantees:0,liability:0,quotationFollowup:record.quotation_followup?1:0};
 else result={};
 await call('Fetch.fulfillRequest',{requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'http://127.0.0.1:3000'}],body:Buffer.from(JSON.stringify(result)).toString('base64')});
}
const ev=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
try{
 await mkdir(new URL('../artifacts/',import.meta.url),{recursive:true});await call('Page.enable');await call('Runtime.enable');await call('Fetch.enable',{patterns:[{urlPattern:'https://*.supabase.co/*'}]});
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 const layouts=[];
 for(const path of ['/seguros/index.html','/equipo/roxana-ximena-oyarzun-bustamante.html','/admin/index.html'])for(const width of[320,390,650,820,1024,1440]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<1200});await call('Page.navigate',{url:'http://127.0.0.1:3000'+path});await pause(350);
  const result=await ev(`(async()=>{for(const i of document.images)i.loading='eager';await Promise.all([...document.images].map(i=>i.decode()));return{width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,h1:document.querySelectorAll('h1').length,images:[...document.images].every(i=>i.naturalWidth>0)}})()`);
  assert.equal(result.overflow,false,path+' '+width);assert.equal(result.h1,1);assert.equal(result.images,true);layouts.push({path,...result});
  if(path==='/seguros/index.html'&&(width===390||width===1440)){
   const shot=await call('Page.captureScreenshot',{format:'png'});await writeFile(new URL('../artifacts/insurance-'+width+'.png',import.meta.url),Buffer.from(shot.data,'base64'));
  }
 }
 await call('Page.navigate',{url:'http://127.0.0.1:3000/seguros/index.html'});await pause(500);
 await ev(`document.querySelector('[data-insurance-category="Licitaciones y Garantías"]').click()`);assert.equal(await ev(`document.querySelector('#ins-insuranceType').value`),'Licitaciones y Garantías');
 await ev(`document.querySelector('#insurance-form').requestSubmit()`);assert.equal(await ev(`document.querySelector('#ins-name').getAttribute('aria-invalid')`),'true');
 await ev(`(()=>{const f=document.querySelector('#insurance-form');for(const[k,v]of Object.entries({name:'Prueba Local Seguros',email:'qa@example.org',phone:'+56912345678',city:'Calama',activity:'Construcción',insuranceType:'Construcción',message:'Necesitamos orientación para un proyecto de prueba local.'}))f.elements[k].value=v;f.elements.privacy.checked=true;f.elements.commercialConsent.checked=true})()`);await pause(3100);
 await ev(`document.querySelector('#insurance-form').requestSubmit()`);await pause(200);assert.equal(await ev(`document.querySelector('#insurance-status').dataset.state`),'error');
 failSubmit=false;await ev(`document.querySelector('#insurance-form').requestSubmit()`);await pause(200);assert.equal(await ev(`document.querySelector('#insurance-status').dataset.state`),'success');assert.equal(submitted.insuranceType,'Construcción');assert.equal(submitted.commercialConsent,true);
 await call('Page.navigate',{url:'http://127.0.0.1:3000/admin/index.html'});await pause(300);
 await ev(`document.querySelector('#login input[name="email"]').value='qa@example.org';document.querySelector('#login input[name="password"]').value='local-fixture-only';document.querySelector('#login').requestSubmit()`);await pause(450);
 assert.equal(await ev(`document.querySelector('#workspace').hidden`),false);assert.equal(await ev(`document.querySelectorAll('.admin-inquiry').length`),1);
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true});await pause(100);assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false,'CRM móvil');
 await ev(`document.querySelector('[data-tab="cms"]').click()`);assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false,'CMS móvil');
 await ev(`document.querySelector('[data-tab="crm"]').click()`);await pause(200);
 await ev(`document.querySelector('.admin-followup select[name="status"]').value='in_progress';document.querySelector('.admin-followup').requestSubmit()`);await pause(200);assert.equal(crmUpdated,true);assert.equal(record.status,'in_progress');
 await ev(`document.querySelector('[data-tab="cms"]').click();document.querySelector('[data-path="title"]').value='Título editado desde CMS';document.querySelector('[data-path="roxana.role"]').value='Cargo revisado en CMS';document.querySelector('#content-form').requestSubmit()`);await pause(250);assert.equal(saved.title,'Título editado desde CMS');assert.equal(saved.roxana.role,'Cargo revisado en CMS');
 await call('Page.navigate',{url:'http://127.0.0.1:3000/seguros/index.html'});await pause(400);assert.equal(await ev(`document.querySelector('.insurance-hero h1').textContent`),'Título editado desde CMS');
 await call('Page.navigate',{url:'http://127.0.0.1:3000/equipo/roxana-ximena-oyarzun-bustamante.html'});await pause(400);assert.equal(await ev(`document.querySelector('.profile-role').textContent`),'Cargo revisado en CMS');
 assert.deepEqual(exceptions,[]);const report={layouts,formValidation:'OK',categorySelection:'OK',failedStorage:'OK',confirmedStorage:'OK (transport fixture)',crmUpdate:'OK (transport fixture)',cmsEditAndPublicRead:'OK (transport fixture)',exceptions,liveDatabaseVerified:false};await writeFile(new URL('../artifacts/insurance-qa-results.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await call('Page.close');ws.close()}
