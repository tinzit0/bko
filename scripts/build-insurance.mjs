import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {insuranceDefault as c} from '../js/insurance-content.js';
import {insuranceMarkup,insuranceForm,roxanaMarkup,escapeHtml as h} from '../js/insurance-render.js';
export async function buildInsurance(){
 const root=new URL('../',import.meta.url);
 let home=await readFile(new URL('index.html',root),'utf8');
 home=home.replaceAll('href="#seguros">Seguros</a>','href="#seguros">Negocios y seguros</a>');
 home=home.replace(/<section id="seguros"[\s\S]*?<\/section>/,`<section id="seguros" class="section insurance-service" aria-labelledby="insurance-title"><p class="eyebrow">NEGOCIOS Y SEGUROS CORPORATIVOS</p><h2 id="insurance-title" data-insurance-title>${h(c.title)}</h2><p data-insurance-subtitle>${h(c.subtitle)}</p><div class="insurance-preview"><div><h3>Una mirada estratégica para proteger tu actividad.</h3><ul class="profile-tags"><li>Seguros para la minería</li><li>Seguros marítimos</li><li>Garantías y licitaciones</li><li>Empresas constructoras y maquinaria</li><li>Responsabilidad Civil</li><li>Seguros generales</li></ul><a class="button profile-link" href="seguros/index.html">EXPLORAR NEGOCIOS Y SEGUROS</a></div><div><p class="eyebrow">ENCARGADA DEL ÁREA</p><h3 data-roxana-name>${h(c.roxana.name)}</h3><p data-roxana-role>${h(c.roxana.role)}</p><a class="text-link" href="equipo/roxana-ximena-oyarzun-bustamante.html">Conoce su perfil ↗</a></div></div><a class="button button-gold" data-insurance-main-cta href="seguros/index.html#solicitud-seguros">${h(c.cta)}</a></section>\n\n`);
 home=home.replace(/<article class="person reveal" aria-labelledby="roxana-name">[\s\S]*?<\/article>/,`<article class="person reveal" aria-labelledby="roxana-name"><div class="person-portrait"><img data-roxana-image src="${c.roxana.image}" width="367" height="537" alt="Retrato de ${h(c.roxana.name)}" loading="lazy" decoding="async"></div><div class="person-copy"><p class="eyebrow" data-roxana-role>${h(c.roxana.role)}</p><h3 id="roxana-name" data-roxana-name>${h(c.roxana.name)}</h3><p class="person-bio" data-roxana-intro>${h(c.roxana.description.split('\n\n')[0])}</p><ul class="profile-tags" data-roxana-specialties>${c.roxana.specialties.map(t=>`<li>${h(t)}</li>`).join('')}</ul><a class="button profile-link" href="equipo/roxana-ximena-oyarzun-bustamante.html">CONOCE SU TRAYECTORIA ↗</a></div></article>`);
 if(!home.includes('css/insurance.css'))home=home.replace('</head>','  <link rel="stylesheet" href="css/insurance.css">\n  <script type="module" src="js/cms-public.js"></script>\n</head>');
 home=home.replace(/    <p class="insurance-contact-route">[\s\S]*?<\/p>\n/g,'');
 home=home.replace('    <section id="contacto"','    <p class="insurance-contact-route">¿Buscas protección para tu empresa o proyecto? <a href="seguros/index.html#solicitud-seguros">Solicita asesoría en seguros ↗</a></p>\n    <section id="contacto"').replace(/(?:    <p class="insurance-contact-route">[\s\S]*?<\/p>\n){2}/,'');
 // Existing route is retained; avoid adding a second insurance teaser.
 home=home.replace(/<a(?: class="footer-admin-access")? href="admin\/index\.html">[^<]*<\/a>/g,'');
 home=home.replace('<div class="footer-bottom">','<div class="footer-bottom"><a class="footer-admin-access" href="admin/index.html">Administración</a>');
 await writeFile(new URL('index.html',root),home);
 const wrap=(main,title,description,script='')=>home.replace(/<main id="contenido">[\s\S]*?<\/main>/,main).replace(/<p class="insurance-contact-route">[\s\S]*?<\/p>/g,'').replace(/href="#(?!i-)([^\"]+)"/g,(m,id)=>id==='contenido'?m:`href="../index.html#${id}"`).replace(/(?:src|href)="((?:assets|css|js|equipo|admin|seguros)\/)/g,(m,p)=>m.replace(p,'../'+p)).replace('src="../js/app.js"','src="../js/profiles.js"').replace(/<title>[\s\S]*?<\/title>/,`<title>${title}</title>`).replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${h(description)}">`).replace(/<meta property="og:title" content="[^"]*">/,`<meta property="og:title" content="${h(title)}">`).replace(/<meta property="og:description" content="[^"]*">/,`<meta property="og:description" content="${h(description)}">`).replace('</head>',script+'</head>');
 await mkdir(new URL('seguros/',root),{recursive:true});
 // Wrap chrome first: local anchors in the catalog must remain on the insurance page.
 let page=wrap('<main id="contenido" class="insurance-page">INSURANCE_CONTENT</main>','Seguros corporativos, constructoras y garantías | BKO',c.subtitle,'<script type="module" src="../js/insurance.js"></script>\n');
 page=page.replace('INSURANCE_CONTENT',`<div data-insurance-catalog>${insuranceMarkup(c,'../')}</div>${insuranceForm()}`);
 page=page.replace(/href="(index\.html[^"\s]*|cauce\/[^"\s]*)"/g,(_,href)=>`href="../${href}"`);
 page=page.replace('content="assets/social.svg"','content="../assets/social.svg"');
 page=page.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,`<script type="application/ld+json" id="insurance-schema">${JSON.stringify({'@context':'https://schema.org','@type':'Service',name:'Negocios y Seguros Corporativos BKO',description:c.subtitle,areaServed:'Chile',serviceType:c.groups.map(g=>g.title),provider:{'@type':'Organization',name:'BKO Consultores'}})}</script>`);
 page=page.replace('<p>Las consultas serán almacenadas en el proyecto Supabase de BKO.', '<p>La solicitud de seguros incluye nombre, empresa y RUT opcionales, correo, teléfono, ciudad, actividad económica, tipo de seguro, descripción y fecha estimada opcional. Se registran la aceptación del tratamiento de datos y la autorización de contacto comercial para responder y seguir esta solicitud.</p><p>Las consultas serán almacenadas en el proyecto Supabase de BKO.');
 await writeFile(new URL('seguros/index.html',root),page);
 let roxana=wrap('<main id="contenido" class="profile-page" data-roxana-profile>ROXANA_CONTENT</main>',`${c.roxana.name} | Negocios y Seguros Corporativos | BKO`,c.roxana.description.split('\n\n')[0]);
 roxana=roxana.replace('ROXANA_CONTENT',roxanaMarkup(c,'../')).replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,`<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'Person',name:c.roxana.name,description:c.roxana.role})}</script>`);
 roxana=roxana.replace('content="assets/social.svg"','content="../assets/social.svg"');
 await writeFile(new URL('equipo/roxana-ximena-oyarzun-bustamante.html',root),roxana);
 await writeFile(new URL('supabase/migrations/202611070002_insurance_content.sql',root),`insert into public.site_content(key,value) values('insurance','${JSON.stringify(c).replaceAll("'","''")}'::jsonb) on conflict(key) do nothing;\n`);
 await import('./install-visual-editor.mjs');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await buildInsurance();
