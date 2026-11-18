-- Nueva foto de Jorge y dos clientes nuevos con su logotipo (18-11-2026).
-- Ejecutar una vez en el editor SQL de Supabase (proyecto BKO).
begin;

-- Equipo: la nueva fotografía reemplaza el mismo archivo (assets/personas/jorge.jpeg); se actualiza el texto alternativo.
update public.bko_content set data = data || '{"image":"assets/personas/jorge.jpeg","imageAlt":"Jorge Iván Saavedra Bentjerodt en su oficina"}'::jsonb where id='jorge-ivan-saavedra-bentjerodt';

-- Nuevo cliente: Tierra del Fuego Fly Fishing (logotipo oficial de tierradelfuegoflyfishing.cl).
insert into public.bko_clients(slug,name,original_name,website_url,website_original,website_verified,logo_local_path,logo_storage_path,logo_verified,logo_authorized,logo_source,logo_source_original,logo_status_original,verification_status,observations,sector,sector_source,description,sort_order,active,published,featured,relation_authorized,authorization_reference,logo_authorization_reference,original_row,logo_width,logo_height,logo_background) values('tierra-del-fuego-fly-fishing','Tierra del Fuego Fly Fishing','Tierra del Fuego Fly Fishing','https://tierradelfuegoflyfishing.cl/','https://tierradelfuegoflyfishing.cl/',true,'assets/clientes/tierra-del-fuego-fly-fishing.png','',true,true,'https://tierradelfuegoflyfishing.cl/wp-content/uploads/2017/08/logonew.png','https://tierradelfuegoflyfishing.cl/','Logotipo oficial de la web','verified','Cliente agregado por instrucción del responsable del sitio (18-11-2026).','turismo','https://tierradelfuegoflyfishing.cl/','Pesca con mosca en la Patagonia chilena: cinco generaciones de experiencia.',330,true,true,true,true,'Instrucción del responsable del sitio, 18-11-2026: agregar Tierra del Fuego Fly Fishing a la sección de empresas con su logotipo.','Instrucción del responsable del sitio, 18-11-2026, de mostrar el logotipo de Tierra del Fuego Fly Fishing.','https://tierradelfuegoflyfishing.cl/, nuevo cliente con su logo',350,167,'white') on conflict(slug) do nothing;

-- Nuevo cliente: Imprenta Moris (logotipo oficial de moris.cl).
insert into public.bko_clients(slug,name,original_name,website_url,website_original,website_verified,logo_local_path,logo_storage_path,logo_verified,logo_authorized,logo_source,logo_source_original,logo_status_original,verification_status,observations,sector,sector_source,description,sort_order,active,published,featured,relation_authorized,authorization_reference,logo_authorization_reference,original_row,logo_width,logo_height,logo_background) values('imprenta-moris','Imprenta Moris','Imprenta Moris','https://moris.cl/','https://moris.cl/',true,'assets/clientes/imprenta-moris.jpg','',true,true,'https://moris.cl/wp-content/uploads/2024/10/Logo-MORIS-1.jpg','https://moris.cl/','Logotipo oficial de la web','verified','Cliente agregado por instrucción del responsable del sitio (18-11-2026).','comercio','https://moris.cl/','Imprenta en Santiago: impresión de gran formato, encuadernación y terminaciones.',340,true,true,true,true,'Instrucción del responsable del sitio, 18-11-2026: agregar Imprenta Moris a la sección de empresas con su logotipo.','Instrucción del responsable del sitio, 18-11-2026, de mostrar el logotipo de Imprenta Moris.','https://moris.cl/, nuevo cliente con su logo',640,600,'white') on conflict(slug) do nothing;

-- El trigger bko_client_revision puede desmarcar la verificación del logotipo; se reconfirma.
update public.bko_clients set
  logo_verified = true, logo_authorized = true, website_verified = true, verification_status = 'verified', published = true, active = true,
  logo_authorization_reference = 'Instrucción del responsable del sitio, 18-11-2026, de mostrar el logotipo de ' || name || '.'
where slug in ('tierra-del-fuego-fly-fishing','imprenta-moris');

commit;
