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
