-- Autovaras Motors: deja una sola ficha (13-11-2026).
-- Ya existía la ficha «AutoVaras» (slug autovaras) sin logotipo y con un sitio suspendido.
-- Se le asigna el logotipo entregado y se elimina la ficha duplicada autovaras-motors.
begin;

update public.bko_clients set
  name = 'Autovaras Motors',
  website_url = '', website_verified = false,
  logo_local_path = 'assets/clientes/autovaras-motors.jpg', logo_storage_path = '',
  logo_width = 1280, logo_height = 408, logo_background = 'white',
  logo_verified = true, logo_authorized = true,
  logo_source = 'Entregado por el responsable del sitio (clientes/autovarasmotors.jpeg)',
  logo_status_original = 'Logotipo entregado por el responsable del sitio',
  verification_status = 'verified',
  observations = observations || ' | 13-11-2026: logotipo entregado por el responsable del sitio; sin sitio web vigente.',
  sector = 'comercio', sector_source = 'Logotipo entregado por el responsable del sitio',
  published = true, active = true, relation_authorized = true,
  authorization_reference = 'Instrucción del responsable del sitio, 13-11-2026: agregar Autovaras Motors a la sección de empresas con su logotipo.',
  logo_authorization_reference = 'Instrucción del responsable del sitio, 13-11-2026, de mostrar el logotipo de Autovaras Motors.'
where slug = 'autovaras';

delete from public.bko_clients where slug = 'autovaras-motors' and exists (select 1 from public.bko_clients where slug = 'autovaras' and published);

commit;
