# BKO — Bentjerodt Koplin y Oyarzún Consultores

**Artículos y estudios**: con la sesión iniciada se agregan, editan y publican directamente en la portada (sección Actualidad) o desde Gestión → ARTÍCULOS Y ESTUDIOS. Ver [uso, archivos y activación](docs/PUBLICACIONES.md).

La sección institucional de clientes está integrada en la portada y dispone de **GESTIÓN DE CLIENTES** en el CMS. Se importaron 22 registros y se incorporaron 13 logotipos oficiales; la publicación está pendiente de sus autorizaciones. Ver [archivos, fuentes, administración, pruebas y pendientes](docs/CLIENTES.md).

La actualización de equipo, Personas y CAUCE está implementada en el proyecto y conectada a Supabase. Administración → **EQUIPO, PERSONAS Y CAUCE** permite editar perfiles, orden, publicación, relaciones y servicios. Ver [implementación, archivos, pruebas y pendientes](docs/ACTUALIZACION-INTEGRAL.md).

El área de Negocios y Seguros Corporativos, el CMS y el CRM autenticado se documentan en [docs/SEGUROS.md](docs/SEGUROS.md). Las tres migraciones y la función de contacto están activas en Supabase y se verificaron con escrituras reales y pruebas de permisos. La cuenta administradora solicitada por el propietario está creada y su acceso al CMS/CRM fue verificado. Queda pendiente el dominio público para autorizar sus envíos. La evidencia de activación está en [docs/VERIFICACION-SUPABASE.json](docs/VERIFICACION-SUPABASE.json).

Sitio corporativo one page en español de Chile. HTML semántico, CSS responsive y JavaScript modular; sin frameworks ni dependencias de producción. Backend implementado como Edge Function de Supabase y migración PostgreSQL con RLS. Se conservan sin cambios los originales de `como quiero la pagina/`.

## Iniciar en Windows / Visual Studio Code

Requiere Node.js 22 o superior. Abrir esta carpeta en VS Code y ejecutar:

```powershell
npm run dev
```

Abrir http://localhost:3000. Si Node no está en el PATH (como en el entorno usado para construir el sitio):

```powershell
& 'C:\Program Files\nodejs\node.exe' scripts/serve.mjs
```

No requiere `npm install`. No abrir `index.html` mediante `file://`: usa módulos JavaScript y necesita HTTP. Alternativamente puede servirse con Live Server; su origen debe autorizarse en Supabase si se usará el formulario.

## Archivos principales

- `index.html`: todas las secciones, contenido, metadatos, Schema y diálogos.
- `css/styles.css`: identidad visual, responsive, animaciones, accesibilidad y movimiento reducido.
- `js/app.js`: navegación, acordeones, entradas al scroll, WhatsApp y envío confirmado.
- `js/config.js`: URL Supabase, clave pública, dominio, tres correos y futura configuración de medición.
- `js/validation.js`: validación compartida entre navegador y backend.
- `assets/`: panorámica, Santiago, favicon y recurso social. WebP locales; ver créditos.
- `supabase/`: función `contact`, configuración y migración de consultas privadas.
- `scripts/`: servidor local, configuración SEO, preparación de imágenes y QA.
- `tests/`: pruebas del contrato del formulario y de la estructura del sitio.
- `.github/workflows/pages.yml`: publicación manual con GitHub Actions.
- `docs/`: conexión Supabase, GitHub, publicación, correos y resultados de pruebas.

## Estado real de las conexiones

La URL y clave **publishable** entregadas están configuradas en el frontend. La función hace una petición real a `/functions/v1/contact`. No existe un modo de envío simulado. Si no se ha desplegado la función o falla el servicio, el sitio muestra error y conserva el mensaje.

La base de datos y la función de contacto están activas en Supabase. La actualización integral incorpora `bko_content`, `bko_content_private` y guardado transaccional con control de revisión. La clave pública permite leer exclusivamente el contenido publicado; los permisos administrativos se validan en la base de datos. Los antecedentes de instalación anteriores se conservan en [SUPABASE.md](docs/SUPABASE.md).

Se inicializó Git localmente. La configuración del remoto fue bloqueada por los permisos del entorno sobre `.git/config`; no hay commit ni push confirmados. El flujo de publicación está preparado para `https://github.com/tinzit0/bko.git`. Ver [PUBLICACION.md](docs/PUBLICACION.md).

## Antes de publicar

1. Configurar el origen del dominio definitivo en la función de contacto y probar una consulta de aceptación. La migración de la actualización integral y la versión 2 de la función ya están activas.
2. Entregar dominio definitivo y ejecutar `npm run configure-domain -- https://dominio-real.cl`. Genera canonical, Open Graph absoluto, Schema con URL, sitemap y robots indexables. La versión de preparación tiene **noindex** y robots bloqueado para evitar indexar borradores.
3. Completar y aprobar política de privacidad, responsable y plazo de conservación. Actualizar `privacy_version` en la migración/función según el texto aprobado.
4. Entregar retratos autorizados y biografías, contenido editorial real y los tres correos. Los placeholders no inventan cargos, fechas o publicaciones.
5. Aprobar las ilustraciones de territorio o sustituirlas por fotografías reales con permiso de uso. No se presentan como fotografías documentales. El hero WebP pesa aproximadamente 254 KB y Santiago 351 KB.
6. Publicar únicamente archivos públicos. El workflow ya excluye originales, tests y backend del hosting.

## Verificación

```powershell
npm test
```

Las pruebas de backend ejecutan el manejador con variables y transporte de prueba, sin escribir datos en Supabase. La QA visual usa Edge y DevTools Protocol sin dependencias adicionales; instrucciones y límites en [PRUEBAS.md](docs/PRUEBAS.md).

## Medición futura

Se reservan identificadores GTM/GA4 en `js/config.js`. No se carga seguimiento sin consentimiento. Eventos nativos disponibles: `bko:contact-click` para WhatsApp y `bko:consultation-sent` solo tras confirmar almacenamiento. No incluyen el contenido del mensaje, correo ni teléfono. Antes de activar Google Ads/GA4, implementar la gestión de consentimiento correspondiente y conectar los eventos desde el contenedor o módulo de medición.
