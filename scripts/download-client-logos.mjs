import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),research=JSON.parse(await readFile(new URL('docs/interno/clientes/fuentes-investigadas.json',root),'utf8'));
const selection={
 'afuen-afuen-y-cia':0,'hotel-agua-nativa':0,'restaurant-puerto-colono':0,'hotel-cabana-del-lago':2,'directemar':0,'quimlab-chile':0,'puerto-pellet':0,'agua-puerto-varas':1,'hotel-oelckers':-1
};
await mkdir(new URL('assets/clientes/',root),{recursive:true});
const manifest=[],extras={'teski-refugio-volcan-osorno':'https://www.teski.cl/wp-content/uploads/2024/06/teski-web.png','palm-trade-chile':'https://palmtradechile.com/wp-content/uploads/2024/07/ptc-verde-scaled.webp','laboratorios-obens':'https://static.wixstatic.com/media/4dcc11_0f988843ee6848cda74e0c6d1f82ab46~mv2.png','constructora-werner':'https://proyectos.construcciones-werner.cl/wp-content/uploads/sites/50/2026/01/0cd23242-358357731-294900962951809-5999700764617764311-n_105b05a04f03400g00n000.jpg'};
for(const [slug,index]of Object.entries({...selection,...Object.fromEntries(Object.keys(extras).map(k=>[k,null]))})){
 const source=research.find(r=>r.slug===slug),candidate=index===null?{url:extras[slug]}:source?.candidates.at(index);if(!candidate)throw Error('Candidato ausente: '+slug);
 const r=await fetch(candidate.url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`${slug}: ${r.status}`);const bytes=Buffer.from(await r.arrayBuffer()),type=r.headers.get('content-type')?.split(';')[0];
 const ext=({'image/svg+xml':'svg','image/png':'png','image/webp':'webp','image/jpeg':'jpg'})[type];if(!ext||bytes.length>2000000)throw Error(`${slug}: formato/tamaño no admitido (${type}, ${bytes.length})`);
 const path=`assets/clientes/${slug}.${ext}`;await writeFile(new URL(path,root),bytes);
 manifest.push({slug,path,source_page:source.resolved,source_asset:r.url,mime:type,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),visualVerification:'pending',authorization:'pending',websiteVerified:false,sector:'general'});
 console.log(slug,path,bytes.length);
}
await writeFile(new URL('docs/interno/clientes/logotipos.json',root),JSON.stringify(manifest,null,2)+'\n');
