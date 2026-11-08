# Auditoría previa — actualización integral BKO

Fecha: 7 de noviembre de 2026.

## Requisito previo pendiente

No se encontró `assets/referencias/audios/` ni ningún archivo `.ogg` al revisar recursivamente el proyecto. Los cinco audios solicitados no están disponibles en el espacio de trabajo. No se han escuchado, transcrito ni contrastado con los requisitos escritos. No se dispone de una herramienta de transcripción de audio entre las herramientas habilitadas de esta sesión; se requiere una transcripción proporcionada por el usuario.

Archivos pendientes:

- WhatsApp Audio 2026-11-07 at 17.52.07 (1).ogg
- WhatsApp Audio 2026-11-07 at 17.52.07.ogg
- WhatsApp Audio 2026-11-07 at 17.05.21.ogg
- WhatsApp Ptt 2026-11-07 at 16.29.13.ogg
- WhatsApp Audio 2026-11-07 at 17.52.07 (2).ogg

Se respeta la instrucción de analizar los audios antes de programar. Esta fase solo documenta la auditoría; no implementa cambios en la web ni en Supabase. Las futuras transcripciones deben guardarse en `docs/interno/transcripciones/`, fuera de los directorios públicos; no guardar transcripciones dentro de `assets/`, que se copia al hosting.

## Arquitectura encontrada

- Sitio estático con HTML, CSS y módulos JavaScript, sin dependencias de producción.
- `index.html` contiene navegación, áreas de práctica, Personas, equipo, seguros y contacto.
- `equipo/` contiene perfiles individuales de Camila, Roxana, Fenella y Estefanía.
- `scripts/build-profiles.mjs` conserva la biografía extensa de Camila y genera perfiles. Debe actualizarse junto con los documentos generados para evitar regresiones.
- Personas ya existe con Familia y Laboral: debe ampliarse en su ubicación actual.
- `seguros/index.html` y los módulos `insurance-*` implementan el área especializada de Roxana; conservar su CMS y CRM.
- `site_content.website` alimenta las ediciones generales; `site_content.insurance` contiene el modelo de seguros, según código y documentación local. No se verificó su estado remoto durante esta auditoría.
- El editor general modifica textos e imágenes mediante selectores del documento. No se encontró un modelo estructurado del equipo que permita agregar, ordenar, relacionar y despublicar profesionales. Será necesario ampliarlo y contemplar las ediciones existentes.
- El manifiesto `js/website-manifest.json` y su validación deben actualizarse si se incorporan nuevas páginas.
- Las áreas del formulario también están restringidas por la validación y los constraints de Supabase: reorganizarlas exige mantener coherencia entre frontend, función de contacto y base de datos.
- El servidor y el workflow de publicación usan listas de directorios públicos; deberán incluir las nuevas rutas que se implementen.

## Recursos y contenido existentes

- Jorge: `assets/personas/jorge.jpeg`, archivo existente no seguido por Git al iniciar la auditoría. No se modificó. Identificación por nombre de archivo, pendiente inspección visual.
- Camila: original y variantes locales; fotografía actual `camila original.png`. Biografía extensa en su página y generador, con cinco apartados, cronología y publicación jurídica.
- Roxana: `roxana.png` y `roxana-367.webp`; perfil e integración de seguros existentes.
- Fenella: archivo local `dra fenella reyes gonzalo psiauiatra infanto juvenil área de familia.jpeg`; perfil existente.
- Asistente: ya existe un perfil de Estefanía Benítez García, con cargo de asistente contable y fotografía local. Confirmar si es la asistente de esta actualización antes de reemplazar su información o crear una duplicación.
- No se encontró fotografía de Luis entre los archivos de `assets/personas/`.
- Orden actual en HTML: Camila, Roxana, Estefanía, Fenella.
- Orden solicitado: Jorge, Camila, Fenella, Luis, Roxana, asistente.
- Acuicultura conserva un área independiente, enlace sectorial y opción de contacto; integrar el contenido y actualizar esos enlaces conjuntamente.
- CAUCE no figura como sección ni perfil individual en los archivos revisados.

## Validación inicial

Ejecutado: `node --test tests/contact.test.mjs tests/insurance.test.mjs tests/site.test.mjs tests/website-editor.test.mjs`.

Resultado: 18 pruebas aprobadas, 0 fallidas. Son pruebas locales de la versión existente, no acreditan funcionamiento remoto ni cumplimiento de la actualización solicitada. No se hicieron pruebas visuales en esta fase.

## Pendientes para continuar

1. Recibir las transcripciones de los cinco audios, identificadas por archivo, y contrastarlas con el requerimiento escrito.
2. Confirmar si debe conservarse el perfil existente de Estefanía como la asistente solicitada.
3. Mantener pendientes de autorización los contactos personales no aprobados y no inventar antecedentes curriculares.

Único archivo creado en esta fase: este documento. Sin cambios de código, migraciones, publicaciones ni escrituras remotas.
