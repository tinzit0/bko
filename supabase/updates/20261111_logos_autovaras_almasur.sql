-- Logotipos de AutoVaras Motors y Almasur Inmobiliaria en el carrusel de clientes (11-11-2026).
-- Ejecutar una vez en el editor SQL de Supabase (proyecto BKO).
begin;

-- AutoVaras: ya existía sin publicar. El trigger revoca la verificación al cambiar el archivo, por eso se confirma en un segundo paso.
-- El sitio autovaras.cl sigue suspendido: se mantiene website_verified=false, así la tarjeta no enlaza.
update public.bko_clients set name='AutoVaras Motors', logo_local_path='assets/clientes/autovaras-motors.jpeg', logo_storage_path='', logo_width=1280, logo_height=408, logo_background='white' where slug='autovaras';
update public.bko_clients set logo_source='Entregado por el responsable del sitio (11-11-2026)', logo_verified=true, logo_authorized=true, verification_status='verified', active=true, published=true, relation_authorized=true, authorization_reference='Instrucción del responsable del sitio, 11-11-2026: mostrar AutoVaras Motors en el carrusel de clientes.', logo_authorization_reference='Logotipo entregado por el responsable del sitio el 11-11-2026 para su publicación.' where slug='autovaras';

-- Nuevo cliente: Almasur Inmobiliaria.
insert into public.bko_clients(slug,name,original_name,website_url,website_original,website_verified,logo_local_path,logo_storage_path,logo_verified,logo_authorized,logo_source,logo_source_original,logo_status_original,verification_status,observations,sector,sector_source,description,sort_order,active,published,featured,relation_authorized,authorization_reference,logo_authorization_reference,original_row,logo_width,logo_height,logo_background) values('almasur-inmobiliaria','Almasur Inmobiliaria','Almasur Inmobiliaria','','',false,'assets/clientes/almasur-inmobiliaria.jpeg','',true,true,'Entregado por el responsable del sitio (11-11-2026)','','Logotipo entregado por el responsable del sitio','verified','Cliente agregado por instrucción del responsable del sitio (11-11-2026).','general','','',260,true,true,true,true,'Instrucción del responsable del sitio, 11-11-2026: agregar Almasur Inmobiliaria al carrusel de clientes.','Logotipo entregado por el responsable del sitio el 11-11-2026 para su publicación.','Almasur Inmobiliaria, nuevo cliente',500,500,'white') on conflict(slug) do nothing;

commit;
