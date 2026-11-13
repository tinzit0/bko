# Artículos y estudios

Módulo para subir artículos y estudios. Se administra desde la propia página o desde el panel de Gestión.

## Cómo se usa

1. Inicia sesión en `admin/index.html` con una cuenta `admin` o `editor`.
2. Abre la portada. El botón naranjo **+ Subir artículo o estudio** de la barra inferior abre el formulario desde cualquier página. En **Actualidad** aparece el recuadro de administración con **+ Nuevo artículo**, **+ Nuevo estudio** y **Ver y gestionar todas**.
3. El formulario:
   - **Tipo**: se elige con dos tarjetas (Artículo o Estudio).
   - **Contenido**: editor visual tipo Word. El texto se ve con su formato mientras se escribe: Texto, Subtítulo, Subtítulo menor, **N**egrita, *C*ursiva, listas, cita, enlace, quitar enlace, imagen, deshacer y rehacer. Atajos: Ctrl+B, Ctrl+I y Ctrl+Z.
   - Se puede **pegar desde Word o Google Docs**: se conservan títulos, negritas, cursivas, listas, citas y enlaces, y se descarta todo lo demás. Las fotos se insertan **arrastrándolas** al texto, **pegándolas** o con el botón **Imagen**.
   - Debajo del editor se muestran las palabras y el tiempo de lectura.
   - **Resumen**: si queda vacío se usa el comienzo del texto. El botón **Usar el comienzo del texto como resumen** lo completa.
   - **Portada**: arrastra la imagen o tócala para elegirla. A la derecha, **Así se verá en la portada** muestra la tarjeta en vivo.
   - **PDF**: se arrastra o se elige igual que la imagen.
   - Botones: **Publicar** (visible para todos) o **Guardar borrador** (solo el equipo). Al editar algo ya publicado aparecen **Guardar cambios** y **Pasar a borrador**.
   - El texto se guarda solo en el navegador mientras se escribe. Si se cierra o se corta la conexión, al volver aparece **Recuperar**. Al cerrar con cambios pendientes, el sitio pide confirmación.
   - Al editar, el enlace (slug) no cambia.
4. **Acciones rápidas** en cada tarjeta, sin abrir el formulario: **Editar**, **Publicar/Ocultar** y **★ Destacar**. Se ven las etiquetas PUBLICADA, BORRADOR y DESTACADA.
5. En el panel, la pestaña **Artículos y estudios** usa el mismo formulario, incluido **Eliminar**.

Para los visitantes:
- **Portada**: las tres publicaciones más relevantes (destacadas primero) con el tiempo de lectura.
- **Listado** (`publicaciones/index.html`): filtros Todos, Artículos y Estudios, y un buscador por tema, título, autor o texto.
- **Página de cada publicación**: tiempo de lectura, botón del PDF, **Compartir** (WhatsApp, LinkedIn, correo y copiar enlace) y **Sigue leyendo**, que sugiere publicaciones del mismo tipo o área.
- Mientras no haya nada publicado, la sección Actualidad y su enlace del menú quedan ocultos (`js/news-visibility.js`).

El contenido se guarda como texto con marcas simples (`**negrita**`, `## subtítulo`, `- lista`, `[texto](https://…)`, `![pie](https://…)`), nunca como HTML. `js/rich-text.js` convierte lo que se ve en el editor a ese formato. Los enlaces solo aceptan https:// o correo, y las imágenes solo https://.

## Implementación

- `supabase/migrations/20261112120000_publications.sql`: tabla `bko_publications` con RLS. Los visitantes solo pueden leer las publicaciones marcadas como publicadas, y solo los roles `admin`/`editor` pueden escribir (`bko_has_role`). Incluye control de revisión (`bko_content_revision`) y el bucket público `bko-publications`, que acepta PDF de hasta 25 MB. Las imágenes de portada usan el bucket existente `insurance-media`.
- `js/publications-model.js`: validación, orden, fechas y conversión segura del contenido.
- `js/publications-public.js`: portada y página de publicaciones, con los controles de edición cuando hay sesión.
- `js/rich-text.js`: editor visual (pegar desde Word, conversión segura).
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
