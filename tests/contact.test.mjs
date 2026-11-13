import test from 'node:test';
import assert from 'node:assert/strict';
let handler;
const env={ALLOWED_ORIGINS:'http://localhost:3000',BKO_PUBLISHABLE_KEY:'test-public-key',SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-server-key',CONTACT_FINGERPRINT_SECRET:'test-only-secret-with-enough-entropy'};
globalThis.Deno={env:{get:key=>env[key]},serve:fn=>{handler=fn}};
await import('../supabase/functions/contact/index.ts');
const valid={name:'Persona de Prueba',email:'prueba@example.org',phone:'',company:'',city:'Calama',area:'Derecho laboral',message:'Consulta de prueba local para validar el servidor.',privacy:true,website:'',startedAt:Date.now()-10000};
function request(body=valid,origin='http://localhost:3000'){return new Request('https://test.supabase.co/functions/v1/contact',{method:'POST',headers:{origin,apikey:'test-public-key','content-type':'application/json'},body:JSON.stringify(body)})}
test('Rechaza orígenes no autorizados antes de almacenar',async()=>{assert.equal((await handler(request(valid,'https://untrusted.example'))).status,403)});
test('Responde preflight y rechaza método incorrecto',async()=>{
  const headers={origin:'http://localhost:3000'};
  assert.equal((await handler(new Request('https://test.example',{method:'OPTIONS',headers}))).status,204);
  assert.equal((await handler(new Request('https://test.example',{headers}))).status,405);
});
test('Rechaza datos alterados, spam, tipo inválido y cuerpos grandes',async()=>{
  for(const data of [{...valid,privacy:false},{...valid,website:'spam'},{...valid,name:42},{...valid,startedAt:Date.now()+100000}]) assert.equal((await handler(request(data))).status,400);
  assert.equal((await handler(request({...valid,message:'x'.repeat(25000)}))).status,413);
});
test('Solo confirma éxito al recibir UUID de almacenamiento',async()=>{
  const original=globalThis.fetch;
  try{
    const id='123e4567-e89b-12d3-a456-426614174000';
    globalThis.fetch=async(url,options)=>{
      assert.equal(url,'https://test.supabase.co/rest/v1/rpc/submit_consultation');
      const body=JSON.parse(options.body);
      assert.equal(body.client_fingerprint.length,64);
      assert.equal(body.payload.name,valid.name);
      assert.ok(!('startedAt' in body.payload));
      return new Response(JSON.stringify(id),{status:200});
    };
    const response=await handler(request());assert.equal(response.status,201);assert.deepEqual(await response.json(),{ok:true,id});
    globalThis.fetch=async()=>new Response(JSON.stringify({message:'rate_limit_exceeded'}),{status:400});
    assert.equal((await handler(request())).status,429);
    globalThis.fetch=async()=>new Response(JSON.stringify({ok:true}),{status:200});
    assert.equal((await handler(request())).status,503);
  }finally{globalThis.fetch=original}
});
test('Aviso por WhatsApp incluye todos los campos y el mensaje completo, dividido si es largo',async()=>{
  const {whatsAppText,splitWhatsApp}=await import('../supabase/functions/contact/index.ts');
  const text=whatsAppText({...valid,phone:'+56 9 1111 1111',message:'Línea 1\nLínea 2 *tal cual*'},'abc',false);
  for(const part of ['*Nombre:* Persona de Prueba','*Correo:* prueba@example.org','*Teléfono:* +56 9 1111 1111','*Ciudad:* Calama','*Área:* Derecho laboral','Línea 1\nLínea 2 *tal cual*','Registro: abc'])assert.ok(text.includes(part),part);
  assert.ok(!text.includes('Empresa'));
  const long='palabra '.repeat(600),parts=splitWhatsApp(long);
  assert.ok(parts.length>1&&parts.every(p=>p.length<=1420));assert.match(parts[0],/^\(1\/\d\)\n/);
  assert.equal(parts.map(p=>p.replace(/^\(\d+\/\d+\)\n/,'')).join(' ').replace(/\s+/g,' ').trim(),long.trim());
  assert.deepEqual(splitWhatsApp('corto'),['corto']);
});
test('Con CALLMEBOT_APIKEY envía la consulta al número asociado y un fallo no afecta la respuesta',async()=>{
  const original=globalThis.fetch,calls=[];env.CALLMEBOT_APIKEY='clave-prueba';
  try{
    globalThis.fetch=async(url)=>{calls.push(String(url));if(String(url).includes('callmebot'))return new Response('Message queued',{status:200});return new Response(JSON.stringify('123e4567-e89b-12d3-a456-426614174000'),{status:200})};
    assert.equal((await handler(request())).status,201);
    const wa=new URL(calls.find(u=>u.includes('callmebot')));
    assert.equal(wa.searchParams.get('phone'),'+56974826025');assert.equal(wa.searchParams.get('apikey'),'clave-prueba');assert.ok(wa.searchParams.get('text').includes(valid.message));
    globalThis.fetch=async(url)=>String(url).includes('callmebot')?new Response('x',{status:500}):new Response(JSON.stringify('123e4567-e89b-12d3-a456-426614174000'),{status:200});
    assert.equal((await handler(request())).status,201);
  }finally{globalThis.fetch=original;delete env.CALLMEBOT_APIKEY}
});
