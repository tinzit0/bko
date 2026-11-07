# Recursos visuales

Las fotografías reales de Equipo y Oficinas, sus dimensiones, archivos originales y derivados WebP se documentan en [Equipo y oficinas](../docs/equipo-y-oficinas.md). Los retratos y las tres tarjetas de oficinas utilizan exclusivamente esos recursos proporcionados por la firma.

- `hero.webp`: composición ilustrativa original inspirada en la referencia aportada por el usuario. Puerto Varas, lago y volcán a la izquierda; minería del norte a la derecha, unidos en diagonal. No representa una fotografía documental ni una instalación de BKO.
- `santiago.webp`: ilustración del horizonte de Santiago y la cordillera; no representa una oficina de BKO.
- `favicon.svg`: monograma BKO en vector nativo.
- `social.svg`: composición tipográfica para redes; al configurar dominio, Open Graph usa la panorámica WebP por compatibilidad.

Las dos ilustraciones se generaron con la herramienta integrada de imágenes y se copiaron al proyecto. Se optimizó su codificación a WebP con el codificador del navegador, sin cambiar la composición. La panorámica se utiliza únicamente en el hero y el horizonte de Santiago solo en Inmobiliario. Cada fotografía local tiene un único uso visible. No se descargaron fotografías externas.

`editorial/acuicultura.svg` y `editorial/turismo.svg` son composiciones vectoriales originales para las áreas sin fotografía propia. `editorial/actualidad.svg`, `editorial/analisis.svg` y `editorial/publicaciones.svg` son portadas editoriales distintas para los contenidos pendientes. No representan fotografías ni instalaciones reales. La franja territorial utiliza un fondo geométrico CSS, sin reutilizar el hero.

Antes de publicar puede sustituirse cada ilustración por fotografías reales autorizadas de Chile y de las industrias. Mantener nombres de archivo o actualizar HTML/CSS; revisar textos alternativos y los créditos. La imagen de referencia original permanece en `como quiero la pagina/`.

## Instrucciones de generación utilizadas

**Panorámica:** Create a wide panoramic website background bitmap based on the supplied visual reference. Output ONLY the landscape artwork, no website UI, no text, no letters, no logos, no header, no footer. At left the lake at Puerto Varas Chile and snow covered Osorno volcano and town, at right Chilean northern copper open pit mine with big industrial mining trucks and amber sunset. Elegant diagonal seam between blue lake in left 55 percent and warm copper mine in right 45 percent. Photorealistic editorial landscape illustration. Deep blue and warm champagne sunset. Wide 3:2 or wider composition, with wide open space across center for website typography which will be added in code. Do not include any text. This is an illustrative brand artwork not a factual photo.

**Santiago:** Photorealistic editorial architectural illustration of the actual Santiago de Chile skyline in the Las Condes and Vitacura business area, Gran Torre Santiago slender glass tower with Andes mountain range behind, early morning blue and soft champagne light, elegant wide landscape composition, no text, no logos, no watermark, no invented named company offices. Intended as an illustrative city image for a Chilean legal consulting website, not claimed as documentary photo. Restrained navy, stone and warm gold palette. High resolution 3:2 landscape.
