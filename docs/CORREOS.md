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

## Aviso por WhatsApp

**Botón en el formulario (activo, gratis).** Después de enviar cualquier formulario (contacto, seguros, CAUCE) aparece el botón verde **Enviar también por WhatsApp**. Abre WhatsApp en el teléfono del visitante con la consulta completa ya escrita para el número `formWhatsAppNumber` de `js/config.js` (en pruebas: +56 9 4598 1933; en producción debe ser +56 9 7482 6025), y el visitante solo toca Enviar. Si el formulario falla, el botón queda disponible como respaldo. Código: `js/whatsapp-handoff.js`.

**Aviso automático por CallMeBot (opcional).** CallMeBot no acepta usuarios nuevos cuando está lleno (noviembre 2026). Cuando vuelva a mostrar su número, se activa con los pasos siguientes.

Cada consulta del sitio (portada, Negocios y Seguros y CAUCE) llega también por WhatsApp al +56 9 7482 6025, con los mismos datos del correo y el mensaje completo tal como lo escribió la persona. Los mensajes de más de 1.400 caracteres se dividen en partes numeradas: (1/2), (2/2). El envío usa **CallMeBot**, que es gratuito, y se hace en paralelo con el correo: si uno falla, el otro llega igual y la consulta siempre queda guardada en el panel.

### Activación (una sola vez)

1. Desde el WhatsApp del **+56 9 7482 6025**, agregar el contacto **+34 644 66 32 62** (verificar el número vigente en https://www.callmebot.com/blog/free-api-whatsapp-messages/).
2. Enviarle el mensaje: `I allow callmebot to send me messages`
3. El bot responde con una **apikey**. Configurarla y desplegar la función:

```powershell
npx supabase secrets set --project-ref kxldsjodgfonrrlwjbws CALLMEBOT_APIKEY=LA_CLAVE_RECIBIDA
npx supabase functions deploy contact --project-ref kxldsjodgfonrrlwjbws --use-api
```

`WHATSAPP_NOTIFY_PHONE` permite cambiar el número de destino. La apikey de CallMeBot solo sirve para el número que la solicitó, así que al cambiar de número hay que repetir el paso 2 desde el nuevo número. Si los avisos no llegan, revisar los logs de la función: `contact_whatsapp_failed` indica que CallMeBot no respondió y `contact_whatsapp_unconfirmed` que la clave no fue aceptada.
