# Negocios y Seguros Corporativos BKO

## Implementación

- `seguros/index.html`: página interna con la identidad existente, catálogo de 25 servicios en seis grupos, protagonismo de construcción y garantías, perfil enlazado de Roxana y formulario especializado.
- `index.html`: sustituye el antiguo espacio pendiente de Seguros, actualiza Roxana y conserva las secciones y anclas existentes. El menú mantiene `#seguros` bajo «Negocios y seguros».
- `equipo/roxana-ximena-oyarzun-bustamante.html`: descripción institucional completa, cargo, ocho especialidades, servicios y contacto orientado al formulario de seguros.
- `admin/index.html`, `js/admin.js`, `css/admin.css`: panel autenticado con CMS, CRM, indicadores y responsables.
- `js/insurance-content.js`: contenido inicial y validación de su estructura. `js/insurance-render.js`: render seguro compartido entre generación estática y CMS.
- `js/cms-public.js`: carga el contenido publicado de Supabase y actualiza portada, perfil y catálogo. Si el servicio no está disponible, conserva el contenido estático; no inventa disponibilidad del CRM.
- `js/insurance.js`, `js/insurance-validation.js`: formulario, validación compartida con backend, RUT opcional, consentimientos y selección de categorías.
- `supabase/functions/contact/index.ts`: conserva la recepción jurídica existente y admite el payload especializado de seguros. La confirmación requiere un UUID devuelto por PostgreSQL.
- Dos migraciones nuevas: tablas administrativas y políticas de acceso, ampliación de `consultations`, asignación automática, métricas, imágenes y contenido inicial. No se insertan leads ni cotizaciones de demostración.
- `scripts/build-insurance.mjs`: genera HTML y semilla inicial de contenido. `scripts/build-profiles.mjs` vuelve a aplicar la integración de seguros al regenerar perfiles.
- `scripts/configure-domain.mjs`: prepara canonical, Open Graph y sitemap para las páginas públicas, incluyendo Seguros; excluye administración de robots. El dominio real sigue pendiente de configuración.

## Estado remoto verificado

El 7 de noviembre de 2026, las comprobaciones públicas al proyecto configurado devolvieron **404** para `/rest/v1/site_content?key=eq.insurance&select=key` y `/functions/v1/contact`. No se dispone en esta sesión de una CLI autenticada, credenciales administrativas ni cuenta autorizada para aplicar las migraciones o desplegar la función. Por tanto, la integración está implementada y comprobada con transporte de prueba local, **pero no activada ni verificada contra almacenamiento de producción**.

No se inventaron credenciales ni se incorporó una clave service_role al navegador. Las solicitudes reales fallan de forma explícita mientras no esté activo el backend; el panel tampoco muestra estadísticas de ejemplo.

## Activación en el proyecto existente

Ejecutar con una sesión de Supabase autorizada para `kxldsjodgfonrrlwjbws`, revisando previamente las migraciones remotas:

```powershell
npx supabase login
npx supabase link --project-ref kxldsjodgfonrrlwjbws
npx supabase db push
npx supabase functions deploy contact
```

