# Acabados y movimiento

`css/luxury.css` se carga después de la capa responsive y de los perfiles, tanto en el inicio como en las páginas individuales. Añade profundidad en fondos, líneas doradas, jerarquía editorial, contraste en Personas, marcos fotográficos y acabados de tarjetas y publicaciones.

`js/luxury.js` se inicializa desde `js/app.js` y `js/profiles.js`. Usa IntersectionObserver y Web Animations para entradas escalonadas de presentaciones, trayectoria y bloques editoriales. Los botones reaccionan al cursor mediante requestAnimationFrame únicamente mientras hay interacción. Las animaciones activas se cancelan al ocultar la pestaña o cambiar las preferencias; el movimiento reducido conserva todo el contenido visible. Los efectos que dependen del cursor se limitan a dispositivos con puntero preciso y los bucles decorativos se desactivan en pantallas táctiles.

Se mantienen los apartados individuales de las cuatro integrantes, los textos curriculares y los archivos fotográficos originales. Las páginas internas se actualizan con `node scripts/build-profiles.mjs`.

Validación: diez pruebas del proyecto, revisión responsive a quince tamaños y revisión de inicio y cuatro perfiles a 390, 820 y 1280 px. La comprobación del modo animado se ejecuta con `scripts/browser-qa.mjs`. Las capturas y reportes locales se guardan en `artifacts/`.
