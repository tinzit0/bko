import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseClientsCsv} from '../scripts/import-clients.mjs';
import {publishedClients,clientStatistics,validateClient,validateLogoFile,websiteUrl,logoLocalPath} from '../js/clients-model.js';
import {clientsMarkup,clientCard} from '../js/clients-render.js';
const root=new URL('../',import.meta.url),raw=await readFile(new URL('clientes/clientes_confian_en_nosotros.csv',root),'utf8'),allRows=JSON.parse(await readFile(new URL('supabase/seeds/clients.json',root),'utf8'));
const originalSlugs=new Set(parseClientsCsv(raw).map(r=>r.slug)),rows=allRows.filter(r=>originalSlugs.has(r.slug));
const approved=r=>({...r,id:'123e4567-e89b-12d3-a456-426614174000',active:true,published:true,relation_authorized:true});

test('Casa Vander se conserva como cliente adicional con web oficial y logotipo válido',async()=>{
 const additions=JSON.parse(await readFile(new URL('clientes/clientes-adicionales.json',root),'utf8'));
 const client=allRows.find(r=>r.slug==='casa-vander');assert.ok(client&&validateClient(client));
 assert.equal(allRows.filter(r=>r.slug===client.slug).length,1);assert.equal(client.sector,'turismo');
 assert.ok(additions.some(r=>r.slug===client.slug));assert.ok(publishedClients([client]).length===1);
 const card=clientCard(client);assert.match(card,/href="https:\/\/www.casavander.cl\/"/);assert.match(card,/assets\/clientes\/casa-vander.png/);
 const bytes=await readFile(new URL(client.logo_local_path,root));await validateLogoFile(new File([bytes],'casa-vander.png',{type:'image/png'}));
});

test('Estadísticas distinguen publicación efectiva y autorizaciones, sin contar permisos de logo inexistentes',()=>{
 const stats=clientStatistics(rows);assert.equal(stats.total,22);assert.equal(stats.published,0);assert.equal(stats.pending,22);assert.equal(stats.withLogo,16);assert.equal(stats.withoutLogo,6);assert.equal(stats.featured,10);assert.equal(Object.values(stats.sectors).reduce((a,b)=>a+b,0),22);
 const textOnly={...approved(rows.find(r=>!r.logo_local_path)),logo_authorized:false};
 assert.equal(clientStatistics([textOnly]).pending,0);
 assert.equal(clientStatistics([{...approved(rows[0]),active:false}]).published,0);
 assert.equal(clientStatistics([{...approved(rows[0]),logo_authorized:false}]).pending,1);
});

