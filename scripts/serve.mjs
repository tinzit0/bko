import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import {publicClientColumns} from '../js/clients-model.js';

const root = resolve(import.meta.dirname, '..');
const port = Number(process.env.PORT || 3000);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.xml':'application/xml','.txt':'text/plain; charset=utf-8'};
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
    if(relative==='index.html'&&requestUrl.searchParams.get('clientes')!=='publicados')body=Buffer.from(body.toString('utf8').replace('</head>','<meta name="bko-clients-preview" content="local"></head>'));
    res.writeHead(200, {
      'Content-Type': types[extname(path)] || 'application/octet-stream',
      'Content-Length':body.length,
      'X-Content-Type-Options':'nosniff',
      'Referrer-Policy':'strict-origin-when-cross-origin',
      'Cache-Control':'no-cache',
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`BKO disponible en http://localhost:${port}`));
