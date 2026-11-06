# Verificación del sitio

Realizada localmente el 5 de noviembre de 2026 con Node.js 26 y Microsoft Edge 156 en Windows. El servidor HTTP sirve solo los archivos públicos.

## Pruebas automatizadas

`npm test`: 9 pruebas aprobadas.

- Validación de campos, correo, teléfono, longitudes y consentimiento.
- Rechazo de orígenes ajenos, métodos incorrectos, datos alterados, honeypot y cuerpos grandes.
- Confirmación del backend solo después de un UUID del almacenamiento; errores de servicio y límite de frecuencia.
- IDs únicos, anclas existentes, recursos locales disponibles, un H1 y Schema con el teléfono proporcionado.
- Comprobación de RLS y de revocación de acceso público en la migración.

Las pruebas del manejador usan transporte controlado y no acceden a una base de datos real. La migración está revisada como código; no se ha aplicado ni probado contra PostgreSQL en el proyecto remoto.

## Navegador

`scripts/browser-qa.mjs` usa el protocolo DevTools de un navegador local en el puerto 9333. Se revisaron anchos de **1440, 1024, 768, 390 y 320 px**:

- Sin desbordamiento horizontal.
- Ocho secciones principales y 33 elementos de entrada visibles tras recorrer la página.
- Menú móvil abre y cierra al seleccionar sección.
- Los enlaces de áreas destacadas abren el acordeón correspondiente.
- Diálogo de privacidad abre y cierra.
- El formulario indica errores al enviar campos vacíos.
- Ante respuesta fallida no confirma envío; solo muestra éxito ante respuesta confirmada con ID. El transporte se reemplaza exclusivamente dentro de la prueba de navegador, sin modificar el código de producción.
- Movimiento reducido respetado.
- Ninguna excepción JavaScript detectada durante el recorrido.
- Imágenes WebP locales, con carga diferida fuera del hero y textos alternativos.

Capturas locales no versionadas en `artifacts/bko-1440.png` y `artifacts/bko-390.png`; versiones de portada en `artifacts/bko-1440-inicio.png` y `artifacts/bko-390-inicio.png`.

## Repetir QA visual

1. Iniciar el servidor con `npm run dev`.
2. Abrir un Edge/Chrome dedicado en modo headless con puerto DevTools 9333 y un perfil de pruebas separado. Nunca usar el perfil personal.
3. Ejecutar `node scripts/browser-qa.mjs`.
4. Cerrar el navegador de pruebas al terminar.

En esta máquina se usó el ejecutable `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`. La configuración del navegador y del aislamiento puede variar; el script no instala navegadores ni dependencias.

## Pendiente antes de producción

- Escritura de aceptación y verificación de permisos en el Supabase real, tras desplegar la migración y función.
- GitHub remoto, push y despliegue desde el usuario propietario.
- Verificación de enlaces externos y de los puntos exactos en Maps: se usan búsquedas de las direcciones entregadas, no pines inventados.
- Revisión en dispositivos físicos Android/iOS, Safari y lectores de pantalla. La emulación responsive no sustituye estas pruebas.
- Medición Lighthouse/Core Web Vitals desde el alojamiento definitivo; no se declara una puntuación no medida.
- Aprobación de política de privacidad, recursos visuales, perfiles, artículos y dominio antes de indexar.
