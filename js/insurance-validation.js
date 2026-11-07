import {insuranceCategories} from './insurance-content.js';
import {validateConsultation} from './validation.js';
export const insuranceArea='Negocios y seguros corporativos';
export function validRut(value){
  const raw=value.replace(/[.\s-]/g,'').toUpperCase();if(!/^\d{7,8}[0-9K]$/.test(raw))return false;
  const digits=raw.slice(0,-1);let sum=0,multiplier=2;for(let i=digits.length-1;i>=0;i--){sum+=Number(digits[i])*multiplier;multiplier=multiplier===7?2:multiplier+1}
  const result=11-sum%11;return raw.at(-1)===(result===11?'0':result===10?'K':String(result));
}
export function validateInsurance(data){
  const errors=validateConsultation({...data,area:'Necesito orientación'});
  if(data.area!==insuranceArea)errors.area='Selecciona el área de seguros.';
  if(!insuranceCategories.includes(data.insuranceType))errors.insuranceType='Selecciona un tipo de seguro.';
  if(typeof data.activity!=='string'||data.activity.trim().length<3||data.activity.length>250)errors.activity='Indica la actividad económica (3 a 250 caracteres).';
  if(!data.phone)errors.phone='Indica un teléfono de contacto.';
  if(data.companyRut&&(typeof data.companyRut!=='string'||!validRut(data.companyRut)))errors.companyRut='Ingresa un RUT de empresa válido.';
  if(data.expectedDate){const d=new Date(data.expectedDate+'T12:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(data.expectedDate)||!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==data.expectedDate)errors.expectedDate='Ingresa una fecha válida.'}
  if(data.commercialConsent!==true)errors.commercialConsent='Autoriza el contacto comercial para gestionar esta solicitud.';
  return errors;
}
