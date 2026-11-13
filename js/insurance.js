import {config} from './config.js';
import {validateInsurance,insuranceArea} from './insurance-validation.js';
import {insuranceCategories} from './insurance-content.js';
import {openWhatsApp,showWhatsAppHandoff,hideWhatsAppHandoff} from './whatsapp-handoff.js';
const form=document.querySelector('#insurance-form'),status=document.querySelector('#insurance-status');
let startedAt=Date.now(),busy=false,token='',widget;
const report=(message,state)=>{status.textContent=message;status.dataset.state=state};
const initial=new URLSearchParams(location.search).get('tipo');if(insuranceCategories.includes(initial))form.elements.insuranceType.value=initial;
document.addEventListener('click',e=>{
 const link=e.target.closest('[data-insurance-category]');if(link&&insuranceCategories.includes(link.dataset.insuranceCategory)){form.elements.insuranceType.value=link.dataset.insuranceCategory;form.elements.area.value=insuranceArea}
 if(e.target.closest('[data-insurance-privacy]'))document.querySelector('#privacy-dialog').showModal();
});
if(config.turnstileSiteKey){
 window.bkoInsuranceSecurity=()=>{widget=window.turnstile.render('#insurance-turnstile',{sitekey:config.turnstileSiteKey,theme:'dark',callback:value=>token=value,'expired-callback':()=>token='','error-callback':()=>token=''})};
 const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?onload=bkoInsuranceSecurity&render=explicit';script.async=true;document.head.append(script);
}
form.addEventListener('input',e=>{const el=document.getElementById(`ins-${e.target.name}-error`);if(el){el.textContent='';e.target.removeAttribute('aria-invalid')}});
form.addEventListener('submit',async e=>{
 e.preventDefault();if(busy)return;
 const data=Object.fromEntries(new FormData(form));for(const key in data)if(typeof data[key]==='string')data[key]=data[key].trim();data.area=insuranceArea;data.privacy=form.elements.privacy.checked;data.commercialConsent=form.elements.commercialConsent.checked;
 form.querySelectorAll('.field-error').forEach(el=>el.textContent='');form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
 const errors=validateInsurance(data);for(const[key,message]of Object.entries(errors)){const el=document.getElementById(`ins-${key}`);if(el){el.setAttribute('aria-invalid','true');document.getElementById(`ins-${key}-error`).textContent=message}}
 if(Object.keys(errors).length){report('Revisa los campos indicados.','error');document.getElementById(`ins-${Object.keys(errors)[0]}`)?.focus();return}
 if(data.website||Date.now()-startedAt<3000){report('Espera unos segundos antes de enviar.','error');return}
 if(config.turnstileSiteKey&&!token){report('Completa la verificación de seguridad.','error');return}
 openWhatsApp(data,{title:'Solicitud de seguros desde el sitio web BKO'});busy=true;const button=form.querySelector('[type="submit"]');button.disabled=true;form.setAttribute('aria-busy','true');report('Enviando tu solicitud…','pending');hideWhatsAppHandoff(status);
 try{
  const response=await fetch(`${config.supabaseUrl}/functions/v1/contact`,{method:'POST',headers:{apikey:config.supabasePublishableKey,'Content-Type':'application/json'},body:JSON.stringify({...data,startedAt,turnstileToken:token}),signal:AbortSignal.timeout(18000),keepalive:true});
  const result=await response.json().catch(()=>({}));
  if(response.status===429)throw Error('Has realizado varias solicitudes. Espera una hora o comunícate con BKO.');
  if(!response.ok||result.ok!==true||!/^[a-f0-9-]{36}$/i.test(result.id||''))throw Error('No pudimos confirmar el registro de tu solicitud. Inténtalo más tarde o llama al +56 9 7482 6025.');
  report('Listo: se abrió WhatsApp con tu solicitud para BKO. Toca Enviar en WhatsApp para completarla. También quedó registrada y la recibimos por correo.','success');showWhatsAppHandoff(status,data,{title:'Solicitud de seguros desde el sitio web BKO'});form.reset();startedAt=Date.now();
 }catch(error){showWhatsAppHandoff(status,data,{title:'Solicitud de seguros desde el sitio web BKO'});report(error.name==='TimeoutError'?'No pudimos confirmar la recepción a tiempo. Comunícate con BKO antes de reenviar para evitar duplicados.':error.message==='Failed to fetch'?'No pudimos conectar con el servicio. Tus datos permanecen en el formulario; puedes llamar al +56 9 7482 6025.':error.message,'error')}
 finally{busy=false;button.disabled=false;form.removeAttribute('aria-busy');if(widget!==undefined){window.turnstile.reset(widget);token=''}}
});
