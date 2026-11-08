// Read-only availability audit. HTTP success never grants identity or publication approval.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const rows=JSON.parse(await readFile(new URL('supabase/seeds/clients.json',root),'utf8'));
const results=[];
async function check(row){
 const url=row.website_original||row.website_url;
 if(!url)return {slug:row.slug,name:row.name,url:'',result:'sin URL oficial confirmada'};
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(12000),headers:{'User-Agent':'BKO-Link-Review/1.0','Accept':'text/html'},redirect:'follow'});
  const reader=response.body?.getReader(),chunks=[];let size=0;
  if(reader){while(size<250000){const {done,value}=await reader.read();if(done)break;chunks.push(value);size+=value.length}await reader.cancel()}
  const html=Buffer.concat(chunks).toString('utf8');
  const title=(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'').replace(/\s+/g,' ').trim().slice(0,250);
  const warning=/account suspended|cuenta suspendida|under construction|sitio en construcci[oó]n/i.test(title+' '+html.slice(0,12000));
  return {slug:row.slug,name:row.name,url,resolved:response.url,status:response.status,title,warning,result:response.ok?'respuesta HTTP disponible; identidad requiere revisión':'no activar: error HTTP'};
 }catch(error){return {slug:row.slug,name:row.name,url,result:'no verificado: error de conexión',error:error.cause?.code||error.name}}
}
for(let i=0;i<rows.length;i+=5)results.push(...await Promise.all(rows.slice(i,i+5).map(check)));
await mkdir(new URL('artifacts/',root),{recursive:true});
await writeFile(new URL('artifacts/client-links-current.json',root),JSON.stringify({checkedAt:new Date().toISOString(),readOnly:true,identityNotAutomaticallyApproved:true,results},null,2));
console.log(JSON.stringify(results.map(({name,status,result,warning,error})=>({name,status,result,warning,error})),null,2));
