import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {insuranceDefault,insuranceCategories,validateInsuranceContent} from '../js/insurance-content.js';
import {insuranceArea,validateInsurance,validRut} from '../js/insurance-validation.js';
import {insuranceMarkup,mediaUrl} from '../js/insurance-render.js';
const valid={name:'Prueba Seguros',company:'Empresa de Prueba',companyRut:'76.123.456-0',email:'seguros@example.org',phone:'+56 9 1234 5678',city:'Calama',activity:'Construcción',insuranceType:'Construcción',area:insuranceArea,message:'Necesitamos revisar protección para una nueva obra.',privacy:true,commercialConsent:true,expectedDate:''};
test('Seguro exige categoría válida, actividad, teléfono y ambos consentimientos',()=>{
 assert.deepEqual(validateInsurance({...valid,companyRut:''}),{});
 for(const data of [{...valid,insuranceType:'Inventada'},{...valid,activity:''},{...valid,phone:''},{...valid,privacy:false},{...valid,commercialConsent:false},{...valid,expectedDate:'2026-02-30'},{...valid,companyRut:'12.345.678-0'}])assert.ok(Object.keys(validateInsurance(data)).length);
 assert.equal(validRut('12.345.678-5'),true);assert.equal(validRut('12345678-0'),false);
});
test('CMS valida catálogo y evita servicios con categorías o grupos desconocidos',()=>{
 assert.equal(validateInsuranceContent(insuranceDefault),true);
 const bad=structuredClone(insuranceDefault);bad.services[0].category='Inventada';assert.equal(validateInsuranceContent(bad),false);
 const afc=structuredClone(insuranceDefault);afc.services.find(s=>s.id==='afc').informational=false;assert.equal(validateInsuranceContent(afc),false);
});
test('Render público escapa HTML, excluye servicios inactivos y no comercializa AFC',()=>{
 const c=structuredClone(insuranceDefault);c.title='<img src=x onerror=alert(1)>';c.services[0].active=false;
 const html=insuranceMarkup(c,'../');assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('onerror=alert(1)>'));assert.ok(!html.includes('<h3>Responsabilidad Civil General</h3>'));
 assert.match(html,/INFORMACIÓN OFICIAL AFC/);assert.equal(mediaUrl('javascript:alert(1)'), '');assert.equal(mediaUrl('data:text/html;base64,abc'),'');assert.equal(mediaUrl('assets/../js/app.js'),'');
});
test('Página de seguros tiene anclas, recursos y categorías del formulario válidas',async()=>{
 const html=await readFile(new URL('../seguros/index.html',import.meta.url),'utf8');const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
 for(const m of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(m[1]),m[1]);
 for(const m of html.matchAll(/(?:src|href)="(\.\.\/(?:assets|css|js)\/[^\"]+)"/g))await access(new URL('../seguros/'+m[1],import.meta.url));
 for(const category of insuranceCategories)assert.ok(html.includes(`<option>${category}</option>`));
 assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.equal((html.match(/class="insurance-card"/g)||[]).length,25);
});
let handler;globalThis.Deno={env:{get:key=>({ALLOWED_ORIGINS:'http://localhost:3000',BKO_PUBLISHABLE_KEY:'public-test',SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'server-test',CONTACT_FINGERPRINT_SECRET:'secret-for-testing-only-1234567890'})[key]},serve:fn=>handler=fn};
await import('../supabase/functions/contact/index.ts');
const request=data=>new Request('https://test.supabase.co/functions/v1/contact',{method:'POST',headers:{origin:'http://localhost:3000',apikey:'public-test','content-type':'application/json'},body:JSON.stringify({...data,website:'',startedAt:Date.now()-10000})});
test('Endpoint guarda campos de seguros y nunca acepta estado o responsable del visitante',async()=>{
 const original=globalThis.fetch;try{
  globalThis.fetch=async(url,options)=>{const {payload}=JSON.parse(options.body);assert.equal(payload.insuranceType,'Construcción');assert.equal(payload.commercialConsent,true);assert.equal(payload.activity,'Construcción');assert.ok(!('status'in payload));assert.ok(!('responsible_id'in payload));return new Response(JSON.stringify('123e4567-e89b-12d3-a456-426614174000'))};
  const response=await handler(request({...valid,companyRut:'',status:'closed',responsible_id:'intruso'}));assert.equal(response.status,201);
  assert.equal((await handler(request({...valid,commercialConsent:false}))).status,400);
 }finally{globalThis.fetch=original}
});