Completar los secretos documentados en `docs/SUPABASE.md`: `ALLOWED_ORIGINS`, `BKO_PUBLISHABLE_KEY`, `CONTACT_FINGERPRINT_SECRET` y, si se activa, `TURNSTILE_SECRET_KEY`. `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los proporciona Supabase al backend. Los orígenes deben incluir el dominio real del sitio.

Crear o invitar a las cuentas reales desde Supabase Authentication. Asignar el primer administrador con SQL ejecutado por el propietario, reemplazando el marcador por su correo real:

```sql
insert into public.bko_admin_members(user_id,role)
select id,'admin' from auth.users where email = '<correo real del administrador>'
on conflict(user_id) do update set role=excluded.role;
```

Para la cuenta real de Roxana, repetir con su correo confirmado y rol `insurance`. No se ha supuesto un correo para ella. El identificador de responsable `roxana` ya queda creado en el catálogo de responsables; las solicitudes nuevas se asignan en el servidor a ese identificador por defecto. La cuenta de acceso y el responsable comercial son conceptos separados.

Roles:

| Rol | Acceso |
| --- | --- |
| `admin` | Todas las consultas, contenidos, responsables y estadísticas |
| `editor` | CMS e imágenes; sin acceso a datos de consultas |
| `insurance` | Consultas y métricas del área de seguros; no edita contenido ni otras áreas |
| Sin rol / visitante | Contenidos públicos; sin lectura ni modificación de consultas |

Las restricciones se aplican mediante RLS y privilegios de PostgreSQL, además de la interfaz. Los usuarios no pueden asignarse roles. Los visitantes no deciden el estado ni el responsable de su solicitud. La asignación automática toma el responsable activo configurado en el CMS.

## Operación del panel

Abrir `/admin/index.html` e ingresar con la cuenta autorizada. No hay registro público de administradores.

En Contenidos se pueden editar título, textos, condiciones, destacados, CTA, grupos, fotografía y presentación de Roxana, especialidades, servicios y orden. Se pueden agregar, eliminar y desactivar servicios. Las fotografías se cargan en Supabase Storage (JPEG, PNG o WebP, máximo 8 MB) o se seleccionan mediante ruta `assets/` o URL HTTPS. El original no se modifica. Se debe guardar para publicar. El control de revisión rechaza sobrescrituras concurrentes sin confirmación; las ediciones no se aplican solo en localStorage.

En CRM se puede filtrar por área, tipo de seguro, estado y responsable, y recorrer los resultados paginados. Cada registro conserva nombre, empresa, RUT opcional, correo, teléfono, ciudad, actividad económica, tipo de seguro, necesidad, fecha estimada opcional, fecha de recepción del servidor, consentimientos, estado, responsable, notas y referencia de cotización externa cuando exista.

Los indicadores se calculan en PostgreSQL a partir de las consultas visibles para la cuenta: total de seguros, pendientes, construcción, garantías, RC y cotizaciones en seguimiento. El último indicador requiere tanto marca de seguimiento como referencia no vacía de una cotización real. No significa que BKO o una compañía hayan emitido o aprobado una cotización. No hay integración de emisión con una aseguradora.

## Precisión comercial y recursos

El contenido se presenta como orientación y recepción de solicitudes. La habilitación para intermediar o contratar no fue proporcionada ni verificada. No se afirma que Roxana tenga títulos, licencias, certificaciones o antigüedad adicional.

Se conserva la distinción entre seguro de garantía y boleta bancaria, y la aceptación de garantías se supedita a bases, contrato y beneficiario. Las coberturas no se garantizan: dependen de pólizas, exclusiones, deducibles, límites, evaluación y aceptación.

El APV incluye la dependencia del régimen y normativa, sin porcentajes ni rendimientos prometidos. AFC se presenta como sistema legal informativo, separado de seguros comerciales; su tarjeta enlaza a AFC en lugar de ofrecer una contratación.

Fuentes oficiales consultadas:

- [AFC: Seguro de Cesantía](https://www.afc.cl/que-es-el-seguro-de-cesantia/preguntas-frecuentes/seguro-de-cesantia/).
- [Superintendencia de Pensiones: beneficios tributarios del APV y APVC](https://www.spensiones.cl/portal/institucional/594/w3-article-5795.html).
- [CMF: corredores de seguros](https://www.cmfchile.cl/educa/621/w3-propertyvalue-530.html).

Se usan tres fotografías reales existentes, una vez cada una dentro de la página especializada: sala de reuniones de Santiago, acceso de Calama con vehículo industrial y vista lacustre desde Puerto Varas. No se presentan como fotografías de compañías aseguradoras, obras aseguradas o barcos específicos. El CMS permite incorporar material autorizado adicional.

## Validación y aceptación pendiente

- `npm.cmd test`: 15 pruebas de regresión y seguros.
- `node scripts/insurance-qa.mjs`: revisión del área, Roxana y administración en 320, 390, 650, 820, 1024 y 1440 px; fotografías, selección de categoría, validación, errores de almacenamiento, confirmación por UUID, seguimiento, edición CMS y lectura pública.
- Las pruebas de interfaz interceptan el transporte exclusivamente en el harness de QA. No sustituyen la verificación de RLS y persistencia contra una base desplegada.
- Tras activar Supabase: comprobar acceso de cada rol; que visitantes no lean consultas; envío desde el dominio real y UUID presente en `consultations`; asignación a Roxana; filtros y métricas; actualización CMS visible en otra sesión; almacenamiento de imágenes; persistencia después de recargar y rechazo de usuarios sin rol.
- Revisar el borrador de privacidad, identidad responsable, retención y canal de ejercicio de derechos antes de publicar. Los consentimientos de datos y contacto comercial se registran por separado.

No se realizó publicación ni envío de datos personales reales.
