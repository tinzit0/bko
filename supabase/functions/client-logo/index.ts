import {validateLogoFile,logoStoragePath} from '../../../js/clients-model.js';
export async function clientLogo(request:Request,env:(key:string)=>string|undefined,transport:typeof fetch=fetch){
 const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox"};
 const error=(status:number)=>new Response(null,{status,headers});
 if(request.method!=='GET'&&request.method!=='HEAD')return error(405);
 const publicKey=env('BKO_PUBLISHABLE_KEY');if(!publicKey)return error(503);
 if((request.headers.get('apikey')||new URL(request.url).searchParams.get('apikey'))!==publicKey)return error(403);
 const id=new URL(request.url).searchParams.get('id');if(!id||!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id))return error(400);
 const url=env('SUPABASE_URL'),key=env('SUPABASE_SERVICE_ROLE_KEY');if(!url||!key)return error(503);
 const auth={apikey:key,Authorization:`Bearer ${key}`};
 try{
  const query=new URLSearchParams({select:'logo_storage_path',id:'eq.'+id,active:'eq.true',published:'eq.true',relation_authorized:'eq.true',logo_verified:'eq.true',logo_authorized:'eq.true'});
  const record=await transport(`${url}/rest/v1/bko_clients?${query}`,{headers:auth,signal:AbortSignal.timeout(8000)});if(!record.ok)return error(503);const rows=await record.json();const path=rows[0]?.logo_storage_path;if(!logoStoragePath(path))return error(404);
  const stored=await transport(`${url}/storage/v1/object/authenticated/bko-client-logos/${encodeURIComponent(path)}`,{headers:auth,signal:AbortSignal.timeout(10000)});if(!stored.ok)return error(404);
  const type=stored.headers.get('content-type')?.split(';')[0]||'';const reader=stored.body?.getReader();if(!reader)return error(404);let size=0;const chunks:Uint8Array[]=[];
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2000000){await reader.cancel();return error(413)}chunks.push(value)}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
  await validateLogoFile(new File([bytes],path,{type}));
  return new Response(request.method==='HEAD'?null:bytes,{status:200,headers:{...headers,'Content-Type':type,'Content-Length':String(size),'Content-Disposition':`inline; filename="${path}"`}});
 }catch{return error(503)}
}
if(import.meta.main)Deno.serve((request:Request)=>clientLogo(request,key=>Deno.env.get(key)));
