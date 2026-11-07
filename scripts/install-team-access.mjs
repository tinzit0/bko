import { readFile, writeFile, readdir } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const pages = ['index.html', 'seguros/index.html', ...(await readdir(new URL('equipo/', root))).filter(f => f.endsWith('.html')).map(f => 'equipo/' + f)];
for (const path of pages) {
  const prefix = path === 'index.html' ? '' : '../';
  let html = await readFile(new URL(path, root), 'utf8');
  html = html.replace(/<link rel="stylesheet" href="(?:\.\.\/)?css\/team-access\.css">/g, '');
  html = html.replace('</head>', `<link rel="stylesheet" href="${prefix}css/team-access.css"></head>`);
  html = html.replace(/<a class="(?:admin-access|mobile-admin-access)"[^>]*>[\s\S]*?<\/a>\s*/g, '');
  html = html.replace(/href="(?:\.\.\/)?admin\/index\.html"/g, `href="${prefix}admin/index.html"`);
  html = html.replace(/<a(?: class="footer-admin-access")? href="(?:\.\.\/)?admin\/index\.html">[^<]*<\/a>/g, `<a class="footer-admin-access" href="${prefix}admin/index.html">Administración</a>`);
  await writeFile(new URL(path, root), html);
}
