-- Nuevo cliente con su logotipo, entregado por el responsable del sitio (clientes/botanic_osorno.jpg) (26-11-2026).
-- Ejecutar una vez en el editor SQL de Supabase (proyecto BKO).
begin;

insert into public.bko_clients(slug,name,original_name,website_url,website_original,website_verified,logo_local_path,logo_storage_path,logo_verified,logo_authorized,logo_source,logo_source_original,logo_status_original,verification_status,observations,sector,sector_source,description,sort_order,active,published,featured,relation_authorized,authorization_reference,logo_authorization_reference,original_row,logo_width,logo_height,logo_background) values('botanic-osorno','Botanic Osorno','Botanic Osorno','https://www.instagram.com/botanic_osorno/','https://www.instagram.com/botanic_osorno?avpt=czl3MGVuNXF3bWc5',true,'assets/clientes/botanic-osorno.jpg','',true,true,'Logotipo entregado por el responsable del sitio (clientes/botanic_osorno.jpg)','clientes/botanic_osorno.jpg','Logotipo entregado por el cliente','verified','Cliente agregado por instrucción del responsable del sitio (26-11-2026).','general','https://www.instagram.com/botanic_osorno/','Empresa de Osorno, Región de Los Lagos.',370,true,true,true,true,'Instrucción del responsable del sitio, 26-11-2026: agregar Botanic Osorno al carrusel de empresas con su logotipo.','Instrucción del responsable del sitio, 26-11-2026, de mostrar el logotipo de Botanic Osorno.','https://www.instagram.com/botanic_osorno, nuevo cliente con su logo',150,150,'navy') on conflict(slug) do nothing;

-- El trigger bko_client_revision puede desmarcar la verificación del logotipo; se reconfirma.
update public.bko_clients set
  logo_verified = true, logo_authorized = true, website_verified = true, verification_status = 'verified', published = true, active = true, featured = true,
  logo_authorization_reference = 'Instrucción del responsable del sitio, 26-11-2026, de mostrar el logotipo de Botanic Osorno.'
where slug = 'botanic-osorno';

commit;
