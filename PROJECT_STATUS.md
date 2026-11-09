# Estado del proyecto BKO

Actualizado: 7 de noviembre de 2026, hora de Chile.

## Clientes y empresas

### Logotipos públicos habilitados

Por instrucción expresa del usuario «pero no se ven los logos quiero que se vean», se habilitó `logo_authorized` para los trece originales verificados de empresas publicadas y se registró la referencia correspondiente en Supabase. La autorización de nombres y la de logotipos permanecen independientes. No se modificaron archivos de marcas, enlaces, esquema ni permisos.

Comprobado en la web pública: trece imágenes con HTTP 200, dimensiones válidas y SHA-256 idéntico a cada original del manifiesto. Se conservan cuatro tarjetas al inicio, 21 empresas en el directorio y ocho nombres tipográficos públicos sin logotipo; CAUCE sigue en borrador. Escritorio/tablet/móvil sin desbordamientos o errores de consola/red. Evidencia actualizada: `artifacts/clients-public-verification.json` y capturas `artifacts/clients-public-1440.png`, `artifacts/clients-public-390.png`. Los estados pendientes descritos más abajo corresponden a revisiones anteriores.

### Publicación real en el dominio

Por instrucción expresa del usuario «quiero que se vean las empresas asociadas me entiendes», se publicaron los nombres de **21 organizaciones externas** en Supabase y se registró esa instrucción como referencia de autorización de publicación. No se otorgaron permisos adicionales de uso de logotipos: se muestran nombres tipográficos. CAUCE permanece en borrador, conservado entre los 22 registros administrativos, mientras se confirma su clasificación como unidad propia o entidad externa.

Verificación directa en `https://bko.concepcion.workers.dev/#clientes`, con Edge y la API real sin interceptación: sección visible, cuatro tarjetas al inicio, 21 en el desplegable, filtros operativos, enlaces no verificados deshabilitados y ningún error de consola o red. Anchos 1440/820/390 px sin desbordamientos. Evidencia `artifacts/clients-public-verification.json`, `artifacts/clients-public-1440.png` y `artifacts/clients-public-390.png`. La publicación fue un cambio de datos; el código compacto ya estaba desplegado en Cloudflare y no requirió otro push.

### Presentación compacta vigente

La portada muestra hasta **cuatro** destacados, tarjetas más pequeñas, un solo título y una sola bajada. El catálogo de 22 se despliega con **Ver todas las empresas**; al abrirlo se oculta la selección para evitar tarjetas repetidas. El mismo control permite cerrarlo y recuperar la vista breve. Los enlaces antiguos al directorio también cargan inicialmente la vista compacta.

Se retiró la fila de tarjetas de áreas bajo el hero porque repetía las cuatro áreas de práctica desarrolladas más abajo. Se conservaron esas áreas, sus enlaces del menú y su gestión. Se actualizaron los campos del manifiesto del editor para retirar exclusivamente los de la fila eliminada. No se modificaron datos ni permisos de Supabase.

Validación: 36 pruebas automatizadas aprobadas y QA en Edge. Cuatro tarjetas visibles inicialmente; 22 al abrir, sin duplicar la selección. Vista cerrada de 512 px de alto en escritorio y 642 px en móvil de 390 px; sin desbordamientos, imágenes rotas ni errores de consola/red. El CMS conserva altas, edición, filtros, carga, ordenación y publicación. Capturas: `artifacts/clients-compact-1440.png` y `artifacts/clients-compact-390.png`.

### Vista en localhost

Se corrigió además el desplazamiento al enlace directo `#clientes`: ahora espera a que termine la carga del catálogo. Se agregó **Empresas** al menú principal y al pie cuando la sección está visible. Comprobación real en Edge: el enlace sitúa la sección a 105 px del borde superior, con los 22 registros disponibles, sin errores de consola o red.

Se habilitó la vista previa del catálogo inicial al abrir la portada con `npm run dev`: [ver empresas](http://localhost:3000/#clientes). Muestra los 22 registros, trece logotipos y nueve nombres; el botón del directorio despliega el catálogo completo. Incluye un aviso de revisión local y no cambia permisos ni registros en Supabase. Para comprobar la vista pública real se utiliza `http://localhost:3000/?clientes=publicados#clientes`.

El servidor de desarrollo inyecta la señal de vista previa y sirve `/__local/clients` con columnas públicas del seed existente. Los archivos HTML publicados no contienen esa señal y el hosting no incluye el endpoint. Las fuentes, observaciones y referencias internas no se entregan. Las ediciones del CMS se comprueban en su vista privada o en el modo de registros publicados; la vista local muestra el catálogo inicial.

Validación posterior: 36 pruebas automatizadas aprobadas, QA del CMS aprobada y navegador Edge contra el servidor real, sin interceptación: 22 registros únicos, 13 imágenes y nueve nombres, filtros operativos, columnas 5/3/2 en 1440/820/390 px, sin imágenes rotas, desbordamientos ni errores de consola/red. La API pública conserva cero publicados. Evidencia: `artifacts/clients-live-browser-qa.json` y `artifacts/clients-local-1440.png`, `artifacts/clients-local-390.png`.

Se perfeccionó la única sección existente: nueva paleta naranjo, cuadrícula 5/3/2, ordenación del directorio, estadísticas del catálogo y distribución por sectores en el CMS, y vista previa de cambios sin guardar. Se preservan los 22 registros, trece originales, nueve nombres tipográficos y controles separados de identidad, autorización de marca y autorización de relación.

Supabase se inspeccionó con el plugin oficial: 22 slugs únicos, cero publicaciones, bucket privado sin objetos, RLS habilitado y escrituras limitadas a administradores. No se modificó producción ni el esquema. Se conserva la migración y función existentes.

Validación: 36 pruebas automatizadas aprobadas; QA real en Edge/CDP en escritorio, tablet y móvil con transporte de ensayo para el CMS; portada/API pública reales sin interceptación y sin errores de consola/red; comprobación de los veinte enlaces originales. Playwright MCP y Chrome DevTools MCP fallaron por falta del ejecutable Chrome configurado. La alternativa Edge no se presenta como ejecución exitosa de esos MCP.

Pendientes: sesión administrativa y permiso para una prueba controlada de escritura/carga real, autorizaciones de relaciones y logotipos, definición de CAUCE como unidad propia u organización externa, nueve logotipos originales y publicación del frontend. Los registros sin autorización permanecen en borrador y la sección pública se oculta cuando no hay publicaciones válidas.

Se detectaron y corrigieron el contraste insuficiente de blanco sobre el naranjo oscuro para texto pequeño y caracteres acentuados degradados durante una edición por consola. No se detectaron imágenes rotas ni desbordamientos en los anchos probados.

Detalle de archivos, pruebas, evidencias, enlaces problemáticos y limitaciones en [docs/CLIENTES.md](docs/CLIENTES.md). Las funciones y pruebas anteriores de otros módulos se conservaron.
