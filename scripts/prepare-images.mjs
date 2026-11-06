// Convierte los contenedores fotográficos en imágenes semánticas y diferidas.
// Idempotente: puede ejecutarse después de sustituir los recursos de la firma.
import {readFile,writeFile} from 'node:fs/promises';
const url=new URL('../index.html',import.meta.url);
let html=await readFile(url,'utf8');
const descriptions={mine:'Composición ilustrativa de una faena minera del norte de Chile',south:'Paisaje ilustrativo de Puerto Varas, lago y volcán Osorno',lake:'Composición ilustrativa del lago Llanquihue y su entorno',water:'Paisaje lacustre ilustrativo del sur de Chile',city:'Ilustración del horizonte urbano de Santiago de Chile y la cordillera'};
html=html.replace(/<div class="((?:sector-photo|firm-image|office-image|news-image) photo-(mine|south|lake|water|city))"([^>]*)>(?!<img)/g,(_,classes,subject,attrs)=>`<div class="${classes}"${attrs}><img src="assets/${subject==='city'?'santiago':'hero'}.webp" alt="${descriptions[subject]}" loading="lazy" decoding="async" width="${subject==='city'?1536:1774}" height="${subject==='city'?1024:887}">`);
html=html.replace('<p>Imagen de Santiago: <a href="https://commons.wikimedia.org/wiki/File:Skyline_Santiago_de_Chile.jpg" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>. Los recursos externos se documentan en assets/README.md. Los retratos del equipo y los contenidos editoriales están pendientes.</p>','<p>El horizonte urbano de Santiago es también una ilustración generada para este proyecto. Los recursos y sus instrucciones de generación se documentan en assets/README.md. Los retratos del equipo y los contenidos editoriales están pendientes.</p>');
await writeFile(url,html);
