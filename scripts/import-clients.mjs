import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
export function csvFields(line){
 const result=[];let value='',quoted=false;
 for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quoted&&line[i+1]==='"'){value+='"';i++}else quoted=!quoted}else if(ch===','&&!quoted){result.push(value.trim());value=''}else value+=ch}
 if(quoted)throw Error('Comillas sin cerrar en el CSV.');result.push(value.trim());return result;
}
export const clientSlug=name=>name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export function parseClientsCsv(text){
 const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(s=>s.trim());
 const header=csvFields(lines.shift().replace(/;$/,''));if(header.join(',')!=='cliente,web_o_enlace,logo_url_o_fuente,estado_logo,observaciones')throw Error('Cabecera CSV inesperada.');
 const rows=lines.map((raw,index)=>{
  let line=raw.trim().replace(/;$/,'');
  if(line.startsWith('"')&&line.endsWith('"'))line=line.slice(1,-1).replaceAll('""','"');
  const values=csvFields(line);if(values.length!==5)throw Error(`Fila ${index+2}: se esperaban cinco campos, se encontraron ${values.length}.`);
  const [original_name,website_original,logo_source_original,logo_status_original,observations]=values;
  const name=original_name==='CAUCE Gestión Integral / caucegestion.cl'?'CAUCE Gestión Integral':original_name;
  return {slug:clientSlug(name),name,original_name,website_url:website_original,website_original,website_verified:false,logo_local_path:'',logo_storage_path:'',logo_verified:false,logo_authorized:false,logo_source:logo_source_original,logo_source_original,logo_status_original,verification_status:'pending',observations,sector:'general',sector_source:'',description:'',sort_order:(index+1)*10,active:true,published:false,featured:index<10,relation_authorized:false,authorization_reference:'',original_row:raw};
 });
 if(rows.length!==22||new Set(rows.map(r=>r.slug)).size!==22)throw Error('La importación debe recuperar exactamente 22 clientes distintos.');
 if(rows.some(r=>!r.name))throw Error('Nombre ausente.');return rows;
}
export async function importClients(){
 const root=new URL('../',import.meta.url),raw=await readFile(new URL('clientes/clientes_confian_en_nosotros.csv',root),'utf8'),rows=parseClientsCsv(raw);
 await mkdir(new URL('supabase/seeds/',root),{recursive:true});await mkdir(new URL('docs/interno/clientes/',root),{recursive:true});await mkdir(new URL('assets/clientes/',root),{recursive:true});
 await writeFile(new URL('supabase/seeds/clients.json',root),JSON.stringify(rows,null,2)+'\n');
 const quote=s=>'"'+s.replaceAll('"','""')+'"';
 await writeFile(new URL('docs/interno/clientes/clientes-normalizado.csv',root),'cliente,web_o_enlace,logo_url_o_fuente,estado_logo,observaciones\n'+rows.map(r=>[r.original_name,r.website_original,r.logo_source_original,r.logo_status_original,r.observations].map(quote).join(',')).join('\n')+'\n');
 await writeFile(new URL('docs/interno/clientes/importacion.json',root),JSON.stringify({source:'clientes/clientes_confian_en_nosotros.csv',sha256:createHash('sha256').update(raw).digest('hex'),records:rows.length,uniqueSlugs:rows.length,sourceUnchanged:true,corrections:['Retiro del envoltorio externo de cada fila y del terminador ;','Decodificación de comillas duplicadas','Conservación de los ; internos en observaciones','Nombre público de CAUCE según instrucción escrita; valor original conservado'],audioReview:'pending',authorization:'pending; unpublished by default'},null,2)+'\n');
 console.log(`Recuperados ${rows.length} registros únicos. CSV original conservado. Publicación pendiente de autorización.`);
 return rows;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await importClients();
