import {escapeHtml as h} from './insurance-render.js';
import {publishedClients,logoLocalPath,logoStoragePath,websiteUrl,clientSectors} from './clients-model.js';
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
 const featured=visible.filter(r=>r.featured).slice(0,4);
 const sectors=Object.entries(clientSectors).filter(([id])=>visible.some(r=>r.sector===id));
 return `<div class="clients-heading">
 <h2 id="clients-title">EMPRESAS QUE CONFÍAN <em>EN NOSOTROS</em></h2>
 <p class="clients-lead">Construimos relaciones de confianza acompañando a empresas y organizaciones en sus desafíos jurídicos, comerciales y estratégicos.</p>
 </div>
 ${featured.length?`<ul class="clients-grid clients-featured" aria-label="Selección de organizaciones">${featured.map(r=>clientCard(r,options)).join('')}</ul>`:''}
 <details class="clients-directory" id="clientes-completo">
 <summary data-open-clients><span data-client-toggle-label data-client-total="${visible.length}">Ver todas las empresas (${visible.length})</span><span class="clients-directory-icon" aria-hidden="true">+</span></summary>
 <div class="clients-directory-body">${sectors.length>1?`<div class="clients-filters" role="group" aria-label="Filtrar organizaciones por sector"><button type="button" data-client-filter="all" aria-pressed="true">Todas</button>${sectors.map(([id,label])=>`<button type="button" data-client-filter="${id}" aria-pressed="false">${h(label)}</button>`).join('')}</div>`:''}
 <label class="clients-sort">Ordenar por<select data-client-sort><option value="custom">Orden institucional</option><option value="az">Nombre: A–Z</option><option value="za">Nombre: Z–A</option></select></label>
 <p class="clients-count" role="status" aria-live="polite">${visible.length} organizaciones</p>
 <ul class="clients-grid clients-all" aria-label="Organizaciones que han confiado en BKO">${visible.map(r=>clientCard(r,options)).join('')}</ul>
 <p class="clients-filter-empty" hidden>No hay organizaciones en este sector.</p></div></details>`;
}
export function bindClients(root){
 const directory=root.querySelector('.clients-directory'),featured=root.querySelector('.clients-featured'),label=root.querySelector('[data-client-toggle-label]');
 if(directory){const sync=()=>{if(featured)featured.hidden=directory.open;if(label)label.textContent=directory.open?'Ocultar directorio':`Ver todas las empresas (${label.dataset.clientTotal})`};directory.addEventListener('toggle',sync);sync()}
 root.querySelectorAll('[data-client-filter]').forEach(button=>button.addEventListener('click',()=>{
  const sector=button.dataset.clientFilter;root.querySelectorAll('[data-client-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));let count=0;
  root.querySelectorAll('.clients-all .client-card').forEach(card=>{card.hidden=sector!=='all'&&card.dataset.clientSector!==sector;if(!card.hidden)count++});root.querySelector('.clients-count').textContent=`${count} ${count===1?'organización':'organizaciones'}`;root.querySelector('.clients-filter-empty').hidden=count>0;
 }));
 const grid=root.querySelector('.clients-all'),sort=root.querySelector('[data-client-sort]');
 if(grid&&sort){const original=[...grid.children];sort.addEventListener('change',()=>{const ordered=sort.value==='custom'?[...original]:[...original].sort((a,b)=>(sort.value==='za'?-1:1)*a.dataset.clientName.localeCompare(b.dataset.clientName,'es',{sensitivity:'base'}));grid.append(...ordered)})}
 root.querySelectorAll('.client-logo img').forEach(img=>img.addEventListener('error',()=>{img.hidden=true;img.nextElementSibling.hidden=false;img.closest('.client-logo').classList.remove('client-logo-navy')},{once:true}));
}
