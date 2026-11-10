import {escapeHtml as h} from './insurance-render.js';
import {publishedClients,logoLocalPath,logoStoragePath,websiteUrl} from './clients-model.js';
export function clientLogoUrl(r,{base='',supabaseUrl='',publishableKey='',preview=false,previewLogoUrls}={}){
 if(preview&&previewLogoUrls?.has(r.slug))return previewLogoUrls.get(r.slug);
 if(!r.logo_verified||(!preview&&!r.logo_authorized))return '';
 if(logoStoragePath(r.logo_storage_path))return preview?'':supabaseUrl+'/functions/v1/client-logo?id='+encodeURIComponent(r.id)+'&apikey='+encodeURIComponent(publishableKey);
 return logoLocalPath(r.logo_local_path)?base+r.logo_local_path:'';
}
export function clientCard(r,options={}){
 const logo=clientLogoUrl(r,options),url=r.website_verified?websiteUrl(r.website_url):'',name=h(r.name);
 const content=`<span class="client-logo client-logo-${h(logo?(r.logo_background||'white'):'white')}">${logo?`<img src="${h(logo)}" alt="Logotipo de ${name}" width="${Number(r.logo_width)||240}" height="${Number(r.logo_height)||100}" loading="lazy" decoding="async"><span class="client-logo-fallback" hidden>${name}</span>`:`<span class="client-wordmark">${name}</span>`}</span>${logo?`<span class="client-caption">${name}</span>`:''}`;
 return `<li class="client-card" data-client-sector="${h(r.sector)}" data-client-slug="${h(r.slug)}" data-client-name="${name}">${url?`<a href="${h(url)}" target="_blank" rel="noopener noreferrer" aria-label="${name}: sitio oficial (abre otra pestaña)">${content}</a>`:`<div>${content}</div>`}</li>`;
}
export function clientsMarkup(rows,options={}){
 const visible=options.preview?rows.filter(r=>r.active).sort((a,b)=>a.sort_order-b.sort_order||a.slug.localeCompare(b.slug)):publishedClients(rows);
 if(!visible.length)return '';
 return `<div class="clients-heading"><h2 id="clients-title">EMPRESAS QUE CONFÍAN <em>EN NOSOTROS</em></h2><p class="clients-lead">Construimos relaciones de confianza acompañando a empresas y organizaciones en sus desafíos jurídicos, comerciales y estratégicos.</p></div><ul class="clients-grid clients-all" aria-label="Organizaciones que han confiado en BKO">${visible.map(r=>clientCard(r,options)).join('')}</ul>`;
}

export function bindClients(root){
 root.querySelectorAll('.client-logo img').forEach(img=>img.addEventListener('error',()=>{img.hidden=true;img.nextElementSibling.hidden=false;img.closest('.client-logo').classList.remove('client-logo-navy')},{once:true}));
}
