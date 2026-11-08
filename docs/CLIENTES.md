# Clientes que confían en nosotros — implementación BKO

Fecha: 7 de noviembre de 2026.

## Presentación compacta — actualización vigente

La selección inicial se redujo de diez a **cuatro** empresas, en una fila de escritorio y dos por dos en móvil. Se simplificaron el encabezado, los textos y las tarjetas. Un único desplegable **Ver todas las empresas (22)** sustituye el botón y la segunda cabecera que antes repetían el acceso. Al abrirlo desaparece la selección inicial y queda solo el directorio completo; **Ocultar directorio** devuelve la vista breve. Todos los registros, filtros, enlaces verificados y opciones de ordenación se conservan. El acceso inicial mediante `#clientes-completo` también comienza compacto.

Para reducir repeticiones en la portada se retiraron las cuatro tarjetas de áreas bajo el hero, cuyo contenido ya está desarrollado en Áreas de práctica. Se conservan el menú, las áreas y sus consultas. El manifiesto del editor se actualizó retirando solo los campos de esas tarjetas. Esta revisión modifica `index.html`, `js/website-manifest.json`, los módulos y estilos de clientes, las indicaciones del CMS, las pruebas y la documentación; no realiza escrituras en Supabase.

Pruebas: 36 automatizadas aprobadas, QA del CMS en Edge aprobada y navegador contra localhost sin interceptación con cuatro tarjetas visibles al inicio y 22 al expandir, sin repetir destacados. Anchos 1440/820/390/320 px sin desbordamientos. Logos completos, filtros, ordenación y teclado conservados; sin errores de consola/red. Evidencia `artifacts/clients-live-browser-qa.json`, `artifacts/clients-qa.json`, `artifacts/clients-compact-1440.png` y `artifacts/clients-compact-390.png`.

## Ver las empresas en localhost

Acceso visible: **Empresas** en el menú y el pie, disponible cuando hay catálogo visible. El enlace directo a `#clientes` espera al render antes de desplazar la página; anteriormente podía quedarse arriba porque la sección aún estaba oculta al resolver el ancla. `#clientes-completo` permite acceder a la sección conservando la vista inicial compacta. QA en Edge confirmó el menú y el desplazamiento bajo la cabecera (105 px desde el borde superior).

