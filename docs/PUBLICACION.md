# GitHub y publicación

Repositorio solicitado: https://github.com/tinzit0/bko.git

La carpeta se inició como repositorio Git, pero esta sesión no pudo añadir el remoto: el usuario aislado no es propietario de la carpeta y la modificación de `.git/config` fue rechazada por la política de permisos. La salida de red hacia GitHub está bloqueada; no hay push ni despliegue confirmado. No se modificó la configuración global de Git.

## Conectar desde tu terminal de VS Code

```powershell
git remote add origin https://github.com/tinzit0/bko.git
git ls-remote origin
git status
```

Si `origin` ya existe, comprobar primero `git remote -v`; cambiarlo solo si corresponde. Si el remoto tiene commits, hacer `git fetch origin` e integrar su historial antes del primer push. No usar `push --force` ni sobrescribir trabajo remoto.

Si el remoto está vacío, revisar los archivos y subirlos:

```powershell
git add .
git commit -m "Implementa sitio corporativo BKO y formulario Supabase"
git push -u origin main
```

GitHub solicitará tu autenticación si todavía no está configurada. No incluir tokens en URLs, archivos ni capturas.

## GitHub Pages

1. Activar Pages → Source: GitHub Actions en la configuración del repositorio.
2. Revisar contenido, privacidad, dominio y configuración del backend.
3. En Actions, ejecutar manualmente **Publicar BKO en GitHub Pages**.
4. El workflow prueba y empaqueta únicamente `index.html`, `robots.txt`, `sitemap.xml`, `assets/`, `css/` y `js/`.
5. Verificar el dominio publicado y agregar su origen exacto en `ALLOWED_ORIGINS` de Supabase.

Se usan rutas relativas, compatibles con un sitio de proyecto `/bko/`. Para SEO definitivo se recomienda el dominio propio, configurado en Pages y DNS con los valores que indique GitHub. No se ha configurado DNS ni publicado un dominio en esta sesión.

## Dominio definitivo y SEO

```powershell
npm run configure-domain -- https://dominio-real.cl
```

Reemplazar el argumento por el dominio real. El comando es idempotente y configura canonical, URL de Open Graph, imagen absoluta, Schema, sitemap y robots. No inventa un dominio por defecto. Verificar HTTPS y redirección consistente entre variantes www/sin www. Enviar `sitemap.xml` a Search Console una vez publicado.

La imagen social utiliza WebP al configurar dominio; para compatibilidad máxima con todas las plataformas se puede entregar además un JPEG de 1200 × 630 y ajustar `og:image`. `assets/social.svg` conserva la propuesta gráfica original.

## Otros alojamientos

El sitio no necesita compilación. Subir **solo los archivos públicos** anteriores al document root de un hosting estático HTTPS. No servir `supabase/`, `.git/`, `tests/`, `docs/`, originales ni archivos de entorno. Configurar `X-Content-Type-Options: nosniff`, política de referentes y las cabeceras de seguridad del proveedor. Probar conexiones externas permitidas antes de aplicar una CSP restrictiva.
