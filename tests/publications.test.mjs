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
test('Formato enriquecido seguro: negrita, cursiva, enlaces, citas, listas numeradas e imágenes',()=>{
 const html=bodyMarkup('**Hola** *mundo* [BKO](https://bko.cl) [x](javascript:alert(1))\n\n### Menor\n\n1. uno\n2. dos\n\n> cita\n\n![Equipo](https://x.cl/a.webp)\n\n![Mal](javascript:1)');
 assert.ok(html.startsWith('<p><strong>Hola</strong> <em>mundo</em> <a href="https://bko.cl" target="_blank" rel="noopener noreferrer">BKO</a> [x](javascript:alert(1))</p>'));
 assert.ok(html.includes('<h3>Menor</h3><ol><li>uno</li><li>dos</li></ol><blockquote><p>cita</p></blockquote><figure class="publication-figure"><img src="https://x.cl/a.webp" alt="Equipo"'));
 assert.ok(!html.includes('src="javascript')&&!html.includes('href="javascript'));
});
test('Resumen automático, tiempo de lectura, búsqueda y relacionadas',async()=>{
 const {excerpt,readingMinutes,wordCount,matchesSearch,relatedPublications,plainText}=await import('../js/publications-model.js');
 const body='## Contexto\n\nLa **nueva ley** cambia la jornada. Las empresas deben adaptarse pronto.\n\n- uno\n- dos\n\n![Foto](https://x.cl/a.webp)';
 assert.equal(plainText(body),'Contexto La nueva ley cambia la jornada. Las empresas deben adaptarse pronto. uno dos');
 assert.equal(wordCount(body),14);assert.equal(readingMinutes(body),1);assert.equal(readingMinutes('palabra '.repeat(1000)),5);
 assert.equal(excerpt('Primera frase completa aquí. Segunda frase que es bastante más larga que el límite.',40),'Primera frase completa aquí.');
 assert.ok(excerpt('palabra '.repeat(100),30).endsWith('…'));
 const p={...base,title:'Jornada laboral',area:'Derecho Laboral',author:'Camila',body};
 assert.ok(matchesSearch(p,'ley jornada'));assert.ok(matchesSearch(p,'LABORAL camila'));assert.ok(matchesSearch(p,'jornáda'));assert.ok(!matchesSearch(p,'minería'));
 const rows=[p,{...base,slug:'b',kind:'estudio'},{...base,slug:'c',area:'Derecho Laboral'},{...base,slug:'d',published:false}];
 assert.deepEqual(relatedPublications(p,rows).map(r=>r.slug),['c','b']);
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
