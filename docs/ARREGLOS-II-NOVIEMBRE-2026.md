# Arreglos a la página II — 11-11-2026

Fuente: `Arreglos a la página II.docx`, carpetas `seguro maritimo/` y `clientes/`.

## Aplicado

- **Negocios y Seguros**: menú y página ordenados como Seguros para la minería, Seguros marítimos, Garantías y Licitaciones, Empresas Constructoras, Responsabilidad Civil y Seguros generales. Minería es un grupo nuevo con cinco servicios. Seguros generales reúne vida, APV, cesantía y protección de pagos. Los cambios están en `js/site-updates.js`.
- **Presencia y Contacto**: los enlaces llevaban al lugar equivocado porque la página se recargaba y saltaba antes de que el CMS dibujara Equipo y Empresas. `js/anchor-scroll.js` desplaza sin recargar y vuelve a alinear la sección tras la carga.
- **Equipo**: orden Jorge, Camila, Roxana, Luis, Fenella, Makarena y Estefanía.
- **Textos**: presentación de Roxana, presentación de la Dra. Fenella Reyes («Experiencia y compromiso»), cargo y texto de Estefanía (Asistente contable | Gestión de CAUCE).
- **Política de Privacidad y deber de confidencialidad**: reemplazada en todas las páginas. La página de seguros conserva el párrafo propio de su formulario.
- **Seguro marítimo**: las cinco fotos están en `assets/seguros/maritimo/`. Hay una galería en movimiento y fotos en las tarjetas.
- **Clientes**: nuevos logotipos de Constructora Werner, Machinery Chile, IPSANORT y UP Social Club. Nuevo cliente Llanada Grande Lodge, con el logotipo oficial de su sitio.
- **Fotos en movimiento**: los logos de clientes pasan en dos filas continuas. Las fotografías de sectores, oficinas y seguros tienen un acercamiento lento. Todo se detiene al pasar el cursor y se desactiva con «reducir movimiento».

## Pendiente para publicar

1. Hecho (11-11-2026): `supabase/updates/20261111_arreglos_ii.sql` ejecutado en producción con la CLI (`supabase db query --remote`). Se corrigió el script para completar `logo_source` antes de verificar logotipos (restricción `client_logo_verified`).
2. Publicar los archivos: assets, CSS, JS y HTML.
3. Hecho: punto separador dorado entre CAUCE y Equipo en el menú de escritorio (`css/firm.css`).
4. Hecho: foto de Roxana en el muelle (`assets/personas/en seguros.jpeg`, recortada a `assets/seguros/roxana-muelle-480|720.webp`) en el recuadro de la encargada de Negocios y Seguros (`js/insurance-render.js`, `seguros/index.html`, `css/insurance.css`).

Pruebas: 37 de 37 aprobadas (`npm test`).
