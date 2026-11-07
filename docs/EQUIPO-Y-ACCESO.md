# Equipo y acceso administrativo

Se mantiene un bloque individual por integrante y sus enlaces a los perfiles. La sección usa tarjetas más compactas, retratos enmarcados, numeración decorativa, tipografía proporcionada y etiquetas de especialidad. Todas las tarjetas tienen fondo marfil, texto azul marino, los mismos marcos claros y detalles dorados. En teléfono la fotografía ocupa una proporción 6:5 y el contenido queda debajo; en tablet y escritorio se combinan las columnas de imagen y texto.

El acceso a Gestión aparece en la cabecera de todas las páginas públicas. En teléfono se presenta con un candado, etiqueta accesible y área táctil de 44 × 44 px. En pantallas mayores incluye el texto Gestión. Se conserva el acceso completo del pie de página y la barra privada del editor al iniciar sesión.

Cambios visuales: `css/team-access.css`. Integración e idempotencia: `scripts/install-team-access.mjs`, invocado al instalar el editor visual y regenerar perfiles. Se preservan las rutas del panel desde las páginas internas. Se regeneró `js/website-manifest.json` para mantener la edición desde el CMS.

Verificación en navegador: dieciocho combinaciones de página y viewport, desde 320 hasta 1920 px; cabecera visible, control de acceso de al menos 44 px y sin desbordamientos. Se comprobó la presencia del acceso en todas las páginas públicas. Evidencia local en `artifacts/team-access-qa.json` y `artifacts/team-premium-390.png` / `team-premium-1440.png`. Dieciocho pruebas del proyecto aprobadas.

Los cambios del frontend se implementaron localmente; no se hizo publicación en este paso.
