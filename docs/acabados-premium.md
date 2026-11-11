# Acabados y movimiento

`css/luxury.css` se carga después de la capa responsive y de los perfiles, tanto en el inicio como en las páginas individuales. Añade profundidad en fondos, líneas doradas, jerarquía editorial, contraste en Personas, marcos fotográficos y acabados de tarjetas y publicaciones.

`js/luxury.js` se inicializa desde `js/app.js` y `js/profiles.js`. Usa IntersectionObserver y Web Animations para entradas escalonadas de presentaciones, trayectoria y bloques editoriales. Los botones reaccionan al cursor mediante requestAnimationFrame únicamente mientras hay interacción. Las animaciones activas se cancelan al ocultar la pestaña o cambiar las preferencias; el movimiento reducido conserva todo el contenido visible. Los efectos que dependen del cursor se limitan a dispositivos con puntero preciso y los bucles decorativos se desactivan en pantallas táctiles.

Se mantienen los apartados individuales de las cuatro integrantes, los textos curriculares y los archivos fotográficos originales. Las páginas internas se actualizan con `node scripts/build-profiles.mjs`.

Validación: diez pruebas del proyecto, revisión responsive a quince tamaños y revisión de inicio y cuatro perfiles a 390, 820 y 1280 px. La comprobación del modo animado se ejecuta con `scripts/browser-qa.mjs`. Las capturas y reportes locales se guardan en `artifacts/`.

## Capa cinematográfica (11-11-2026)

`js/cinema.js` (importado por `js/app.js` y `js/profiles.js`) y la sección final de `css/firm.css`:

- **Telón de entrada**: monograma BKO sobre azul, una vez por sesión. Lo activa el script en línea del `<head>` de `index.html` (clase `bko-intro`, `sessionStorage`).
- **Hero**: titular revelado por máscara, «estamos presentes.» de desenfocado a nítido, resto en cascada.
- **Cifras**: contador animado; al terminar se restaura el texto original exacto (editable desde el CMS).
- **Brillo dorado** en las cursivas de los títulos al entrar en pantalla.
- **Frase de Personas** que se entinta con el scroll (`animation-timeline: view()`; sin soporte queda estática).
- **Foco de luz** que sigue al cursor en secciones oscuras (solo puntero fino).
- **Cortina** en las fotos de Roxana.

Todo se desactiva con «reducir movimiento». Tras `bko:firm-loaded` / `bko:content-updated` se reenganchan los nodos que redibuja el CMS.
