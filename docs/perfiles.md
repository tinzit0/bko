# Perfiles individuales

Las cuatro páginas estáticas de `equipo/` tienen título, metadescripción, datos estructurados Person, fotografía y navegación propia. La página principal enlaza cada perfil desde su tarjeta, Personas y Derecho Laboral.

La información suministrada de Camila Alejandra Kopplin Lanata se conserva completa en `scripts/build-profiles.mjs`: presentación, cinco apartados, línea de tiempo, publicación y destacado profesional. Para actualizar currículos, editar los datos de ese archivo y ejecutar `node scripts/build-profiles.mjs`. El generador conserva el resto de la página principal.

Roxana conserva su presentación institucional, Estefanía su cargo de asistente contable y Fenella su especialidad de psiquiatría infantojuvenil en el área de familia. Los antecedentes adicionales de trayectoria, formación y experiencia quedan indicados como pendientes. Fenella no se presenta como responsable de la asesoría jurídica de Familia.

El espacio de Seguros queda preparado para incorporar fotografía, nombre, cargo, presentación, experiencia y especialidades con información aprobada. No se atribuye a ninguna integrante.

Estilos: `css/profiles.css`. Comportamiento de navegación de páginas internas: `js/profiles.js`. El servidor local y el flujo de GitHub Pages incluyen la carpeta `equipo/`.

Validación: diez pruebas del proyecto aprobadas; página principal y cuatro perfiles revisados en Edge a 390, 820 y 1280 px, con imágenes decodificadas, enlaces locales accesibles, un H1 por página y sin desbordamientos ni excepciones JavaScript. No se realizó despliegue.
