# Artículos y estudios

Módulo para subir artículos y estudios. Se administra desde la propia página o desde el panel de Gestión.

## Cómo se usa

1. Inicia sesión en `admin/index.html` con una cuenta `admin` o `editor`.
2. Abre la portada. En la barra inferior de administración, **+ Subir artículo o estudio** (botón naranjo) abre el formulario desde cualquier página del sitio. En la sección **Actualidad** aparece el recuadro **Administración** con **+ Agregar artículo**, **+ Agregar estudio** y **Gestionar todas**. Cada tarjeta muestra el botón **Editar**. La barra también tiene **Ver publicaciones** para ir al listado completo.
3. El formulario incluye tipo, fecha, título, resumen, contenido, autor, área, imagen de portada, PDF opcional, **Destacar** y **Publicada**.
   - Contenido: separa los párrafos con una línea vacía. Usa `## ` para un subtítulo y `- ` para una lista. El texto se guarda como texto plano y nunca se interpreta como HTML.
   - Sin la casilla **Publicada**, la publicación queda como **borrador** y solo la ve el equipo.
   - Al editar, el enlace (slug) no cambia, así que los enlaces compartidos siguen funcionando.
4. En el panel, la pestaña **Artículos y estudios** lista todas las publicaciones con el mismo formulario, incluido **Eliminar**.

Los visitantes ven las tres más relevantes en la portada (destacadas primero, luego las más recientes) y el listado completo en `publicaciones/index.html`, que se puede filtrar por Artículos o Estudios. Cada publicación tiene su propia página en `publicaciones/index.html?p=<slug>` con botón para abrir el PDF. Si todavía no hay publicaciones, la portada conserva las tres tarjetas de espacio editorial.

## Implementación

- `supabase/migrations/20261112120000_publications.sql`: tabla `bko_publications` con RLS. Los visitantes solo pueden leer las publicaciones marcadas como publicadas, y solo los roles `admin`/`editor` pueden escribir (`bko_has_role`). Incluye control de revisión (`bko_content_revision`) y el bucket público `bko-publications`, que acepta PDF de hasta 25 MB. Las imágenes de portada usan el bucket existente `insurance-media`.
- `js/publications-model.js`: validación, orden, fechas y conversión segura del contenido.
- `js/publications-public.js`: portada y página de publicaciones, con los controles de edición cuando hay sesión.
- `js/publications-editor.js`: formulario compartido para crear, editar, publicar y eliminar, y para cargar imagen y PDF.
- `js/publications-admin.js`: pestaña del panel.
- `css/publications.css`, `publicaciones/index.html` y `tests/publications.test.mjs`.
- El editor visual (`website-content.js`) excluye las tarjetas dinámicas. Se retiraron del manifiesto los 18 campos de las tarjetas de ejemplo.

## Activación (una vez)

Ejecutar la migración en producción:

```powershell
npx supabase db query --remote=kxldsjodgfonrrlwjbws --file supabase/migrations/20261112120000_publications.sql --yes
```

Mientras no se ejecute, el sitio sigue funcionando igual: muestra las tarjetas de ejemplo y el panel avisa que falta la migración.
