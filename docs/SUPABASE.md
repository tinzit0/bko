# Activar el formulario en Supabase

Proyecto indicado: `kxldsjodgfonrrlwjbws`. La configuración del navegador está en `js/config.js` y usa exclusivamente la clave pública publishable. **Nunca incorporar service_role ni secretos al frontend ni al repositorio.**

La integración está implementada, pero su despliegue y una escritura real de aceptación están pendientes. El servidor confirma `{ok:true,id}` únicamente cuando PostgreSQL devuelve el UUID de la consulta guardada. La consulta se almacena; no se envía un correo de aviso automáticamente.

## Despliegue mediante CLI oficial

Desde una terminal de tu usuario con acceso a Internet y Node/npm disponibles:

```powershell
npx supabase login
npx supabase link --project-ref kxldsjodgfonrrlwjbws
npx supabase db push
npx supabase functions deploy contact
```

Revisar las migraciones remotas antes de `db push` si el proyecto ya contiene otras tablas/migraciones. La migración crea solo `consultations`, `contact_rate_limits` y `submit_consultation`; no elimina tablas de aplicación.

Configurar en Dashboard → Edge Functions → Secrets:

| Variable | Valor |
| --- | --- |
| `ALLOWED_ORIGINS` | Orígenes exactos separados por comas, sin barra final; incluir localhost durante pruebas y el dominio definitivo. |
| `BKO_PUBLISHABLE_KEY` | La misma clave publishable configurada en `js/config.js`. |
| `CONTACT_FINGERPRINT_SECRET` | Secreto aleatorio de al menos 32 bytes generado por el administrador. |
| `TURNSTILE_SECRET_KEY` | Opcional, clave secreta de Cloudflare Turnstile. |

Supabase suministra `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` al entorno de la Edge Function. No copiarlos a los archivos públicos. El `verify_jwt = false` de `supabase/config.toml` es intencional: las claves publishable no son JWT. Se comprueba `apikey` en el manejador, sin tratar una clave pública como secreto.

La función importa `js/validation.js` del repositorio; desplegar mediante CLI desde la raíz para que el empaquetador incluya el módulo compartido.

## Controles incluidos

- Validación del lado cliente y del servidor; campos permitidos y límites de longitud.
- Honeypot y espera mínima de 3 segundos; no constituyen protección suficiente por sí solos.
- Cuerpo limitado a 24 KB, métodos restringidos y lista de orígenes exactos.
- Límite transaccional de 5 consultas por hora por huella HMAC de IP. No se persiste IP en texto claro; los registros de control se depuran con nuevas consultas.
- RLS activado y permisos revocados a `anon` y `authenticated`; solo el backend puede insertar. Las consultas no se exponen mediante SELECT público.
- Logs sin el contenido de las consultas. Manejo de errores sin falsas confirmaciones.
- Turnstile opcional validado en servidor. **Activarlo antes de campañas públicas**: crear widget, autorizar dominios y completar `turnstileSiteKey` en `js/config.js` junto con el secreto en Supabase.

CORS y la clave pública no autentican a visitantes ni detienen bots que usan un cliente propio. El límite depende de la cabecera de IP que entrega el proxy de Supabase; verificar ese comportamiento al desplegar. Considerar límites de infraestructura si se prevé tráfico elevado.

## Prueba de aceptación con almacenamiento real

1. Abrir el sitio desde un origen autorizado y completar datos propios de prueba.
2. Enviar. Revisar en la pestaña Network que `/functions/v1/contact` devuelve 201 con `ok:true` y un UUID.
3. En Supabase Table Editor, comprobar ese UUID en `consultations` y eliminar el registro de prueba tras verificarlo.
4. Confirmar que un cliente público no puede leer `consultations` ni invocar `submit_consultation` directamente.
5. Comprobar error si el backend no responde; nunca debe aparecer éxito sin UUID.
6. Revisar retención, gestión de solicitudes de privacidad y acceso de administradores antes de producción.

Para notificaciones, añadir un proveedor de correo en el backend y sus credenciales como secretos. El éxito del formulario significa **consulta almacenada**, no correo entregado. Evitar que un fallo de notificación provoque una segunda inserción.

Referencias oficiales: [despliegue de funciones](https://supabase.com/docs/guides/functions/deploy), [claves API](https://supabase.com/docs/guides/getting-started/api-keys), [seguridad de funciones](https://supabase.com/docs/guides/functions/auth).
