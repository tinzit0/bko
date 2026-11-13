// Envío de la consulta por WhatsApp desde el teléfono del visitante (gratis, sin servicios externos).
// Después de enviar el formulario aparece un botón que abre WhatsApp con la consulta ya escrita
// para el número de BKO. Si el formulario falla, el mismo botón sirve como respaldo.
import {config} from './config.js';

const labels=[['name','Nombre'],['company','Empresa'],['email','Correo'],['phone','Teléfono'],['city','Ciudad'],['area','Área'],['insuranceType','Tipo de seguro'],['companyRut','RUT empresa'],['activity','Actividad'],['expectedDate','Fecha estimada']];
const clean=v=>String(v??'').replace(/[*_~`]/g,'').trim();

/** Texto de la consulta en el mismo formato del aviso automático. */
export function whatsAppConsultation(data,{title='Consulta desde el sitio web BKO',id=''}={}){
 const fields=labels.filter(([k])=>clean(data[k])).map(([k,l])=>`*${l}:* ${clean(data[k])}`).join('\n');
 const message=clean(data.message||data.description).slice(0,3000);
 return `*${title}*\n\n${fields}${message?`\n\n*Mensaje:*\n${message}`:''}${id?`\n\nRegistro: ${id}`:''}`;
}
export function whatsAppLink(text,number=config.formWhatsAppNumber||config.whatsappNumber){return `https://wa.me/${String(number).replace(/\D/g,'')}?text=${encodeURIComponent(text)}`}

let styled=false;
function style(){
 if(styled)return;styled=true;const s=document.createElement('style');
 s.textContent='.wa-handoff{margin:16px 0 0;display:flex;flex-direction:column;gap:8px;max-width:550px}.wa-handoff a{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:50px;padding:12px 22px;background:#25D366;color:#06301a!important;font-weight:700;font-size:13px;letter-spacing:.6px;text-decoration:none!important;border-radius:2px;align-self:flex-start}.wa-handoff a:hover,.wa-handoff a:focus-visible{background:#1fb457}.wa-handoff p{margin:0;font-size:12px;line-height:1.7;opacity:.85}@media(max-width:600px){.wa-handoff a{align-self:stretch}}';
 document.head.append(s);
}

/** Muestra (o actualiza) el botón de WhatsApp junto al mensaje de estado del formulario. */
export function showWhatsAppHandoff(statusEl,data,{sent=true,title,id}={}){
 style();
 let box=statusEl.nextElementSibling?.classList.contains('wa-handoff')?statusEl.nextElementSibling:null;
 if(!box){box=document.createElement('div');box.className='wa-handoff';statusEl.after(box)}
 box.innerHTML=`<a target="_blank" rel="noopener noreferrer"></a><p></p>`;
 const a=box.querySelector('a');a.href=whatsAppLink(whatsAppConsultation(data,{title,id}));
 a.textContent=sent?'ENVIAR TAMBIÉN POR WHATSAPP →':'ENVIAR LA CONSULTA POR WHATSAPP →';
 box.querySelector('p').textContent=sent?'Recomendado: así tu consulta llega de inmediato al WhatsApp de BKO. Se abre con el mensaje listo; solo toca Enviar.':'Se abre WhatsApp con tu consulta ya escrita; solo toca Enviar.';
 a.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('bko:contact-click',{detail:{channel:'whatsapp-form'}})));
}
export function hideWhatsAppHandoff(statusEl){if(statusEl.nextElementSibling?.classList.contains('wa-handoff'))statusEl.nextElementSibling.remove()}
