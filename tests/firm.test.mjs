import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {validateRecord,visibleRecords,profilePath} from '../js/firm-model.js';
import {teamMarkup,profileMarkup,cauceMarkup} from '../js/firm-render.js';
const records=JSON.parse(await readFile(new URL('../supabase/seeds/firm.json',import.meta.url),'utf8'));
test('Equipo conserva el orden solicitado y permite modificarlo desde los datos',()=>{
 const team=visibleRecords(records).filter(r=>r.kind==='professional');assert.deepEqual(team.map(r=>r.id),['jorge-ivan-saavedra-bentjerodt','camila-alejandra-kopplin-lanata','fenella-reyes-gonzalo','luis-miranda-chavarria','roxana-ximena-oyarzun-bustamante','estefania-benitez-garcia']);
 const reordered=team.map(r=>({...r,sort_order:r.id.startsWith('luis')?-1:r.sort_order}));assert.equal(visibleRecords(reordered)[0].id,'luis-miranda-chavarria');
 assert.ok(records.every(validateRecord));
});
test('No renderiza borradores, perfiles inactivos ni contactos sin autorización',()=>{
 const row=structuredClone(records[0]);row.data.email='privado@example.org';row.data.contactAuthorized=false;
 assert.ok(!profileMarkup(row,'../',records).includes('privado@example.org'));
 row.active=false;assert.equal(teamMarkup([row]),'');row.active=true;row.published=false;assert.equal(teamMarkup([row]),'');
 row.published=true;row.data.contactAuthorized=true;assert.match(profileMarkup(row,'../',records),/mailto:privado@example.org/);
});
test('Escapa biografías y rechaza imágenes, identificadores y relaciones inválidos',()=>{
 const row=structuredClone(records[0]);row.data.name='<img src=x onerror=alert(1)>';assert.ok(teamMarkup([row]).includes('&lt;img'));row.data.image='javascript:alert(1)';assert.equal(validateRecord(row),false);
 row.data.image='';row.id='../escape';assert.equal(validateRecord(row),false);row.id='safe';row.data.areas=['inventada'];assert.equal(validateRecord(row),false);
 assert.equal(profilePath('nuevo-profesional'),'equipo/perfil.html?id=nuevo-profesional');
});
test('Conserva la trayectoria completa de Jorge, Camila y la metodología de CAUCE',()=>{
 const j=records[0].data,c=records[1].data,cauce=records.find(r=>r.id==='cauce');assert.equal(j.sections.length,5);assert.match(JSON.stringify(j),/Hospital Luis Tisné/);assert.match(JSON.stringify(j),/Kampel Martian/);assert.match(JSON.stringify(j),/AFÜEN/);
 assert.equal(c.sections.length,5);assert.match(JSON.stringify(c),/32 horas/);assert.match(JSON.stringify(c),/California Western School of Law/);assert.match(JSON.stringify(c),/Derecho Colectivo del Trabajo en Chile/);
 assert.equal(cauce.data.sections.length,9);const html=cauceMarkup(cauce,records);assert.match(html,/Información no disponible/);assert.match(html,/tramos de vigencia/);assert.match(html,/profesionales jurídicos/);assert.ok(!html.includes('interestCriteria'));
});
test('Perfiles, fotografías originales y CAUCE existen; solo hay cuatro áreas principales',async()=>{
 for(const r of records.filter(r=>r.kind==='professional')){await access(new URL('../'+profilePath(r.id),import.meta.url));if(r.data.image)await access(new URL('../'+r.data.image,import.meta.url))}
 const home=await readFile(new URL('../index.html',import.meta.url),'utf8');assert.equal((home.match(/class="practice"/g)||[]).length,4);assert.ok(!home.includes('id="acuicultura"'));assert.match(home,/Concesiones de acuicultura/);assert.ok(!/Derecho(?:<br>| )corporativo|Derecho inmobiliario/i.test(home));await access(new URL('../cauce/index.html',import.meta.url));
 assert.ok(!/<h[23][^>]*>Acuicultura/i.test(home),'Acuicultura no debe quedar como tarjeta principal');
});
test('La migración protege borradores y configuración privada, y guarda con revisión',async()=>{
 const sql=await readFile(new URL('../supabase/migrations/20261107212814_firm_professionals_people_cauce.sql',import.meta.url),'utf8');assert.match(sql,/alter table public.bko_content enable row level security/);assert.match(sql,/using\(active and published\)/);assert.match(sql,/alter table public.bko_content_private enable row level security/);assert.match(sql,/security invoker/);assert.match(sql,/revision=expected_revision/);assert.match(sql,/no_unapproved_email/);
});
test('Las páginas conservan metadatos, recursos y enlaces internos válidos',async()=>{
 const paths=['index.html','seguros/index.html','cauce/index.html','equipo/perfil.html',...records.filter(r=>r.kind==='professional').map(r=>profilePath(r.id))],pages=new Map();
 for(const path of paths)pages.set(path,await readFile(new URL('../'+path,import.meta.url),'utf8'));
 for(const [path,html]of pages){
  assert.equal((html.match(/<h1\b/g)||[]).length,1,path);assert.match(html,/<meta name="description" content="[^\"]+"/);JSON.parse(html.match(/application\/ld\+json"[^>]*>(.*?)<\/script>/s)[1]);
  assert.equal((html.match(/class="footer-admin-access"/g)||[]).length,1,`${path}: acceso administrativo duplicado`);
  const ids=[...html.matchAll(/\bid="([^\"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,path);
  for(const m of html.matchAll(/(?:href|src)="([^\"]+)"/g)){
   const href=m[1];if(/^[a-z]+:|^\/\//i.test(href))continue;
   const url=new URL(href,new URL('../'+path,import.meta.url));await access(url);
   if(url.hash&&url.pathname.endsWith('.html')){const target=await readFile(url,'utf8');assert.ok(target.includes(`id="${url.hash.slice(1)}"`),`${path}: ${href}`)}
  }
 }
});
