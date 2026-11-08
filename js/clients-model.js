export const clientSectors={general:'General',mineria:'Minería e industria',construccion:'Construcción y servicios',turismo:'Hotelería y turismo',comercio:'Comercio y empresas',salud:'Laboratorios y salud',maritimo:'Marítimo e institucional'};
export const publicClientColumns='id,name,slug,logo_local_path,logo_storage_path,logo_width,logo_height,logo_verified,logo_authorized,logo_background,website_url,website_verified,sector,description,sort_order,active,published,featured,relation_authorized';
export const logoTypes={'image/svg+xml':'svg','image/png':'png','image/webp':'webp','image/jpeg':'jpg'};
export function websiteUrl(value){if(typeof value!=='string'||value.length>2000)return '';try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password&&u.hostname.includes('.')?u.href:''}catch{return ''}}
export function logoLocalPath(value){return typeof value==='string'&&/^assets\/clientes\/[a-z0-9][a-z0-9._-]*\.(svg|png|webp|jpg|jpeg)$/i.test(value)?value:''}
export function logoStoragePath(value){return typeof value==='string'&&/^[a-z0-9][a-z0-9._-]{1,150}\.(svg|png|webp|jpg|jpeg)$/i.test(value)?value:''}
export const publishedClients=rows=>rows.filter(r=>r.active&&r.published&&r.relation_authorized).sort((a,b)=>a.sort_order-b.sort_order||a.slug.localeCompare(b.slug));
export function clientStatistics(rows){
 const withLogo=r=>Boolean(logoLocalPath(r.logo_local_path)||logoStoragePath(r.logo_storage_path));
 return {total:rows.length,published:publishedClients(rows).length,pending:rows.filter(r=>!r.relation_authorized||(withLogo(r)&&!r.logo_authorized)).length,withLogo:rows.filter(withLogo).length,withoutLogo:rows.filter(r=>!withLogo(r)).length,featured:rows.filter(r=>r.featured).length,sectors:Object.fromEntries(Object.keys(clientSectors).map(key=>[key,rows.filter(r=>r.sector===key).length]))};
}
export function validateClient(r){
 const s=(v,max)=>typeof v==='string'&&v.length<=max;
 if(!r||!s(r.name,180)||!r.name.trim()||!s(r.slug,160)||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.slug)||!Object.hasOwn(clientSectors,r.sector)||!Number.isInteger(r.sort_order)||Math.abs(r.sort_order)>1000000)return false;
 if(!['active','published','featured','relation_authorized','logo_verified','logo_authorized','website_verified'].every(k=>typeof r[k]==='boolean'))return false;
 if(!s(r.website_url,2000)||(r.website_url&&!websiteUrl(r.website_url))||!s(r.logo_local_path,300)||(r.logo_local_path&&!logoLocalPath(r.logo_local_path))||!s(r.logo_storage_path,180)||(r.logo_storage_path&&!logoStoragePath(r.logo_storage_path)))return false;
 if(!s(r.description,2000)||!['white','ivory','navy'].includes(r.logo_background||'white'))return false;
 if(r.published&&!r.relation_authorized)return false;
 if(r.sector!=='general'&&typeof r.sector_source==='string'&&!r.sector_source.trim())return false;
 return true;
}
export function validateSvg(text){
 text=text.replace(/<!DOCTYPE svg PUBLIC ["']-\/\/W3C\/\/DTD SVG 1\.1\/\/EN["'] ["']http:\/\/www\.w3\.org\/Graphics\/SVG\/1\.1\/DTD\/svg11\.dtd["']>/i,'');
 if(!/<svg(?:\s|>)/i.test(text)||/<(?:script|foreignObject|iframe|object|embed|audio|video|animate|set)\b|<!ENTITY|<!DOCTYPE|<\?xml-stylesheet|\bon[a-z]+\s*=|javascript\s*:|@import/i.test(text))throw Error('El SVG contiene elementos activos o referencias no admitidas. Usa una versión estática.');
 for(const m of text.matchAll(/(?:href|xlink:href)\s*=\s*["']([^"']*)["']/gi))if(!m[1].startsWith('#')&&!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=\s]+$/i.test(m[1]))throw Error('El SVG debe ser autónomo, sin recursos externos.');
 for(const m of text.matchAll(/url\(\s*["']?([^)'"\s]+)/gi))if(!m[1].startsWith('#'))throw Error('El SVG contiene recursos externos.');
 return true;
}
export async function validateLogoFile(file){
 if(!file||!Object.hasOwn(logoTypes,file.type)||file.size<1||file.size>2000000)throw Error('Usa SVG estático, PNG, WebP o JPEG de hasta 2 MB.');
 const bytes=new Uint8Array(await file.arrayBuffer());
 const valid=file.type==='image/png'?bytes.slice(0,8).join(',')==='137,80,78,71,13,10,26,10':file.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:file.type==='image/webp'?new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP':validateSvg(new TextDecoder().decode(bytes));
 if(!valid)throw Error('El contenido del archivo no coincide con el formato indicado.');return logoTypes[file.type];
}
