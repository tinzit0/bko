// Fetch only supplied official pages. Assets are candidates until inspected by a person.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url),rows=JSON.parse(await readFile(new URL('supabase/seeds/clients.json',root),'utf8'));
await mkdir(new URL('artifacts/client-sources/',root),{recursive:true});
const decode=s=>s.replaceAll('&amp;','&').replaceAll('&#038;','&').replaceAll('&quot;','"');
const results=await Promise.all(rows.map(async r=>{
 if(!r.website_original)return{slug:r.slug,name:r.name,status:'no_official_url',candidates:[]};
 try{
  const response=await fetch(r.website_original,{signal:AbortSignal.timeout(20000),headers:{'User-Agent':'Mozilla/5.0 (compatible; BKO asset review)'}});
  const html=await response.text();await writeFile(new URL(`artifacts/client-sources/${r.slug}.html`,root),html);
  const candidates=[];
  for(const m of html.matchAll(/<img\b[^>]*>|url\([^)]*\)|["'][^"'\s<>]*logo[^"'\s<>]*\.(?:svg|png|webp)[^"'\s<>]*["']/gi)){
   const tag=m[0];if(!/logo|brand|escudo|cabecera|header|aguanativa/i.test(tag))continue;
   for(const src of tag.matchAll(/(?:src|data-src|data-lazy-src)\s*=\s*["']([^"']+)["']|url\(["']?([^)'"\s]+)|^["']([^"']+)["']$/gi)){
    try{const url=new URL(decode(src[1]||src[2]||src[3]),response.url).href;if(/^https?:/.test(url)&&!candidates.some(c=>c.url===url))candidates.push({url,tag:tag.slice(0,1800)})}catch{}
   }
  }
  return{slug:r.slug,name:r.name,requested:r.website_original,resolved:response.url,status:response.status,title:html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim(),candidates:candidates.slice(0,30)};
 }catch(error){return{slug:r.slug,name:r.name,requested:r.website_original,status:'unavailable',error:error.cause?.code||error.message,candidates:[]}}
}));
await writeFile(new URL('docs/interno/clientes/fuentes-investigadas.json',root),JSON.stringify(results,null,2)+'\n');
for(const r of results)console.log(JSON.stringify({name:r.name,status:r.status,resolved:r.resolved,title:r.title,candidates:r.candidates.map(c=>c.url)}));
