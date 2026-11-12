import {mediaUrl} from './insurance-render.js';
import {maritimeFirst} from './site-updates.js';
export const knownProfiles=['makarena-andrea-ponce-villarroel','jorge-ivan-saavedra-bentjerodt','camila-alejandra-kopplin-lanata','fenella-reyes-gonzalo','luis-miranda-chavarria','roxana-ximena-oyarzun-bustamante','estefania-benitez-garcia'];
export const relatedAreas={corporativo:'Corporativo',mineria:'Minería, Construcción y Servicios Asociados',maritimo:'Marítimo, Naviero, Lacustre y Acuícola',turismo:'Turismo',inmobiliario:'Inmobiliario',familia:'Derecho de Familia',laboral:'Derecho Laboral',cauce:'CAUCE Gestión Integral',seguros:'Negocios y Seguros'};
export const profilePath=id=>knownProfiles.includes(id)?`equipo/${id}.html`:`equipo/perfil.html?id=${encodeURIComponent(id)}`;
export const areaPath=id=>id==='familia'?'index.html#personas':id==='cauce'?'cauce/index.html':id==='seguros'?'seguros/index.html':`index.html#${id}`;
export const visibleRecords=records=>records.filter(r=>r.active&&r.published).sort((a,b)=>a.sort_order-b.sort_order||a.id.localeCompare(b.id));
const str=(s,max=20000)=>typeof s==='string'&&s.length<=max;
const strings=(a,max=100)=>Array.isArray(a)&&a.length<=max&&a.every(x=>str(x,2000));
const sections=a=>Array.isArray(a)&&a.length<=50&&a.every(s=>s&&str(s.title,300)&&str(s.body));
export function validateRecord(r){
 if(!r||!['professional','area','page'].includes(r.kind)||!str(r.id,100)||!/^[a-z][a-z0-9-]*$/.test(r.id)||!Number.isInteger(r.sort_order)||Math.abs(r.sort_order)>1000000||typeof r.active!=='boolean'||typeof r.published!=='boolean'||!r.data||Array.isArray(r.data)||typeof r.data!=='object'||JSON.stringify(r.data).length>180000)return false;
 const d=r.data;if(!str(d.intro))return false;
 if(r.kind==='professional'&&((d.discipline!==undefined&&!['legal','medical','business','support'].includes(d.discipline))||(d.functions!==undefined&&!str(d.functions))))return false;
 if(r.kind==='professional')return str(d.name,160)&&str(d.role,500)&&str(d.image,2000)&&(!d.image||!!mediaUrl(d.image))&&str(d.imageAlt,1000)&&strings(d.areas,30)&&d.areas.every(a=>Object.hasOwn(relatedAreas,a))&&strings(d.specialties)&&sections(d.sections)&&sections(d.timeline)&&str(d.email,254)&&(!d.email||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email))&&typeof d.contactAuthorized==='boolean'&&(!d.seoTitle||str(d.seoTitle,250))&&(!d.seoDescription||str(d.seoDescription,1000));
 if(r.kind==='area')return str(d.title,200)&&strings(d.services)&&strings(d.legalTeam,100)&&d.legalTeam.every(id=>/^[a-z][a-z0-9-]{0,99}$/.test(id));
 if(r.id==='personas')return str(d.title,200)&&str(d.strapline,300)&&str(d.quote,1000);
 if(r.id==='cauce')return str(d.title,200)&&str(d.description)&&str(d.quote,2000)&&strings(d.services)&&strings(d.benefits)&&sections(d.sections)&&d.interestCriteria&&['norm','rateSource','formula','verification'].every(k=>str(d.interestCriteria[k],2000))&&typeof d.interestCriteria.reviewed==='boolean';
 return false;
}
export function insuranceProfile(row,insurance){
 if(row.id!=='roxana-ximena-oyarzun-bustamante')return row;
 if(!insurance)return {...row,data:{...row.data,specialties:maritimeFirst(row.data?.specialties)}};
 const r=insurance.roxana;
 return {...row,data:{...row.data,name:r.name,role:r.role,image:r.image,intro:r.description,specialties:r.specialties}};
}
