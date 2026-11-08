begin;
create table public.bko_clients (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(trim(name)) between 1 and 180),
 slug text not null unique check(length(slug)<=160 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 original_name text not null default '' check(length(original_name)<=300),
 website_url text not null default '' check(length(website_url)<=2000 and (website_url='' or website_url ~ '^https?://[^[:space:]@]+[.][^[:space:]]+')),
 website_original text not null default '' check(length(website_original)<=2000),
 website_verified boolean not null default false,
 logo_local_path text not null default '' check(logo_local_path='' or logo_local_path ~ '^assets/clientes/[a-zA-Z0-9][a-zA-Z0-9._-]*[.](svg|png|webp|jpg|jpeg)$'),
 logo_storage_path text not null default '' check(logo_storage_path='' or logo_storage_path ~ '^[a-zA-Z0-9][a-zA-Z0-9._-]{1,150}[.](svg|png|webp|jpg|jpeg)$'),
 logo_width integer not null default 240 check(logo_width between 1 and 10000),
 logo_height integer not null default 100 check(logo_height between 1 and 10000),
 logo_background text not null default 'white' check(logo_background in('white','ivory','navy')),
 logo_verified boolean not null default false,
 logo_authorized boolean not null default false,
 logo_source text not null default '' check(length(logo_source)<=2000),
 logo_source_original text not null default '' check(length(logo_source_original)<=2000),
 logo_status_original text not null default '' check(length(logo_status_original)<=500),
 verification_status text not null default 'pending' check(verification_status in('pending','verified','rejected')),
 observations text not null default '' check(length(observations)<=12000),
 sector text not null default 'general' check(sector in('general','mineria','construccion','turismo','comercio','salud','maritimo')),
 sector_source text not null default '' check(length(sector_source)<=2000),
 description text not null default '' check(length(description)<=2000),
 sort_order integer not null default 0 check(sort_order between -1000000 and 1000000),
 active boolean not null default true,
 published boolean not null default false,
 featured boolean not null default false,
 relation_authorized boolean not null default false,
 authorization_reference text not null default '' check(length(authorization_reference)<=2000),
 logo_authorization_reference text not null default '' check(length(logo_authorization_reference)<=2000),
 original_row text not null default '' check(length(original_row)<=20000),
 revision bigint not null default 1,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint client_publication_authorized check(not published or (relation_authorized and length(trim(authorization_reference))>=3)),
 constraint client_logo_authorized check(not logo_authorized or length(trim(logo_authorization_reference))>=3),
 constraint client_logo_verified check(not logo_verified or ((logo_local_path<>'' or logo_storage_path<>'') and length(trim(logo_source))>=3)),
 constraint client_sector_evidence check(sector='general' or length(trim(sector_source))>=3),
 constraint client_logo_single_location check(logo_local_path='' or logo_storage_path='')
);
create index bko_clients_public_order on public.bko_clients(sort_order,slug) where active and published and relation_authorized;
alter table public.bko_clients enable row level security;
revoke all on public.bko_clients from anon,authenticated;
grant select(id,name,slug,logo_local_path,logo_storage_path,logo_width,logo_height,logo_verified,logo_authorized,logo_background,website_url,website_verified,sector,description,sort_order,active,published,featured,relation_authorized) on public.bko_clients to anon;
grant select,delete on public.bko_clients to authenticated;
grant insert(name,slug,original_name,website_url,website_original,website_verified,logo_local_path,logo_storage_path,logo_width,logo_height,logo_background,logo_verified,logo_authorized,logo_source,logo_source_original,logo_status_original,verification_status,observations,sector,sector_source,description,sort_order,active,published,featured,relation_authorized,authorization_reference,logo_authorization_reference,original_row) on public.bko_clients to authenticated;
grant update(name,slug,website_url,website_verified,logo_local_path,logo_storage_path,logo_width,logo_height,logo_background,logo_verified,logo_authorized,logo_source,verification_status,observations,sector,sector_source,description,sort_order,active,published,featured,relation_authorized,authorization_reference,logo_authorization_reference) on public.bko_clients to authenticated;
create policy bko_clients_public on public.bko_clients for select to anon using(active and published and relation_authorized);
create policy bko_clients_admin on public.bko_clients for all to authenticated using(exists(select 1 from public.bko_admin_members where user_id=(select auth.uid()) and role='admin')) with check(exists(select 1 from public.bko_admin_members where user_id=(select auth.uid()) and role='admin'));
create function public.bko_client_revision() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.logo_local_path is distinct from old.logo_local_path or new.logo_storage_path is distinct from old.logo_storage_path then
  new.logo_verified:=false;new.logo_authorized:=false;new.logo_authorization_reference:='';new.verification_status:='pending';
 end if;
 if new.website_url is distinct from old.website_url then new.website_verified:=false;end if;
 new.updated_at:=now();new.revision:=old.revision+1;return new;
end$$;
revoke all on function public.bko_client_revision() from public,anon,authenticated;
create trigger bko_clients_revision before update on public.bko_clients for each row execute function public.bko_client_revision();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('bko-client-logos','bko-client-logos',false,2000000,array['image/svg+xml','image/png','image/webp','image/jpeg']) on conflict(id) do nothing;
create policy bko_client_logo_read on storage.objects for select to authenticated using(bucket_id='bko-client-logos' and exists(select 1 from public.bko_admin_members where user_id=(select auth.uid()) and role='admin'));
create policy bko_client_logo_insert on storage.objects for insert to authenticated with check(bucket_id='bko-client-logos' and exists(select 1 from public.bko_admin_members where user_id=(select auth.uid()) and role='admin'));
create policy bko_client_logo_update on storage.objects for update to authenticated using(bucket_id='bko-client-logos' and exists(select 1 from public.bko_admin_members where user_id=(select auth.uid()) and role='admin')) with check(bucket_id='bko-client-logos' and exists(select 1 from public.bko_admin_members where user_id=(select auth.uid()) and role='admin'));
create policy bko_client_logo_delete on storage.objects for delete to authenticated using(bucket_id='bko-client-logos' and exists(select 1 from public.bko_admin_members where user_id=(select auth.uid()) and role='admin'));
commit;
