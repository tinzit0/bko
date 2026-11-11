import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import {publicClientColumns} from '../js/clients-model.js';

const root = resolve(import.meta.dirname, '..');
const port = Number(process.env.PORT || 3000);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.xml':'application/xml','.txt':'text/plain; charset=utf-8','.mp3':'audio/mpeg'};
const publicRoots = new Set(['index.html','robots.txt','sitemap.xml','assets','css','js','equipo','seguros','cauce','admin']);
createServer(async (req,res) => {
  try {
    const requestUrl = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(requestUrl.pathname);
    if(pathname==='/__local/clients'){
      if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
      const hostname=new URL('http://'+req.headers.host).hostname;
      if(!['localhost','127.0.0.1','[::1]'].includes(hostname)||req.headers['sec-fetch-site']==='cross-site'){res.writeHead(403).end();return;}
      const rows=JSON.parse(await readFile(resolve(root,'supabase/seeds/clients.json'),'utf8'));
      const columns=publicClientColumns.split(',');
      const body=JSON.stringify(rows.map(row=>Object.fromEntries(columns.filter(key=>Object.hasOwn(row,key)).map(key=>[key,row[key]]))));
      res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
      res.end(req.method==='HEAD'?undefined:body);return;
    }
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    if(relative.startsWith('assets/referencias/')){res.writeHead(404).end('Not found');return;}
    const path = resolve(root, relative);
    if (!path.startsWith(root + sep) || !publicRoots.has(relative.split('/')[0]) || relative.split('/').some(part => part.startsWith('.'))) { res.writeHead(404).end('Not found'); return; }
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
    if (!(await stat(path)).isFile()) { res.writeHead(404).end('Not found'); return; }
    let body = await readFile(path);
    // Audio: rangos de bytes (como Cloudflare) para poder retomar la música desde cualquier punto.
    const range=extname(path)==='.mp3'&&/^bytes=(\d*)-(\d*)$/.exec(req.headers.range||'');
    if(range){
      const size=body.length,start=range[1]?Number(range[1]):Math.max(0,size-Number(range[2])),end=range[1]&&range[2]?Math.min(Number(range[2]),size-1):size-1;
      if(start>=size||start>end){res.writeHead(416,{'Content-Range':`bytes */${size}`}).end();return;}
      const part=body.subarray(start,end+1);
      res.writeHead(206,{'Content-Type':'audio/mpeg','Content-Length':part.length,'Content-Range':`bytes ${start}-${end}/${size}`,'Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});
      res.end(req.method==='HEAD'?undefined:part);return;
    }
    if(relative==='index.html'&&requestUrl.searchParams.get('clientes')!=='publicados')body=Buffer.from(body.toString('utf8').replace('</head>','<meta name="bko-clients-preview" content="local"></head>'));
    res.writeHead(200, {
      'Content-Type': types[extname(path)] || 'application/octet-stream',
      'Content-Length':body.length,
      'X-Content-Type-Options':'nosniff',
      'Referrer-Policy':'strict-origin-when-cross-origin',
      'Cache-Control':'no-cache',
      ...(extname(path)==='.mp3'?{'Accept-Ranges':'bytes'}:{}),
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`BKO disponible en http://localhost:${port}`));
