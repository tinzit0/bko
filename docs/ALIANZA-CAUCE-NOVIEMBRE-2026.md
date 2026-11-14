# Alianza BKO + CAUCE y nuevos clientes — 13 de noviembre de 2026

Cambios pedidos en la carta de CAUCE «Sitio bko.cl: cómo presentar la alianza BKO + CAUCE» (12-11-2026) y altas de clientes. Todo está publicado y verificado en https://bko.concepcion.workers.dev.

## Alianza BKO + CAUCE

- **Portada:** bloque «Alianza estratégica · Cobranza empresarial / BKO + CAUCE Gestión Integral», botón «Conocer la alianza».
- **Menú:** «Cobranza BKO + CAUCE».
- **Página CAUCE:** encabezado «BKO + CAUCE / Alianza en cobranza empresarial» con los logotipos de BKO y CAUCE (`assets/cauce/cauce-logo.png`, extraído del PDF oficial), párrafo inicial nuevo, recuadro «Fundador de CAUCE · Aliado de BKO en cobranza empresarial», etapas «Cómo trabajamos juntos» (Levantamiento, Cuantificación y Traspaso a cargo de CAUCE; Acción legal a cargo de BKO) y bloque «Qué recibe la empresa y qué recibe el abogado». El recuadro «Colaboración con el área jurídica» se mantiene sin cambios.
- **Etapas 04 y 07 y ficha de Luis:** redacción general, sin aludir a un expediente concreto. Luis figura como «Fundador».
- **Estefanía:** «asistente contable de BKO; apoya la coordinación de los casos de cobranza que prepara CAUCE» (propuesta de la carta, pendiente de confirmación entre Jorge y Luis).
- **Formulario CAUCE:** campo opcional «Cantidad aproximada de facturas impagas» (viaja dentro del mensaje). Cada solicitud CAUCE llega también a `luis.miranda@caucegestion.cl` (variable opcional `CAUCE_NOTIFY_TO` en la función `contact`).

Los textos nuevos viven en `js/cauce-alliance.js`. Se aplican también al contenido que llega del CMS, de modo que una versión antigua guardada no vuelve a aparecer. La base de datos se actualizó con `supabase/updates/20261113_alianza_bko_cauce.sql`.

## Ajustes generales

- Nombre de la firma con tilde: **Bentjerodt Koplin y Oyarzún** (cabecera, pie, textos y datos estructurados). Las URL de los perfiles no cambian.
- Política de privacidad: «nuestro proveedor de almacenamiento de datos» en lugar de mencionar Supabase.
- Música ambiental: ya no suena al entrar; solo si el visitante la activa con el botón.
- Actualidad: oculta mientras no haya artículos publicados (ya existía).
- El acceso «Administración» se mantiene en el pie de todas las páginas, por decisión del responsable del sitio.

## Nuevos clientes (publicados con logotipo)

| Cliente | Logotipo | Enlace |
|---|---|---|
| Ibanez Soluciones | `assets/clientes/ibanez-soluciones.jpg` (logo oficial de ibanezsoluciones.cl) | https://www.ibanezsoluciones.cl/ |
| SISA Ingeniería, Arriendos y Obras Civiles | `assets/clientes/sisa.png` (desde `clientes/Logo SisA.png`, reducido a 540 px) | sin sitio web (se reutilizó la ficha existente «AutoVaras», que no tenía logo) |
| Capitalfin | `assets/clientes/capitalfin.png` (logo oficial de capitalfin.cl) | https://capitalfin.cl/ |
| Almasur Inmobiliaria | `assets/clientes/almasur-inmobiliaria.jpg` (desde `clientes/alamasur inmobiliaria.jpeg`) | https://almasurinmobiliaria.cl/ |
| Autovaras Motors | `assets/clientes/autovaras-motors.jpg` (desde `clientes/autovarasmotors.jpeg`) | sin sitio web |

## Verificación

- `npm test`: 48 pruebas aprobadas.
- Sitio publicado: menú, portada, página CAUCE, formulario y pie comprobados; 27 empresas visibles y los tres logotipos nuevos cargan correctamente. Almasur y Autovaras se agregan con `supabase/updates/20261113_clientes_almasur_autovaras.sql` y `supabase/updates/20261113_autovaras_unificar.sql` (28 empresas).
- Función `contact` desplegada y SQL ejecutado en Supabase; textos y clientes comprobados con la API pública.

## Pendiente

- Confirmar el texto de Estefanía entre BKO y CAUCE.
- Definir quién responde primero las consultas de CAUCE y cómo se derivan (punto 6 de la carta).