La portada servida por `npm run dev` muestra una **vista previa local del catálogo inicial**: [http://localhost:3000/#clientes](http://localhost:3000/#clientes). La selección inicial contiene hasta cuatro empresas. El directorio de 22 registros, trece logotipos y nueve nombres se abre con **Ver todas las empresas**. Su aviso identifica la vista local; la clasificación pendiente de CAUCE se conserva en el CMS.

El servidor de desarrollo agrega una señal en el HTML y expone `/__local/clients` exclusivamente en loopback, con columnas públicas del seed existente, sin observaciones, fuentes ni autorizaciones internas. No se copiaron registros ni se cambiaron datos de Supabase. El HTML del repositorio no contiene la señal, y el endpoint no forma parte del hosting estático. La vista previa no se activa por un parámetro en un dominio publicado.

Para comprobar el estado público de Supabase se utiliza [el modo de registros publicados](http://localhost:3000/?clientes=publicados#clientes). Ese modo conserva las reglas de autorización y actualmente oculta la sección al no existir registros publicables. Las modificaciones del CMS se revisan allí o en la vista privada del administrador; la vista previa local utiliza el catálogo inicial conservado en el proyecto.

Archivos de esta corrección: `scripts/serve.mjs`, `js/clients-public.js`, scripts de QA y documentación. Pruebas: 36 automatizadas aprobadas; QA de CMS aprobada; navegador Edge sin interceptación contra la vista local y la API pública, con 22 registros únicos, trece imágenes, nueve nombres, filtros, anchos 1440/820/390 px y cero errores de consola/red o imágenes rotas. Capturas `artifacts/clients-local-1440.png` y `artifacts/clients-local-390.png`.

## Perfeccionamiento de la implementación existente — 7 de noviembre de 2026

Esta revisión amplía la sección existente y conserva los originales, nombres, enlaces, observaciones y estados de autorización. No se ejecutaron importaciones, migraciones, publicaciones, cambios de esquema ni escrituras en producción. Las comprobaciones del backend de esta revisión son de solo lectura; las verificaciones con transacciones descritas más abajo pertenecen a la entrega anterior.

- Paleta: `#071C2B`, `#102F44`, `#E87524`, `#C65A13`, `#F39A54`, marfil y blanco. Los tokens antiguos `--gold` y `--gold-light` permanecen como alias para conservar la compatibilidad. No se editaron archivos de marcas. El hover naranjo oscuro lleva una capa marino de 10 % para alcanzar contraste de texto pequeño con blanco; los acentos de texto pequeño y focos utilizan combinaciones legibles.
- Cuadrícula pública: cinco columnas por encima de 1100 px, tres hasta 1100 px y dos hasta 600 px; se retiró el paso anterior de cuatro columnas. La selección conserva el máximo de diez destacados.
- Directorio: orden institucional, nombre A–Z y Z–A, compatible con los filtros existentes y sus anuncios de resultados.
- CMS: **GESTIÓN DE CLIENTES Y EMPRESAS**, seis indicadores calculados desde los registros guardados que devuelve Supabase y distribución por los siete sectores. Se recalculan al recargar y después de crear, editar o eliminar. Los borradores aún sin guardar no incrementan los totales. «Publicadas» cuenta solo las activas con publicación y relación autorizadas. «Pendientes» cuenta registros sin permiso de relación o con un archivo de logo sin permiso de uso.
- Vista previa privada: incluye los cambios del formulario aún sin guardar y el archivo recién seleccionado. La URL temporal nunca se utiliza para publicación. Se liberan las vistas previas después de guardar o eliminar.
- CAUCE conserva nombre, registro, sector y observaciones editables. Se añadió una advertencia contextual: confirmar si es unidad/servicio propio antes de comunicarla como cliente externo. Su naturaleza sigue pendiente de confirmación; permanece sin publicar. No se añadió una columna ni se supuso una relación comercial.

### Auditoría actual del backend

Plugin oficial de Supabase ejecutado: descubrimiento del proyecto, consultas del catálogo y permisos, inspección de políticas, bucket, historial de migración y código de `client-logo`, además de asesores de seguridad. Resultado: 22 registros y slugs únicos, 13 originales locales, nueve sin archivo, cero publicados, un administrador y bucket privado sin objetos cargados. La tabla no tiene claves foráneas; el control de acceso consulta `bko_admin_members`. RLS está habilitado tanto en clientes como en Storage. `anon` carece de permisos INSERT, UPDATE y DELETE. Las políticas de los demás buckets se revisaron y no conceden acceso a `bko-client-logos`.

No hay hallazgos de los asesores para `bko_clients` o sus políticas. El proyecto compartido sí presenta avisos previos ajenos a esta sección, incluidas tablas de otras aplicaciones sin RLS y protección de contraseñas filtradas desactivada. No se modificaron: [asesor de RLS](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public), [seguridad de contraseñas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Context7 confirmó los endpoints REST utilizados: carga con apikey y JWT del usuario y descarga autenticada para buckets privados. Referencia: [descargas privadas de Supabase](https://supabase.com/docs/guides/storage/serving/downloads).

### Pruebas ejecutadas en esta revisión

- `node --test tests/*.test.mjs`: **36 aprobadas**. Se añadieron casos para distinguir estadísticas de publicación/autorización y evitar que una vista previa otorgue permisos públicos.
- `node scripts/clients-qa.mjs`: navegador Edge real mediante CDP, con transporte de ensayo exclusivamente dentro del script. Verificados 22 registros únicos en el catálogo, 13 imágenes y nueve nombres, máximo de diez destacados, filtros, las tres ordenaciones, apertura/cierre por teclado, paleta, movimiento reducido, vistas previas sin guardar, CRUD, subida/recarga de archivo de ensayo, conflicto de revisión, exclusión del rol editor y actualización de indicadores. Portada en 1440/1024/820/390/320 px y CMS en 1440/820/390/320 px, sin desbordamientos ni imágenes rotas. Cuatro guardados, una carga y una eliminación en el transporte de ensayo; **no equivalen a persistencia real en Supabase**. Se corrigió además el fondo del botón de cierre de sesión: el estilo nativo producía texto blanco sobre gris claro.
- `node scripts/clients-live-qa.mjs`: HTTP real, lectura pública 200 con cero publicados, lectura de columnas internas denegada y logo no publicable 404. No modifica datos.
- `node scripts/clients-live-browser-qa.mjs`: portada y acceso CMS en Edge, sin interceptación de red ni sesión simulada; API de clientes 200, una sola sección, sin excepciones JavaScript, errores de consola, errores HTTP ni solicitudes fallidas. La sección se oculta correctamente al no existir clientes publicables. Las métricas CDP son una observación de laboratorio, no una auditoría Lighthouse ni una medición de usuarios reales.
- `node scripts/check-client-links.mjs`: revisión de los veinte enlaces originales; FCA 503/en construcción, AutoVaras suspendido aunque responde 200, LinkedIn 403, Doña Ema sin DNS, UP Social Club 404 y Las Buenas Brasas con contenido ajeno. Ninguno se habilitó. Un estado HTTP 200 no constituye verificación de identidad. CAUCE y Tierra Santa siguen sin URL oficial confirmada.
- `git diff --check`: aprobado. Los originales y los archivos de investigación se conservaron.

Playwright MCP y Chrome DevTools MCP se invocaron realmente, pero ambos fallaron al arrancar porque su configuración exige Google Chrome y no encuentra su ejecutable. No se reinstalaron herramientas ni se cambió su configuración. Se utilizó Edge instalado como alternativa mediante CDP. Por tanto, **no se declara aprobada una ejecución con esos MCP**.

Evidencia: `artifacts/clients-qa.json`, `artifacts/clients-live-qa.json`, `artifacts/clients-live-browser-qa.json`, `artifacts/client-links-current.json`, capturas `clients-preview-1440.png`, `clients-preview-390.png` y `cms-clients-visible-*.png`. Las capturas con empresas son vistas de ensayo privadas, no una publicación autorizada.

Archivos de esta revisión: `css/styles.css`, `css/luxury.css`, `css/clients.css`, `admin/index.html`, `js/clients-model.js`, `js/clients-render.js`, `js/clients-admin.js`, `scripts/build-clients.mjs`, `scripts/clients-qa.mjs`, `scripts/check-client-links.mjs`, `scripts/clients-live-browser-qa.mjs`, `tests/clients.test.mjs`, esta documentación y `PROJECT_STATUS.md`.

### Aceptación pendiente

Falta una sesión administrativa real y autorización para una prueba controlada de escritura/carga en Supabase. No se crearon usuarios, sesiones ni permisos para sustituir ese acceso. El CMS conserva los endpoints reales de guardado y Storage, pero esta revisión no certifica su recorrido autenticado de extremo a extremo. También faltan las autorizaciones de las relaciones y marcas, la clasificación definitiva de CAUCE, nueve originales y el despliegue del frontend. La sección no debe publicarse saltándose estos permisos.

## Resultado y estado de publicación

Se integró una única sección en `index.html`, después de La firma y antes de Áreas de práctica. No se creó una página independiente ni se reemplazaron las secciones terminadas.

Incluye el título **EMPRESAS QUE CONFÍAN EN NOSOTROS**, los dos textos institucionales entregados, una selección configurable de hasta diez clientes y el enlace **CONOCE A QUIENES CONFÍAN EN NOSOTROS**. Este enlace abre el directorio completo dentro de la misma sección, en `#clientes-completo`. El directorio ofrece filtros por sectores con respaldo documental y una categoría General cuando falta información.

La presentación utiliza cuadrícula estática: cinco columnas en escritorio amplio, cuatro en pantallas intermedias, tres en tablet y dos en móvil. No se implementó un carrusel automático. Hay transiciones discretas y aparición progresiva de los destacados, desactivadas con movimiento reducido.

**Estado real:** 22 registros importados en Supabase; 13 logotipos originales descargados y revisados; ninguno publicado automáticamente. Falta confirmar la autorización para comunicar las relaciones y, por separado, usar los logotipos, tal como exige el punto 12 de la solicitud. Los registros activos se pueden revisar desde la vista previa privada del CMS, incluidos los que no tienen autorización. El visitante no recibe estados de revisión, observaciones ni referencias internas. Cuando no hay clientes publicados, la sección se oculta por completo.

La nueva migración y la función de logotipos están activas en Supabase. No se publicó ni desplegó el frontend en esta actualización.

## CSV original e importación

Fuente original conservada: `clientes/clientes_confian_en_nosotros.csv`.

Se recuperaron los 22 registros mediante lectura controlada de las filas con envoltorio externo de comillas, comillas duplicadas y terminadores `;`. Los puntos y coma incluidos en observaciones se conservaron. Cada registro mantiene el nombre, enlace, fuente, estado y fila originales en sus campos de auditoría.

El CSV llama al registro 14 **CAUCE Gestión Integral / caucegestion.cl**. Se conserva como `original_name`; se utiliza **CAUCE Gestión Integral** como nombre público, según la lista escrita. No se inventó un enlace a partir de ese texto. CAUCE e Inmobiliaria Tierra Santa permanecen sin URL oficial.

La preparación se puede repetir con:

```powershell
npm run import:clients
```

Genera los datos de instalación en `supabase/seeds/clients.json` y `clients.sql`. El SQL usa una clave `slug` única y `ON CONFLICT (slug) DO NOTHING`: al ejecutarlo otra vez no duplica clientes ni sobrescribe ediciones hechas desde el CMS. La preparación de archivos no aplica cambios remotos por sí sola. El SQL ya se ejecutó en el proyecto actual y se verificó una segunda importación en una transacción real.

La copia normalizada y el hash del original están en `docs/interno/clientes/`. Una URL de empresa no se considera prueba de que su logotipo exista o esté verificado. El script de descarga solo genera candidatos; el paso de revisión visual es explícito y no concede derechos de uso.

## Archivos de logotipos incorporados

Los archivos están en `assets/clientes/`, sin recolorear, recortar, deformar ni recomprimir. La visualización usa `object-fit: contain`, límites visuales equilibrados, ALT con la organización, dimensiones reservadas, carga diferida y decodificación asíncrona.

| Organización | Archivo | Página oficial de procedencia |
| --- | --- | --- |
| Afüen / Afüen y Cía. | `afuen-afuen-y-cia.svg` | [Afüen](https://afuen.cl/w/) |
| Hotel Agua Nativa | `hotel-agua-nativa.jpg` | [Hotel Agua Nativa](https://www.aguanativa.cl/) |
| Restaurant Puerto Colono | `restaurant-puerto-colono.png` | [Puerto Colono](https://www.puertocolono.cl/) |
| Hotel Cabaña del Lago | `hotel-cabana-del-lago.png` | [Hotel Cabaña del Lago](https://hotelcabanadellago.cl/) |
| Teski Refugio Volcán Osorno | `teski-refugio-volcan-osorno.png` | [Teski](https://www.teski.cl/) |
| Palm Trade Chile | `palm-trade-chile.webp` | [Palm Trade Chile](https://palmtradechile.com/inicio-nacional/) |
| Laboratorios Obens | `laboratorios-obens.png` | [Obens](https://www.obens.cl/), que redirige mediante su HTML al [sitio corporativo en Wix](https://972507.wixsite.com/obens) |
| DIRECTEMAR | `directemar.svg` | [DIRECTEMAR](https://www.directemar.cl/) |
| Quimlab Chile | `quimlab-chile.png` | [Quimlab Chile](https://quimlabchile.cl/) |
| Constructora Werner | `constructora-werner.jpg` | [Construcciones Werner](https://proyectos.construcciones-werner.cl/) |
| Puerto Pellet | `puerto-pellet.webp` | [Puerto Pellet](https://www.puertopellet.cl/) |
| Agua Puerto Varas | `agua-puerto-varas.svg` | [Agua Puerto Varas](https://www.aguapuertovaras.cl/) |
| Hotel Oelckers | `hotel-oelckers.png` | [Hotel Oelckers](https://hoteloelckers.cl/) |

El manifiesto `docs/interno/clientes/logotipos.json` conserva las URLs exactas de los archivos, MIME, bytes, hash SHA-256, dimensiones, estado de revisión y autorización pendiente. Las respuestas y candidatos de las veinte fuentes consultadas están registrados en `fuentes-investigadas.json`; el HTML original de investigación queda únicamente en artefactos locales excluidos del hosting.

Las variantes oficiales de Puerto Colono, Cabaña del Lago y Teski contienen elementos blancos: se muestran sobre fondo marino para mantenerlos legibles. Los colores de los archivos no se modificaron. Werner ofrece un original de 159 × 112 px; su API de medios confirma que no hay una versión mayor en ese registro. Se presenta reducido y conviene solicitar un original de mayor resolución.

## Clientes pendientes de logotipo

Todos permanecen en el catálogo; la presentación prevista es su nombre tipográfico.

| Organización | Resultado de la revisión |
| --- | --- |
| Transportes FCA | La fuente indicada devolvió un sitio en construcción; falta un logotipo confirmado. |
| AutoVaras | Las variantes HTTP y HTTPS redirigen a una página de cuenta suspendida. No se activa el enlace. |
| Machinery Chile | El sitio utiliza una identidad tipográfica; no se extrajo una fotografía ni se fabricó un logotipo a partir de ella. |
| IPSANORT | El enlace corporativo de LinkedIn no fue accesible para confirmar un archivo. |
| CAUCE Gestión Integral | El CSV no proporciona una URL oficial confirmada ni un archivo de logotipo. |
| Inmobiliaria Tierra Santa (Puerto Varas) | Sin URL oficial ni archivo confirmado. |
| Centro Comercial Doña Ema | El dominio indicado no respondió durante la revisión; no se activa el enlace. |
| Las Buenas Brasas | El dominio indicado muestra contenido ajeno al restaurante. Se conserva la referencia original internamente y no se utilizan sus imágenes ni se crea un enlace público. |
| UP Social Club Osorno | El sitio proporcionado devuelve HTTP 404. No se activa el enlace. |

Las clasificaciones iniciales se apoyan en las páginas oficiales consultadas. Los registros con información insuficiente permanecen en General. El CMS exige una fuente para asignar otro sector.

## CMS: Gestión de clientes

Ingresar a `admin/index.html` con una cuenta BKO cuyo rol sea **admin** y abrir **GESTIÓN DE CLIENTES**. El rol editor no puede administrar este catálogo.

Se puede agregar o eliminar registros, editar nombre y descripción, activar o desactivar clientes, publicar u ocultar, cambiar orden y destacados, asignar sector y su fuente, modificar enlaces, cargar o reemplazar logotipos desde el dispositivo y revisar la selección completa antes de publicar. La vista previa incluye los registros activos, aunque estén en borrador; no constituye una autorización de publicación.

Para publicar un nombre:

1. Confirmar **BKO está autorizada a comunicar públicamente esta relación**.
2. Registrar una referencia interna de esa autorización o base legítima.
3. Activar **Mostrar en la web** y guardar.

Para mostrar un logotipo, además se debe verificar que corresponda al original oficial y registrar su autorización de uso. La procedencia del archivo y su autorización son campos separados. Si falta cualquiera de ellas, se presenta el nombre.

Los archivos seleccionados se previsualizan antes de guardar. Se admiten SVG estáticos, PNG, WebP y JPEG de hasta 2 MB y dimensiones de hasta 10.000 px por lado. Se validan el MIME y la firma del archivo; los SVG no pueden incluir scripts, eventos, entidades o recursos externos. El SVG clásico con declaración SVG 1.1 se admite sin alterar sus bytes.

Al guardar una carga, el archivo se envía a **Supabase Storage**, con una ruta única que queda relacionada con el cliente. La URL temporal del navegador se utiliza solo para la vista previa. Una recarga obtiene nuevamente el archivo privado usando la sesión administradora. Un reemplazo no sobrescribe el original anterior y restablece la verificación y autorización del nuevo logotipo. La modificación de una URL también obliga a verificarla nuevamente.

La eliminación retira realmente el registro. Los archivos privados anteriores se conservan para evitar pérdida de originales; su limpieza debe realizarse desde la administración de Storage. El control de revisión evita sobrescribir cambios concurrentes y la interfaz conserva los datos ante un conflicto.

## Cambios en Supabase

- Migración aplicada: `20261107221059_bko_clients_directory.sql`.
- Tabla `public.bko_clients`: identidad, nombre original, slug único, rutas local y de Storage, dimensiones y fondo, URL, verificación, sector, descripción, orden, actividad, publicación, destacado, autorizaciones, referencias internas, observaciones, fila original y timestamps.
- Trigger `bko_client_revision`: actualiza revisión y fecha; revoca la verificación y autorización al cambiar el archivo y la verificación al cambiar la URL.
- RLS: el visitante puede consultar únicamente columnas públicas de clientes activos, publicados y con relación autorizada. Las columnas de observaciones, fuentes y referencias internas no tienen lectura anónima. La creación, edición y eliminación exigen el rol BKO admin.
- Bucket privado `bko-client-logos`: JPEG, PNG, WebP y SVG, límite de 2 MB; lectura, carga, reemplazo y eliminación limitados a administradores BKO.
- Edge Function `client-logo`, versión 1: valida la clave pública BKO y consulta el estado vigente del cliente antes de servir un archivo privado. Requiere actividad, publicación, autorización de la relación y verificación y autorización del logotipo. Valida nuevamente formato y contenido, limita el tamaño y entrega cabeceras `nosniff`, CSP y `no-store`. Las claves de servicio permanecen en el servidor.
- Los trece originales iniciales están en el repositorio y sus rutas están guardadas en la tabla. Las nuevas cargas desde el CMS utilizan Storage privado. No se presentaron esos originales locales como si ya se hubieran cargado al bucket.

La migración se aplicó mediante el conector, y el archivo local usa la versión real del historial remoto. El CLI Supabase no estaba disponible. No se modificaron las tablas de otros sistemas del proyecto compartido.

## Archivos nuevos o modificados en esta solicitud

| Archivos | Función |
| --- | --- |
| `index.html` | Contenedor de la sección en su ubicación institucional, CSS y módulo público. |
| `admin/index.html` | CSS y módulo del nuevo panel administrativo. |
| `css/clients.css` | Cuadrícula, tarjetas, fondos, filtros, responsive, animaciones y vista previa. |
| `js/clients-model.js` | Validación de registros, URLs y archivos; columnas públicas y sectores. |
| `js/clients-render.js` | Presentación de destacados, directorio, filtros y nombres alternativos. |
| `js/clients-public.js` | Lectura de los registros publicables, estado de sección y enlace directo al directorio. |
| `js/clients-admin.js` | CRUD, publicación, autorizaciones, carga a Storage y vista previa. |
| `js/website-content.js`, `website-manifest.json` | Exclusión del catálogo del editor general para conservar una sola fuente de datos. |
| `package.json` | Comandos de importación, integración y QA. |
| `scripts/import-clients.mjs`, `prepare-clients-import.mjs`, `finalize-client-sources.mjs` | Lectura tolerante, preparación repetible y SQL sin duplicados. |
| `scripts/research-client-logos.mjs`, `client-extra-sources.mjs`, `download-client-logos.mjs`, `review-client-logos.mjs` | Investigación, descarga original y revisión visual documentada. |
| `scripts/build-clients.mjs` | Integración idempotente de la sección y del CMS. |
| `scripts/clients-qa.mjs`, `clients-live-qa.mjs`, `tests/clients.test.mjs` | Pruebas de contenido, UI, permisos, formatos y servicios. |
| `supabase/migrations/20261107221059_bko_clients_directory.sql` | Esquema, permisos, bucket y revisión de registros. |
| `supabase/functions/client-logo/index.ts` | Servicio controlado de archivos privados publicados. |
| `supabase/seeds/clients.json`, `clients.sql` | Veintidós registros iniciales y carga sin duplicados. |
| `assets/clientes/*` | Trece originales oficiales, listados arriba. |
| `docs/interno/clientes/*` | CSV normalizado, procedencia, observaciones y estados de archivos. |
| `docs/interno/transcripciones/CLIENTES-PENDIENTES.md` | Limitación y seguimiento de los dos audios. |
| `docs/CLIENTES.md`, `docs/VERIFICACION-CLIENTES.json`, `README.md` | Entrega, evidencia y acceso a la documentación. |

El CSV original y los dos audios se encontraron en el proyecto al comenzar esta solicitud y se conservaron intactos. Las modificaciones de equipo, Personas y CAUCE de la solicitud anterior también se conservaron.

## Pruebas

- **34 pruebas automatizadas aprobadas**, incluidas las existentes de contacto, seguros, perfiles y editor. Se prueba recuperación de las 22 filas, importación sin duplicados, permisos de publicación, fuentes, enlaces, sectores, formatos reales de los trece originales, rechazo de SVG activo, MIME falso y exceso de tamaño, y la función de logotipos.
- **Interfaz pública con catálogo de prueba basado en los 22 registros reales:** 1440, 1024, 820, 390 y 320 px; columnas 5/4/3/2/2, sin desbordamientos, sin imágenes rotas, proporciones conservadas, directorio completo, destacados, filtros y movimiento reducido.
- **CMS:** vista previa de los 22, carga de archivo desde el dispositivo, ruta de Storage, recarga de vista previa privada, guardado, alta, eliminación, orden, autorización, conflicto y rechazo al rol editor. Anchos 1440, 820, 390 y 320 px. El transporte de estas interacciones se simula únicamente en el script de QA; no existe un modo simulado en la aplicación.
- **SQL real en Supabase:** alta, actualización, eliminación y revisiones bajo rol administrador; rechazo de escritura sin rol; privacidad de borradores y columnas internas; revocación de permisos del logo al reemplazarlo; segunda importación sin duplicados ni pérdida de una edición. Transacciones de prueba revertidas.
- **Storage/RLS real:** inserción y lectura de un registro temporal de objeto con el rol administrador; denegación de lectura anónima y de lectura/escritura a usuarios sin rol. La transacción se revirtió y no dejó registros de prueba. Esta comprobación de permisos no equivale a una carga real de bytes por una sesión de navegador del administrador.
- **HTTP real:** lectura pública con respuesta 200 y cero clientes publicados; consulta de columnas internas rechazada; endpoint de imagen privada con respuesta 404 para un recurso no publicable.
- **Advisors:** sin hallazgos para los nuevos objetos BKO. Se conservaron los avisos ajenos a esta actualización en el proyecto compartido. Referencia: [asesores de seguridad de Supabase](https://supabase.com/docs/guides/database/database-linter).
- Sin excepciones JavaScript en las pruebas de interfaz. `git diff --check` aprobado.

Evidencia local excluida del hosting: `artifacts/clients-qa.json`, `clients-live-qa.json`, `clients-logo-review.png`, `clients-preview-1440.png` y `clients-preview-390.png`. Las capturas representan una vista previa de los registros, no una publicación autorizada.

## Pendientes

1. **Audios:** los dos `.ogg` de las 18:37:42 están disponibles, pero no hay una herramienta habilitada de reproducción/transcripción. No se escucharon ni se transcribieron. Se solicitó su transcripción y falta contrastar sus instrucciones con la implementación escrita.
2. **Autorizaciones:** confirmar qué relaciones y logotipos pueden comunicarse. Hasta entonces los 22 registros permanecen sin publicar. La autorización se puede registrar individualmente desde el CMS.
3. **Nueve logotipos:** recibir originales o fuentes oficiales confirmadas de los casos listados arriba.
4. **Werner:** recomendable recibir una versión original de mayor resolución.
5. **Aceptación con sesión real:** comprobar una carga y reemplazo de archivo mediante las credenciales del administrador. Están implementados el transporte real y la persistencia; la QA de la interfaz usa fixtures y se distingue de las verificaciones reales de DB/RLS.
6. **Publicación del frontend y dominio:** siguen pendientes de la configuración y el despliegue institucional existentes. Esta actualización no publicó otra web ni modificó el dominio.
