# Edición desde la página y desde Gestión

1. Iniciar sesión en `admin/index.html` con una cuenta autorizada.
2. Pulsar **Editar página principal**. La sesión se comparte entre el panel, la página y otras pestañas del mismo origen.
3. Activar **Editar página** en la barra privada inferior. Los textos y fotografías editables se identifican con un contorno dorado.
4. Seleccionar el texto o la fotografía, modificar y pulsar **Guardar y publicar**. La fotografía de fondo del inicio se modifica con **Foto de portada** en la barra.
5. Los cambios se guardan en Supabase y se muestran también a visitantes al abrir o recargar la página.

La opción **Contenidos de la web** del panel edita los mismos textos y fotografías. Incluye inicio y perfiles. El catálogo, la presentación del área y Roxana se editan en **Contenidos de seguros**, o directamente desde sus elementos en la página; no hay dos copias independientes de estos contenidos.

Los visitantes y el rol `insurance` no tienen acceso al editor. Solo `admin` y `editor` pueden publicar. Los permisos se verifican en Supabase y mediante las políticas existentes. Las cuentas no obtienen privilegios por modificar el navegador.

Los textos se guardan como texto plano conservando las etiquetas y los espacios originales, sin ejecutar HTML. Las imágenes admiten rutas `assets/` o HTTPS; los archivos JPEG, PNG y WebP se cargan al almacenamiento autorizado. No se alteran originales del repositorio. Hay control de revisión para evitar sobrescribir ediciones concurrentes y cierre de sesión compartido entre pestañas. Las fotografías y los textos generales se guardan en `site_content.website`; los de seguros continúan en `site_content.insurance`.

Implementación: `js/visual-editor.js`, `js/website-content.js`, `js/insurance-bindings.js`, `js/cms-session.js`, `js/website-admin.js`, `css/visual-editor.css` y migración `20261107171623_inline_website_editor.sql` (ya aplicada al proyecto BKO).

El catálogo del panel está en `js/website-manifest.json`. Si un desarrollador cambia la estructura HTML, regenerarlo con servidor local y Edge/Chrome CDP en 9333: `node scripts/build-website-manifest.mjs`. Las ediciones habituales del propietario no requieren estos comandos.

Validación real con la cuenta administradora: inicio de sesión, edición desde la portada, persistencia después de recargar, edición del mismo dato desde el panel, vista pública sin controles de edición y funcionamiento de barra y diálogo a 390, 820 y 1440 px. Los cambios temporales de verificación fueron restaurados al finalizar. No se registraron excepciones JavaScript.

Los cambios del frontend se encuentran en el proyecto local. La migración del editor sí está activa en Supabase; la publicación de la web no se realizó en este paso.
