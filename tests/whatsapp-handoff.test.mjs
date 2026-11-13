import test from 'node:test';
import assert from 'node:assert/strict';
import {whatsAppConsultation,whatsAppLink} from '../js/whatsapp-handoff.js';

test('la consulta por WhatsApp incluye todos los datos y el mensaje completo', () => {
  const text = whatsAppConsultation({name:'Ana *Pérez*',email:'ana@x.cl',phone:'',city:'Calama',area:'Derecho Laboral',message:'Necesito asesoría\ncon un despido.'},{id:'abc'});
  assert.match(text, /^\*Consulta desde el sitio web BKO\*/);
  assert.match(text, /\*Nombre:\* Ana Pérez\n\*Correo:\* ana@x\.cl\n\*Ciudad:\* Calama/);
  assert.doesNotMatch(text, /Teléfono/);
  assert.match(text, /\*Mensaje:\*\nNecesito asesoría\ncon un despido\.\n\nRegistro: abc$/);
});
test('el enlace apunta al número de BKO con el texto codificado', () => {
  const link = whatsAppLink('Hola & chao', '+56 9 7482 6025');
  assert.equal(link, 'https://wa.me/56974826025?text=Hola%20%26%20chao');
  assert.match(whatsAppLink('x'), /^https:\/\/wa\.me\/569\d{8}\?/);
});
