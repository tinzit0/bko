import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {slugify,validatePublication,bodyMarkup,coverUrl,fileUrl,formatDate,sortPublications} from '../js/publications-model.js';
const base={slug:'reforma-laboral-2026',kind:'articulo',title:'Reforma laboral 2026',summary:'',body:'',author:'',area:'',published_on:'2026-11-12',cover_url:'',cover_alt:'',file_url:'',file_name:'',published:true,featured:false};
test('Slug sin tildes ni símbolos',()=>{assert.equal(slugify('¿Qué cambia en la Ley N° 21.643?'),'que-cambia-en-la-ley-n-21-643');assert.equal(slugify('Ñandú & Año'),'nandu-ano')});
test('Valida tipos, URLs y largo',()=>{
 assert.equal(validatePublication(base),true);
 assert.equal(validatePublication({...base,kind:'noticia'}),false);
 assert.equal(validatePublication({...base,cover_url:'javascript:alert(1)'}),false);
 assert.equal(validatePublication({...base,cover_url:'assets/../admin/x.png'}),false);
 assert.equal(validatePublication({...base,cover_url:'assets/editorial/analisis.svg'}),true);
 assert.equal(validatePublication({...base,file_url:'http://inseguro.cl/a.pdf'}),false);
 assert.equal(validatePublication({...base,title:'ab'}),false);
 assert.equal(fileUrl('data:application/pdf;base64,AA'),'');assert.equal(coverUrl('https://x.cl/a.webp'),'https://x.cl/a.webp');
});
test('El contenido se escapa y respeta párrafos, subtítulos y listas',()=>{
 const html=bodyMarkup('Hola <script>x</script>\nlínea 2\n\n## Subtítulo\n\n- uno\n- dos');
 assert.equal(html,'<p>Hola &lt;script&gt;x&lt;/script&gt;<br>línea 2</p><h2>Subtítulo</h2><ul><li>uno</li><li>dos</li></ul>');
});
test('Orden: destacadas y luego más recientes',()=>{
 const rows=[{...base,slug:'a',published_on:'2026-01-01'},{...base,slug:'b',published_on:'2026-05-01'},{...base,slug:'c',published_on:'2025-01-01',featured:true}];
 assert.deepEqual(sortPublications(rows).map(r=>r.slug),['c','b','a']);assert.match(formatDate('2026-11-12'),/12.*noviembre.*2026/);
});
test('Portada, panel y página de publicaciones cargan el módulo',async()=>{
 const index=await readFile('index.html','utf8'),admin=await readFile('admin/index.html','utf8'),page=await readFile('publicaciones/index.html','utf8'),workflow=await readFile('.github/workflows/pages.yml','utf8');
 assert.match(index,/data-publications>/);assert.match(index,/js\/publications-public\.js/);assert.match(admin,/publications-admin\.js/);
 assert.match(page,/data-publications-page/);assert.doesNotMatch(page,/cauce\.js/);assert.match(workflow,/cauce publicaciones admin/);
});
