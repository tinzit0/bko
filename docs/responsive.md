# Adaptación a dispositivos

La capa `css/responsive.css` se carga después de los estilos principales y de movimiento. Conserva la identidad de BKO y ajusta la composición según el espacio disponible:

- Hasta 600 px: hero en flujo normal, botones completos, sectores y formulario en una columna, equipo apilado y pie de página con navegación táctil.
- De 601 a 1200 px: menú desplegable, sectores y equipo en dos columnas, oficinas en filas de igual altura con foto y texto lado a lado, contacto de ancho completo y noticias con composición editorial.
- Desde 1201 px: navegación y composición de escritorio.
- Desde 1800 px: márgenes que limitan la extensión visual del contenido en monitores grandes.

Los campos mantienen al menos 16 px de texto en teléfono y tablet para evitar zoom de enfoque en Safari móvil. El botón del menú mide 46 px y sus enlaces al menos 48 px de altura. Se respetan áreas seguras y movimiento reducido. El botón flotante de WhatsApp se oculta mientras se edita un campo del formulario en teléfono.

`scripts/responsive-qa.mjs` usa el servidor local y Edge/Chrome con CDP en el puerto 9333, sin dependencias adicionales. Comprueba quince tamaños, de 320 × 568 a 2560 × 1440, incluidas orientaciones horizontales. Verifica desbordamientos, imágenes, contenido dentro de tarjetas, hero sin superposiciones, campos legibles, menú táctil y cambio a escritorio con desbloqueo del scroll.

La revisión se realizó con emulación de viewport y entrada táctil en Edge. Capturas y resultados: `artifacts/responsive-<ancho>-<sección>.png` y `artifacts/responsive-qa-results.json`. `scripts/browser-qa.mjs` verifica adicionalmente el modo animado y las interacciones existentes.