test('Vista previa de archivo sin guardar no concede permisos de publicación',()=>{
 const row={...rows[0],logo_verified:false,logo_authorized:false};
 const previewLogoUrls=new Map([[row.slug,'blob:private-preview']]);
 assert.match(clientCard(row,{preview:true,previewLogoUrls}),/blob:private-preview/);
 assert.ok(!clientCard(row,{previewLogoUrls}).includes('blob:private-preview'));
 assert.equal(clientsMarkup([row],{previewLogoUrls}),'');
});
test('Recupera las 22 filas del CSV irregular y conserva nombres, enlaces y observaciones',()=>{
 const parsed=parseClientsCsv(raw);assert.equal(parsed.length,22);assert.equal(new Set(parsed.map(r=>r.slug)).size,22);assert.equal(parsed[0].name,'Afüen / Afüen y Cía.');assert.equal(parsed[13].name,'CAUCE Gestión Integral');assert.equal(parsed[13].original_name,'CAUCE Gestión Integral / caucegestion.cl');assert.equal(parsed[13].website_url,'');assert.equal(parsed[16].website_url,'');assert.match(parsed[16].observations,/Puerto Varas; sin web oficial confirmada/);assert.match(parsed[18].observations,/directorios; comprobar vigencia/);assert.equal(parsed[3].website_url,'http://www.franciscocayo.cl/');assert.ok(parsed.every(r=>r.original_row.length>0));assert.throws(()=>parseClientsCsv(raw.split('\n').slice(0,-3).join('\n')));
});
test('Importación repetible no sobrescribe datos del CMS y conserva los 22 registros',async()=>{
 const sql=await readFile(new URL('supabase/seeds/clients.sql',root),'utf8');assert.match(sql,/on conflict\(slug\) do nothing/);assert.ok(rows.every(validateClient));assert.equal(rows.filter(r=>r.logo_verified).length,16);assert.equal(rows.filter(r=>r.published).length,0);assert.equal(rows.filter(r=>!r.logo_local_path).length,6);
});
test('Publica solo relaciones autorizadas; un sitio web no verifica el logotipo',()=>{
 const r=rows[0];assert.equal(clientsMarkup(rows), '');assert.equal(publishedClients([{...approved(r),active:false}]).length,0);assert.equal(publishedClients([{...approved(r),relation_authorized:false}]).length,0);
 let html=clientCard(approved({...r,logo_authorized:false}));assert.ok(!html.includes('<img'));assert.match(html,/client-wordmark/);html=clientCard(approved({...r,logo_authorized:true}));assert.match(html,/<img/);assert.match(html,/Logotipo de Afüen/);assert.ok(!html.includes('Pendiente'));assert.ok(!html.includes('observations'));
});
test('No enlaza dominios sin verificar ni recursos que no sean logotipos locales',()=>{
 assert.equal(websiteUrl('javascript:alert(1)'), '');assert.equal(websiteUrl('https://user:password@example.com'), '');assert.equal(logoLocalPath('assets/clientes/../evil.svg'), '');
 const brasas=approved(rows.find(r=>r.slug==='las-buenas-brasas'));assert.ok(!clientCard(brasas).includes('<a '));const malicious={...approved(rows[0]),name:'<img onerror=alert(1)>',website_url:'javascript:alert(1)',website_verified:true,logo_authorized:false};assert.ok(clientCard(malicious).includes('&lt;img'));assert.ok(!clientCard(malicious).includes('<a '));
});
test('Empresas se muestran una sola vez, sin directorio ni filtros de especialidades',()=>{
 const visible=rows.map(approved);const html=clientsMarkup(visible);assert.equal((html.match(/data-client-slug=/g)||[]).length,22);assert.ok(!/clients-directory|data-client-filter|clients-sort/.test(html));const order=publishedClients(visible.map(r=>({...r,sort_order:r.slug==='directemar'?-1:r.sort_order})));assert.equal(order[0].slug,'directemar');
});
test('Valida formatos reales de los 13 originales y rechaza SVG activo, recursos externos y tamaños excesivos',async()=>{
 const manifest=JSON.parse(await readFile(new URL('docs/interno/clientes/logotipos.json',root),'utf8'));
 for(const m of manifest){const bytes=await readFile(new URL(m.path,root));await validateLogoFile(new File([bytes],m.path,{type:m.mime}));assert.equal(m.visualVerification,'confirmed');assert.equal(m.authorization,'pending')}
 await assert.rejects(validateLogoFile(new File(['<svg><script>alert(1)</script></svg>'],'logo.svg',{type:'image/svg+xml'})));
 await assert.rejects(validateLogoFile(new File(['<svg><image href="https://external.example/evil.png"/></svg>'],'logo.svg',{type:'image/svg+xml'})));
 await assert.rejects(validateLogoFile(new File(['<!ENTITY x SYSTEM "file:///secret"><svg/>'],'logo.svg',{type:'image/svg+xml'})));
 await assert.rejects(validateLogoFile(new File(['not a png'],'fake.png',{type:'image/png'})));
 await assert.rejects(validateLogoFile(new File([new Uint8Array(2000001)],'big.png',{type:'image/png'})));
});
test('La sección vive solo en la portada y excluye los datos internos del editor público',async()=>{
 const home=await readFile(new URL('index.html',root),'utf8');assert.equal((home.match(/id="clientes"/g)||[]).length,1);assert.ok(home.indexOf('id="clientes"')>home.indexOf('id="firma"'));assert.ok(home.indexOf('id="clientes"')<home.indexOf('id="practicas"'));assert.match(home,/data-clients hidden/);const editor=await readFile(new URL('js/website-content.js',root),'utf8');assert.match(editor,/\[data-clients\]/);const css=await readFile(new URL('css/clients.css',root),'utf8');assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/object-fit:contain/);assert.ok(!css.includes('grayscale'));
});
const edgeSource=(await readFile(new URL('supabase/functions/client-logo/index.ts',root),'utf8')).replace('../../../js/clients-model.js',new URL('../js/clients-model.js',import.meta.url).href).replace('request:Request,env:(key:string)=>string|undefined,transport:typeof fetch=fetch','request,env,transport=fetch').replace('(status:number)','(status)').replace('const chunks:Uint8Array[]=[]','const chunks=[]').replace('(request:Request)=>','(request)=>');
const {clientLogo}=await import('data:text/javascript;base64,'+Buffer.from(edgeSource).toString('base64'));
const env=k=>({SUPABASE_URL:'https://project.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-server-key',BKO_PUBLISHABLE_KEY:'test-publishable-key'})[k];
test('El endpoint de logotipos niega archivos de clientes no publicados y no entrega secretos',async()=>{
 let calls=0;const response=await clientLogo(new Request('https://example.com/client-logo?id=123e4567-e89b-12d3-a456-426614174000&apikey=test-publishable-key'),env,async url=>{calls++;const q=new URL(url).searchParams;for(const k of ['active','published','relation_authorized','logo_verified','logo_authorized'])assert.equal(q.get(k),'eq.true');return Response.json([])});
 assert.equal(response.status,404);assert.equal(calls,1);assert.equal(await response.text(),'');assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal((await clientLogo(new Request('https://example.com/client-logo'),env)).status,403);
});
test('El endpoint entrega bytes originales verificados y rechaza SVG manipulados',async()=>{
 const png=await readFile(new URL('assets/clientes/quimlab-chile.png',root));let calls=0;const url='https://example.com/client-logo?id=123e4567-e89b-12d3-a456-426614174000&apikey=test-publishable-key';
 const response=await clientLogo(new Request(url),env,async()=>++calls===1?Response.json([{logo_storage_path:'original.png'}]):new Response(png,{headers:{'Content-Type':'image/png'}}));assert.equal(response.status,200);assert.deepEqual(Buffer.from(await response.arrayBuffer()),png);assert.equal(response.headers.get('X-Content-Type-Options'),'nosniff');
 calls=0;const invalid=await clientLogo(new Request(url),env,async()=>++calls===1?Response.json([{logo_storage_path:'unsafe.svg'}]):new Response('<svg><script>alert(1)</script></svg>',{headers:{'Content-Type':'image/svg+xml'}}));assert.equal(invalid.status,503);
});
