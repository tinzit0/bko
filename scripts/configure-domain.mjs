import { readFile, writeFile, readdir } from 'node:fs/promises';
const input = process.argv[2];
let url;
try { url = new URL(input); } catch { throw new Error('Uso: npm run configure-domain -- https://dominio-real.cl'); }
if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/' || !/^[a-z\d.-]+\.[a-z]{2,}$/i.test(url.hostname)) throw new Error('Se requiere un dominio HTTPS real, sin rutas, credenciales ni parámetros.');
const origin = url.origin;
const root = new URL('../', import.meta.url);
let html = await readFile(new URL('index.html', root), 'utf8');
html = html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="index, follow">');
html = html.replace(/\s*<link rel="canonical"[^>]*>/g, '').replace(/\s*<meta property="og:url"[^>]*>/g, '');
html = html.replace('</head>', `  <link rel="canonical" href="${origin}/">\n  <meta property="og:url" content="${origin}/">\n</head>`);
html = html.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${origin}/assets/hero.webp">`);
html = html.replace(/(<script type="application\/ld\+json">)(.*?)(<\/script>)/s, (_,start,body,end) => `${start}${JSON.stringify({...JSON.parse(body),url:origin + '/'})}${end}`);
await writeFile(new URL('index.html', root), html);
const routes=[''];
for(const directory of ['equipo','seguros']){
  for(const name of await readdir(new URL(directory+'/',root))){
    if(!name.endsWith('.html'))continue;
    const path=directory+'/'+name,route=name==='index.html'?directory+'/':path;
    let page=await readFile(new URL(path,root),'utf8');
    page=page.replace(/\s*<link rel="canonical"[^>]*>/g,'').replace(/\s*<meta property="og:url"[^>]*>/g,'').replace(/<meta name="robots" content="[^"]*">/,'<meta name="robots" content="index, follow">');
    page=page.replace('</head>',`<link rel="canonical" href="${origin}/${route}"><meta property="og:url" content="${origin}/${route}"></head>`);
    page=page.replace(/<meta property="og:image" content="[^"]*">/,`<meta property="og:image" content="${origin}/assets/hero.webp">`);
    page=page.replace(/(<script type="application\/ld\+json"[^>]*>)(.*?)(<\/script>)/s,(_,a,body,b)=>a+JSON.stringify({...JSON.parse(body),url:origin+'/'+route})+b);
    await writeFile(new URL(path,root),page);routes.push(route);
  }
}
await writeFile(new URL('robots.txt',root), `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /supabase/\nDisallow: /docs/\nDisallow: /tests/\nDisallow: /como%20quiero%20la%20pagina/\nSitemap: ${origin}/sitemap.xml\n`);
await writeFile(new URL('sitemap.xml',root), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(route=>`<url><loc>${origin}/${route}</loc></url>`).join('')}</urlset>\n`);
const configFile = new URL('js/config.js', root);
let config = await readFile(configFile, 'utf8');
config = config.replace(/siteUrl: '[^']*'/, `siteUrl: '${origin}'`);
await writeFile(configFile, config);
console.log('Dominio, canonical, Open Graph, Schema, sitemap y robots configurados:', origin);
