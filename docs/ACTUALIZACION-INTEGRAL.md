# Actualización integral BKO

Implementación local: 7 de noviembre de 2026. Backend aplicado al proyecto Supabase existente `kxldsjodgfonrrlwjbws`. El frontend no se publicó durante esta actualización.

## Resultado

- Equipo ordenado: Jorge, Camila, Fenella, Luis, Roxana y Estefanía. Cada integrante tiene tarjeta y perfil propio. El orden se modifica desde el CMS.
- Jorge utiliza el archivo real `assets/personas/jorge.jpeg`, inspeccionado visualmente y conservado intacto. Perfil con presentación, cinco apartados completos, cronología y bajada profesional.
- Camila conserva la presentación extensa, los cinco apartados de su biografía, cronología, antecedentes académicos y obra en coautoría. Su perfil enlaza a Derecho Laboral y el área enlaza a su perfil.
- Fenella conserva su fotografía local y cuenta con presentación institucional, participación en Familia y campos para completar antecedentes desde el CMS. No se agregaron grados ni contactos personales.
- Luis cuenta con tarjeta y perfil independiente. Se utiliza una composición tipográfica BKO mientras falta su fotografía; no se empleó un retrato genérico.
- CAUCE tiene página comercial propia, presentación de Luis, servicios, beneficios, proceso, nueve apartados de metodología y formulario conectado al endpoint de contacto. La portada contiene un acceso breve.
- Roxana conserva fotografía, presentación y especialidades compartidas con el CMS de seguros. Se mantiene el CRM existente, con nuevas consultas CAUCE visibles para administradores en «Todas las áreas».
- Se conserva a Estefanía Benítez García como asistente contable existente, pendiente de confirmar que sea la asistente solicitada. No se creó una segunda asistente.
- Personas amplía la sección existente con Familia y Laboral, sus mensajes institucionales y el enfoque médico-jurídico y psicosocial. Fenella y Roxana participan con sus roles respectivos. El equipo jurídico responsable puede asignarse desde el CMS entre profesionales del ámbito jurídico.
- Cuatro áreas principales: Corporativo; Minería, Construcción y Servicios Asociados; Marítimo y Naviero; Inmobiliario. Acuicultura, recursos hidrobiológicos, concesiones, centros de cultivo, contratos, producción y comercialización se integran en Marítimo y Naviero. La tarjeta sectorial también se presenta bajo esta área.
- Menú con submenús accesibles, perfiles individuales, Personas y categorías de seguros. Se conservan el diseño editorial, los colores, las tipografías y los originales fotográficos.
- Títulos y metadescripciones por perfil y CAUCE, datos estructurados, ALT, encabezados y recursos/enlaces revisados. Se conserva el estado de preparación `noindex` hasta configurar el dominio definitivo.

## Administración

Abrir `admin/index.html`, ingresar con una cuenta BKO autorizada y seleccionar **EQUIPO, PERSONAS Y CAUCE**.

1. Seleccionar el perfil, área o página.
2. Modificar campos y guardar. Los números menores aparecen primero en el equipo.
3. Para añadir integrantes, pulsar **AGREGAR PROFESIONAL**. Se crea un borrador; completar nombre, cargo y presentación antes de publicarlo.
4. Cargar fotografías JPEG, PNG o WebP de hasta 8 MB desde el computador. Se usan Storage y los permisos existentes; no se sobrescriben los originales locales.
5. Editar apartados y cronología mediante sus campos; se pueden agregar o retirar apartados. El perfil de la asistente también dispone de funciones y correo sujeto a autorización.
6. Usar **Activo** y **Publicado** para controlar la presentación pública. Un nuevo profesional obtiene su perfil mediante `equipo/perfil.html?id=...` sin modificar código.
7. Nombre, cargo, presentación, foto y especialidades de Roxana continúan en **CONTENIDOS DE SEGUROS**, compartidos con su área; orden y relaciones se modifican en el nuevo panel.
8. Direcciones y contenidos generales permanecen en el editor visual y en **CONTENIDOS DE LA WEB**.

Los registros nuevos usan `bko_content`. RLS permite al visitante leer solo registros activos y publicados; `admin` y `editor` pueden leer borradores y guardar. Los demás usuarios no tienen permisos de edición.

`save_bko_content` guarda atómicamente el registro público y sus campos privados. Comprueba el rol y la revisión previa; una revisión desactualizada se rechaza sin sobrescribir otra edición. Los correos sin autorización y los criterios de intereses de CAUCE se guardan en `bko_content_private`, sin lectura pública. Los criterios no contienen tasas ni fórmulas precargadas y no ejecutan un cálculo automático.

La web estática necesita JavaScript para mostrar el estado vigente del CMS. Se ocultan las versiones iniciales hasta recibir la respuesta del servidor. En una falla de conexión se informa que el contenido no está disponible; no se restaura un perfil despublicado desde una copia de respaldo. Los HTML del repositorio conservan los contenidos iniciales aprobados para su preparación editorial; despublicar controla la interfaz y la API, no elimina versiones históricas del repositorio.

## Archivos

