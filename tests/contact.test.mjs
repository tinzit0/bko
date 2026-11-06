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
