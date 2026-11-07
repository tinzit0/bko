import test from'node:test';import assert from'node:assert/strict';import{validateWebsite,applyField}from'../js/website-content.js';import{setInsuranceField}from'../js/insurance-bindings.js';import{insuranceDefault}from'../js/insurance-content.js';
test('CMS general limita páginas, tipos y URLs de fotografías',()=>{
 const valid={pages:{'index.html':{'#hero-title|text:0':{type:'text',value:'Presentación'}}}};assert.equal(validateWebsite(valid),true);
 assert.equal(validateWebsite({pages:{'../admin/index.html':{}}}),false);assert.equal(validateWebsite({pages:{'index.html':{x:{type:'image',value:'javascript:alert(1)'}}}}),false);assert.equal(validateWebsite({pages:{'index.html':{x:{type:'html',value:'<script>'}}}}),false);
});
test('Edición de textos conserva espacios editoriales y no interpreta HTML',()=>{
 const node={nodeValue:' Una mirada al '},field={type:'text',node};applyField(field,{type:'text',value:'<b>contenido</b>'});assert.equal(node.nodeValue,' <b>contenido</b> ');
});
test('Edición de seguros modifica el mismo modelo y conserva otros párrafos',()=>{
 const c=structuredClone(insuranceDefault),original=c.roxana.description.split('\n\n');setInsuranceField(c,{path:'roxana.description',segment:0},'Presentación actualizada');assert.equal(c.roxana.description.split('\n\n')[1],original[1]);assert.equal(c.roxana.description.split('\n\n')[0],'Presentación actualizada');setInsuranceField(c,{path:'services.0.title'},'Título revisado');assert.equal(c.services[0].title,'Título revisado');
});