| Archivos | Cambio |
| --- | --- |
| `index.html` | Equipo, Personas, áreas, navegación y acceso a CAUCE. |
| `equipo/*.html` | Perfiles existentes actualizados; perfiles nuevos de Jorge y Luis; ruta genérica para integrantes agregados desde el CMS. |
| `cauce/index.html` | Página especializada y formulario. |
| `seguros/index.html` | Navegación compartida actualizada, conservando catálogo y formulario. |
| `css/firm.css` | Diseño editorial de CAUCE, Personas, submenús, estados de carga y adaptación responsive. |
| `js/firm-model.js`, `firm-render.js`, `firm-public.js` | Validación, presentación y lectura pública del contenido estructurado. |
| `js/firm-admin.js`, `admin/index.html` | Panel del CMS para equipo, relaciones, publicación y contenido especializado. |
| `js/cauce.js`, `cauce-default.js` | Formulario y contenido institucional aprobado de CAUCE. |
| `js/app.js`, `profiles.js` | Navegación compatible con los nuevos submenús y contenido dinámico. |
| `js/cms-session.js` | Mensaje específico ante conflictos de revisión. |
| `js/website-content.js`, `website-manifest.json` | Separación de campos del editor general y el CMS estructurado; ruta CAUCE incorporada. |
| `js/validation.js` | Nuevas áreas aceptadas; etiquetas históricas conservadas por compatibilidad con registros anteriores. |
| `supabase/migrations/20261107212814_firm_professionals_people_cauce.sql` | Tablas, políticas, guardado transaccional y áreas de consultas. Aplicada en Supabase. |
| `supabase/seeds/firm.json`, `firm.sql` | Datos iniciales aprobados; instalación idempotente con `ON CONFLICT DO NOTHING`. Fuera del hosting. |
| `scripts/build-firm.mjs`, `build-profiles.mjs`, `build-insurance.mjs` | Generación coordinada de páginas, conservando el área de seguros. |
| `scripts/export-firm-seed.mjs` | Genera el SQL de instalación sin sobrescribir ediciones del CMS. |
| `scripts/build-website-manifest.mjs`, `configure-domain.mjs` | Nuevas rutas y configuración SEO. |
| `scripts/serve.mjs`, `.github/workflows/pages.yml` | Publicación de CAUCE y exclusión de `assets/referencias/`. Documentación y transcripciones no se publican. |
| `tests/firm.test.mjs`, `scripts/firm-qa.mjs`, `firm-admin-qa.mjs` | Verificaciones de contenido, enlaces, CMS y responsive. |
| `package.json`, `README.md` | Comandos y documentación actualizados. |

La fotografía de Jorge ya estaba presente como archivo no seguido por Git antes de comenzar. Se utiliza sin alterarla.

## Supabase y pruebas

La migración se aplicó mediante el conector Supabase. El archivo local usa la versión devuelta por el historial remoto; no se dispuso del CLI Supabase instalado. Se insertaron 14 registros iniciales sin sobrescribir registros existentes. La función `contact` se desplegó en su versión 2, conservando autenticación, controles de spam, contrato de respuesta e integración de seguros, y ampliando su validación de áreas.

- **25 pruebas automatizadas aprobadas**: contenido completo, orden, visibilidad, escape de HTML, validación de imágenes y relaciones, metadatos, recursos, anclas y contratos existentes.
- **36 combinaciones de página y viewport**: portada, seis perfiles, CAUCE y seguros a 1440, 820, 390 y 320 px. Se verificaron fotografías, H1, ausencia de desbordamiento, menús y excepciones JavaScript.
- **Panel administrativo**: guardado, orden, alta de un profesional, publicación y despublicación del perfil genérico, carga de fotografía, campos privados, conflicto de revisión y formulario CAUCE. Se probó a los mismos cuatro anchos. El transporte de estas interacciones se simula únicamente en el script de QA, sin modificar la aplicación.
- **Base de datos real**: escrituras mediante `save_bko_content` bajo rol autenticado de administración; revisión incremental; rechazo de ediciones desactualizadas; aislamiento de correo sin autorización; denegación a visitantes y usuarios sin rol. Las transacciones de verificación se revirtieron al finalizar.
- **Solicitud CAUCE en base de datos real**: se comprobó el almacenamiento mediante `submit_consultation` con su área propia, sin asignarle un seguro ni representación jurídica. La consulta técnica se revirtió.
- **Advisors**: sin observaciones para las tablas y función nuevas. El proyecto compartido conserva avisos sobre otros sistemas que no se modificaron; referencia de [asesores de seguridad de Supabase](https://supabase.com/docs/guides/database/database-linter).

Evidencia local: `artifacts/firm-update-qa.json`, `artifacts/firm-admin-qa.json` y capturas `artifacts/firm-*.png`. Los artefactos están excluidos de Git y del hosting. Estas pruebas no equivalen a una nueva sesión real con las credenciales del administrador; se separó la validación de interfaz de las pruebas reales de permisos y escritura.

Comandos:

```powershell
npm run dev
npm test
npm run build:firm
node scripts/build-website-manifest.mjs
npm run qa:firm
node scripts/firm-admin-qa.mjs
```

Los scripts visuales requieren Edge o Chrome con CDP en `127.0.0.1:9333`, además del servidor local. El manifiesto requiere el servidor y CDP; no forma parte del uso habitual del CMS. Los generadores utilizan los datos iniciales del repositorio; las ediciones posteriores del CMS se cargan de Supabase al abrir las páginas.

## Pendientes

1. Los cinco audios no están disponibles y no se transcribieron. No hay herramienta de transcripción habilitada en esta sesión. El usuario indicó continuar después de recibir esta información; se implementaron los requisitos escritos. Falta recibir las transcripciones y contrastar instrucciones adicionales. Carpeta reservada: `docs/interno/transcripciones/`.
2. Confirmar que Estefanía Benítez García sea la asistente indicada; se conservó su perfil existente.
3. Fotografía de Luis y antecedentes complementarios aprobados de Fenella, cuando estén disponibles.
4. Autorizaciones para nuevos contactos personales. Ningún contacto personal nuevo fue publicado.
5. Dominio definitivo, origen autorizado para formularios y publicación del frontend. La configuración de preparación conserva `noindex`; no se inventó un dominio.
6. Completar la aprobación de la política de privacidad y los datos institucionales pendientes que ya documentaba el proyecto.
