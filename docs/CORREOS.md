# Tres correos corporativos

No se inventaron direcciones. Se reservan estos espacios en `js/config.js`:

```js
emails: {
  general: '',
  calama: '',
  santiagoPuertoVaras: '',
}
```

Cuando se completen, el sitio reemplaza automáticamente los avisos pendientes por enlaces `mailto:`. El tercer buzón se presenta en las oficinas de Santiago y Puerto Varas.

## Información que debe entregar BKO

- Dominio definitivo y acceso administrativo al DNS.
- Proveedor elegido, por ejemplo Google Workspace, Microsoft 365 o el proveedor contratado.
- Nombres exactos de las tres direcciones y usuarios responsables.
- Definición de buzón independiente, alias o grupo para cada dirección.
- Administradores autorizados y método de recuperación; no enviar contraseñas por el repositorio.

## Configuración por el administrador

1. Verificar el dominio con el TXT específico que entregue el proveedor.
2. Crear los tres buzones o los alias/grupos acordados.
3. Configurar los MX exactos del proveedor. Registrar primero los valores existentes para no interrumpir correos activos.
4. Configurar SPF con un solo registro SPF para el dominio; incorporar únicamente los emisores autorizados.
5. Publicar DKIM según el selector y la clave entregados por el proveedor.
6. Activar DMARC de forma gradual tras revisar los emisores legítimos. Los valores definitivos dependen del proveedor y la política de BKO.
7. Probar recepción y envío externo en los tres buzones, respuestas, autenticación y recuperación.
8. Completar `emails` en el sitio. El alojamiento web y Supabase no crean buzones por sí mismos.

No se proporcionan valores MX, DKIM ni direcciones de reporte ficticios. Si un servicio backend enviará avisos del formulario, autorizar también su dominio remitente sin exponer sus credenciales.

## Estado al 11-11-2026

- Buzones en **Zoho Mail**: **contacto@bko.cl** (consultas) y **administracion@bko.cl**. Ambos se muestran en Contacto y en el pie (`js/config.js` → `emails.general` y `emails.administracion`).
- El formulario guarda cada consulta en Supabase y envía un aviso a `CONTACT_NOTIFY_TO` (por defecto contacto@bko.cl) por **SMTP de Zoho** (smtp.zoho.com, puerto 465 SSL; cliente SMTP propio sin librerías, ya que la carga remota de denomailer no envió correos en Supabase), con remitente la propia cuenta y `Reply-To` de quien escribió: responder el aviso contesta directamente a la persona.
- Si el correo falla, la consulta igual queda guardada y la persona ve el mensaje de éxito.

### Activación (una sola vez)

1. En Zoho Mail (contacto@bko.cl): Mi cuenta → Seguridad → **Contraseñas específicas de aplicación** → generar una para «Sitio web BKO». Si la cuenta no tiene verificación en dos pasos, se puede usar la contraseña normal, pero se recomienda la específica.
2. Verificar que SMTP esté habilitado: Configuración → Cuentas de correo → IMAP/POP/SMTP.
3. Configurar secretos y desplegar (en la terminal del proyecto):

```
npx supabase secrets set --project-ref kxldsjodgfonrrlwjbws ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://bko.concepcion.workers.dev,https://bko.cl,https://www.bko.cl CONTACT_NOTIFY_TO=contacto@bko.cl ZOHO_SMTP_USER=contacto@bko.cl ZOHO_SMTP_PASSWORD=CONTRASEÑA_DE_APLICACION
npx supabase functions deploy contact --project-ref kxldsjodgfonrrlwjbws --use-api
```

Por defecto se usa `smtp.zoho.com` (comprobado: autenticación correcta el 11-11-2026). Si la cuenta cambia de plan o de centro de datos, definir `ZOHO_SMTP_HOST`. El plan gratuito «Forever Free» de Zoho no incluye acceso SMTP/IMAP: se requiere un plan Mail Lite o superior.
`ALLOWED_ORIGINS` debe incluir cada dominio desde el que se publica el sitio; si falta, el formulario responde 403.
