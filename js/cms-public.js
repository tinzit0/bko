import {config} from './config.js';
import {validateInsuranceContent} from './insurance-content.js';
import {insuranceMarkup,roxanaMarkup,mediaUrl} from './insurance-render.js';
const base=document.querySelector('script[src*="cms-public.js"]')?.getAttribute('src')?.startsWith('../')?'../':'';
export async function loadInsuranceContent(){
 try{
  const response=await fetch(`${config.supabaseUrl}/rest/v1/site_content?key=eq.insurance&select=value`,{headers:{apikey:config.supabasePublishableKey},signal:AbortSignal.timeout(5000),cache:'no-store'});
  if(!response.ok)return null;const rows=await response.json();const c=rows[0]?.value;if(!validateInsuranceContent(c))return null;
  return c;
 }catch{return null}
}
export function applyInsuranceContent(c){
 for(const [selector,value]of [['[data-insurance-title]',c.title],['[data-insurance-subtitle]',c.subtitle],['[data-insurance-main-cta]',c.cta],['[data-roxana-name]',c.roxana.name],['[data-roxana-role]',c.roxana.role],['[data-roxana-intro]',c.roxana.description.split('\n\n')[0]]])document.querySelectorAll(selector).forEach(el=>el.textContent=value);
 document.querySelectorAll('[data-roxana-image]').forEach(el=>{const src=mediaUrl(c.roxana.image,base);if(src)el.src=src;el.alt=`Retrato de ${c.roxana.name}`});
 document.querySelectorAll('[data-roxana-specialties]').forEach(el=>el.replaceChildren(...c.roxana.specialties.map(t=>{const li=document.createElement('li');li.textContent=t;return li})));
 const catalog=document.querySelector('[data-insurance-catalog]');if(catalog)catalog.innerHTML=insuranceMarkup(c,base);
 const profile=document.querySelector('[data-roxana-profile]');if(profile){profile.innerHTML=roxanaMarkup(c,base);document.title=`${c.roxana.name} | Negocios y Seguros Corporativos | BKO`;document.querySelector('meta[name="description"]').content=c.roxana.description.split('\n\n')[0]}
 const schema=document.querySelector('#insurance-schema');if(schema){const data=JSON.parse(schema.textContent);data.description=c.subtitle;data.serviceType=c.groups.map(g=>g.title);schema.textContent=JSON.stringify(data)}
 document.dispatchEvent(new CustomEvent('bko:content-updated'));
 if(catalog){document.title=`Negocios y Seguros Corporativos | BKO`;document.querySelector('meta[name="description"]').content=c.subtitle;document.querySelector('meta[property="og:description"]').content=c.subtitle}
 if(profile){document.querySelector('meta[property="og:title"]').content=document.title;document.querySelector('meta[property="og:description"]').content=c.roxana.description.split('\n\n')[0];const person=document.querySelector('script[type="application/ld+json"]');if(person){const data=JSON.parse(person.textContent);data.name=c.roxana.name;data.description=c.roxana.role;person.textContent=JSON.stringify(data)}}
}
const c=await loadInsuranceContent();if(c)applyInsuranceContent(c);
