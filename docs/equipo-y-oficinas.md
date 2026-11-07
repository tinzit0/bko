# Equipo y oficinas — recursos y edición

Se actualizaron las secciones existentes `#equipo` y `#presencia` en `index.html`, en ese orden. Se conservaron las anclas de cada oficina y los enlaces del menú. No se agregaron cargos ni antecedentes curriculares.

## Inventario de originales

Todos los recursos se inspeccionaron visualmente y mediante dimensiones y hashes SHA-256. Las rutas son relativas a la raíz del proyecto.

| Archivo original | Formato | Dimensiones | Uso |
| --- | --- | --- | --- |
| `assets/personas/camila original.png` | PNG | 577 × 571 | Retrato original en color de Camila Koplin Lanata, utilizado actualmente |
| `assets/personas/camila.jpeg` | JPEG | 1280 × 1280 | Retrato anterior con tono azul, conservado sin utilizar |
| `assets/personas/roxana.png` | PNG | 367 × 537 | Retrato de Roxana Ximena Oyarzún Bustamante |
| `assets/oficinas/calama/WhatsApp Image 2026-11-05 at 22.49.38.jpeg` | JPEG | 960 × 1280 | Interior de Calama, utilizado |
| `assets/oficinas/calama/WhatsApp Image 2026-11-05 at 22.51.17.jpeg` | JPEG | 960 × 1280 | Acceso exterior, conservado sin publicar en la tarjeta |
| `assets/oficinas/santiago/WhatsApp Image 2026-11-05 at 22.48.40.jpeg` | JPEG | 1200 × 1600 | Sala de reuniones y recepción, utilizada |
| `assets/oficinas/santiago/WhatsApp Image 2026-11-05 at 22.48.40 (1).jpeg` | JPEG | 960 × 1280 | Espacio de trabajo, conservado sin publicar en la tarjeta |
| `assets/oficinas/santiago/WhatsApp Image 2026-11-05 at 22.48.40 (2).jpeg` | JPEG | 1200 × 1600 | Duplicado exacto del archivo sin sufijo; no se utiliza |
| `assets/oficinas/puerto varas/WhatsApp Image 2026-11-05 at 22.48.52.jpeg` | JPEG | 1200 × 1600 | Interior con vista al lago, utilizado |
| `assets/oficinas/puerto varas/WhatsApp Image 2026-11-05 at 22.48.53.jpeg` | JPEG | 1200 × 1600 | Terraza, conservada sin publicar en la tarjeta |

No quedaron imágenes sin identificar según sus nombres, carpetas y contenido. Se respeta la clasificación de sedes entregada por la firma.

## Versiones publicadas

Los originales no se alteraron. `scripts/optimize-firm-photos.mjs` genera derivados WebP con calidad 0,88, sin filtros ni ampliación y manteniendo la proporción de origen:

- Camila: se utiliza directamente `assets/personas/camila original.png` (577 × 571, 385 954 bytes), por solicitud de la firma. Los derivados anteriores `camila-480.webp` y `camila-960.webp` ya no se usan en la tarjeta.
- Roxana: `assets/personas/roxana-367.webp` (367 × 537, 34 506 bytes).
- Cada sede: `assets/oficinas/<carpeta original>/interior-480.webp` (480 × 640) e `interior-960.webp` (960 × 1280).
- Calama: 34 642 / 94 982 bytes; Santiago: 68 078 / 164 222 bytes; Puerto Varas: 49 556 / 119 408 bytes.

Las imágenes usan `loading="lazy"`, `decoding="async"`, dimensiones explícitas y ALT descriptivo. `srcset` permite seleccionar tamaños según la pantalla. `object-fit: cover` recorta dentro de la tarjeta sin deformar; Roxana conserva su resolución nativa.

## Edición de biografías

Editar directamente los dos párrafos `.person-bio` de `index.html`; el comentario previo identifica su carácter provisional. Para completarlos faltan antecedentes aprobados de cada integrante: cargo, título profesional e institución, áreas de práctica, trayectoria y funciones. No asumir ninguno de estos datos a partir de las fotografías.

## Ubicaciones

Las direcciones visibles corresponden a las entregadas por la firma. Los botones abren una pestaña nueva con `https://www.google.com/maps/search/?api=1&query=…`, codificando la dirección completa, incluido piso y región. La prueba del navegador compara el texto visible con la consulta del enlace. Esto verifica el destino enviado a Maps; no certifica la geocodificación o la ficha comercial que Google muestre.

## Diseño y comprobación

Se conservan colores, tipografías y lenguaje editorial. Las oficinas forman tres columnas sobre 900 px y una columna en tablet y móvil; las personas forman dos columnas sobre 600 px y una en móvil. En escritorio las oficinas tienen igual altura y botones alineados al pie. Se incorporan entradas escalonadas, acercamientos suaves, elevación y detalles dorados animados. Las interacciones respetan `prefers-reduced-motion`.

- `npm.cmd test`: nueve pruebas existentes aprobadas.
- `node --check js/app.js`: sintaxis válida.
- `node scripts/browser-qa.mjs`: 1440, 1024, 768, 390 y 320 px; imágenes cargadas, sin desbordamientos ni excepciones JavaScript; menú móvil, anclas, acordeones, formulario y movimiento reducido verificados. El envío se simula exclusivamente en QA.
- Evidencia local: `artifacts/bko-<ancho>-equipo.png`, `artifacts/bko-<ancho>-presencia.png` y `artifacts/firm-qa-results.json`.

El proyecto se actualizó localmente; no se efectuó despliegue.
