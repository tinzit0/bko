import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { validateConsultation } from '../js/validation.js';
const valid = {name:'Persona de Prueba',email:'prueba@example.org',phone:'+56 9 1234 5678',company:'',city:'Calama',area:'Derecho laboral',message:'Una consulta de prueba con suficiente contenido.',privacy:true};
test('Acepta consulta válida, sin empresa ni teléfono obligatorios', () => { assert.deepEqual(validateConsultation({...valid,phone:''}),{}); });
test('Rechaza correo inválido, área alterada y falta de consentimiento', () => { const errors=validateConsultation({...valid,email:'a@',area:'Inventada',privacy:false}); assert.deepEqual(Object.keys(errors).sort(),['area','email','privacy']); });
test('Valida límites de mensaje, nombre y teléfono', () => { const errors=validateConsultation({...valid,name:'  ',message:'x'.repeat(4001),phone:'llámame'}); assert.deepEqual(Object.keys(errors).sort(),['message','name','phone']); });
test('Anclas internas, recursos locales y un único H1', async () => {
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(new Set(ids).size,ids.length,'IDs duplicados');
  for(const match of html.matchAll(/(?:href|aria-controls)="#?([^"\s]+)"/g)) {
    if(match[0].includes('href="#')||match[0].startsWith('aria-controls')) assert.ok(ids.includes(match[1]),`Ancla ausente ${match[1]}`);
  }
  for(const match of html.matchAll(/(?:src|href)="((?:css|js|assets)\/[^"]+)"/g)) await access(new URL('../'+match[1],import.meta.url));
  const css=await readFile(new URL('../css/styles.css',import.meta.url),'utf8');
  for(const match of css.matchAll(/url\(['"]?(\.\.\/assets\/[^)'"\s]+)/g)) await access(new URL('../'+match[1].replace('../',''),import.meta.url));
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  const schema=JSON.parse(html.match(/application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(schema.telephone,'+56974826025');
  assert.ok(!html.includes('Hales y Bentjerodt'));
});
test('Migración mantiene datos de contacto privados', async () => {
  const sql=await readFile(new URL('../supabase/migrations/202611050001_contact.sql',import.meta.url),'utf8');
  assert.match(sql,/alter table public.consultations enable row level security/);
  assert.match(sql,/revoke all on public.consultations from anon, authenticated/);
  assert.match(sql,/pg_advisory_xact_lock/);
});
