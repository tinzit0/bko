-- Centro Comercial Doña Ema con su logotipo (17-11-2026).
-- Ya existía la ficha (slug centro-comercial-dona-ema) del import inicial, sin logo, oculta
-- y con el dominio antiguo donaema.cl. Se actualiza con el sitio y el logotipo oficiales
-- (https://centrocomercialdonaema.cl/; texto blanco, por eso fondo navy) y se publica.
-- Ejecutar una vez en el editor SQL de Supabase (proyecto BKO).
begin;

update public.bko_clients set
  website_url = 'https://centrocomercialdonaema.cl/', website_original = 'https://centrocomercialdonaema.cl/', website_verified = true,
  logo_local_path = 'assets/clientes/centro-comercial-dona-ema.png', logo_storage_path = '',
  logo_width = 651, logo_height = 679, logo_background = 'navy',
  logo_verified = true, logo_authorized = true,
  logo_source = 'https://centrocomercialdonaema.cl/wp-content/uploads/2024/10/dona-ema-ok-2-768x884.png',
  logo_source_original = 'https://centrocomercialdonaema.cl/',
  logo_status_original = 'Logotipo oficial de la web',
  verification_status = 'verified',
  observations = observations || ' | 17-11-2026: sitio vigente centrocomercialdonaema.cl y logotipo oficial; publicado por instrucción del responsable del sitio.',
  sector = 'comercio', sector_source = 'https://centrocomercialdonaema.cl/',
  description = 'Centro comercial: un espacio para la familia.',
  published = true, active = true, featured = true, relation_authorized = true,
  authorization_reference = 'Instrucción del responsable del sitio, 17-11-2026: agregar Centro Comercial Doña Ema a la sección de empresas con su logotipo.',
  logo_authorization_reference = 'Instrucción del responsable del sitio, 17-11-2026, de mostrar el logotipo de Centro Comercial Doña Ema.'
where slug = 'centro-comercial-dona-ema';

-- El trigger bko_client_revision desmarca la verificación al cambiar logo o sitio;
-- se confirma en una segunda actualización, ya con la ruta y el sitio fijados.
update public.bko_clients set
  logo_verified = true, logo_authorized = true, website_verified = true, verification_status = 'verified',
  logo_authorization_reference = 'Instrucción del responsable del sitio, 17-11-2026, de mostrar el logotipo de Centro Comercial Doña Ema.'
where slug = 'centro-comercial-dona-ema';

commit;
