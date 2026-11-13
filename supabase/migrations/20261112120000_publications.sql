-- Artículos y estudios administrables desde la portada y desde Gestión.
-- Lectura pública solo de lo publicado; altas, ediciones y bajas para roles admin/editor.
begin;
create table public.bko_publications (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique check(length(slug) between 3 and 120 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 kind text not null default 'articulo' check(kind in('articulo','estudio')),
 title text not null check(length(trim(title)) between 3 and 220),
 summary text not null default '' check(length(summary)<=600),
 body text not null default '' check(length(body)<=60000),
 author text not null default '' check(length(author)<=200),
 area text not null default '' check(length(area)<=120),
 published_on date not null default ((now() at time zone 'America/Santiago')::date),
 cover_url text not null default '' check(length(cover_url)<=2000 and (cover_url='' or cover_url ~ '^(https://[^[:space:]]+|assets/[a-zA-Z0-9/._-]+)$')),
 cover_alt text not null default '' check(length(cover_alt)<=500),
 file_url text not null default '' check(length(file_url)<=2000 and (file_url='' or file_url ~ '^https://[^[:space:]]+$')),
 file_name text not null default '' check(length(file_name)<=200),
 published boolean not null default false,
 featured boolean not null default false,
 revision bigint not null default 1,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index bko_publications_public_order on public.bko_publications(featured desc,published_on desc,created_at desc) where published;
alter table public.bko_publications enable row level security;
revoke all on public.bko_publications from anon,authenticated;
grant select on public.bko_publications to anon,authenticated;
grant insert(slug,kind,title,summary,body,author,area,published_on,cover_url,cover_alt,file_url,file_name,published,featured) on public.bko_publications to authenticated;
grant update(kind,title,summary,body,author,area,published_on,cover_url,cover_alt,file_url,file_name,published,featured) on public.bko_publications to authenticated;
grant delete on public.bko_publications to authenticated;
create policy bko_publications_public on public.bko_publications for select to anon,authenticated using(published);
create policy bko_publications_editors on public.bko_publications for all to authenticated using(public.bko_has_role(array['admin','editor'])) with check(public.bko_has_role(array['admin','editor']));
-- Reutiliza el contador de revisión del CMS (updated_at + revision) para evitar sobrescrituras concurrentes.
create trigger bko_publications_revision before update on public.bko_publications for each row execute function public.bko_content_revision();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('bko-publications','bko-publications',true,26214400,array['application/pdf'])
 on conflict(id) do nothing;
create policy bko_publications_files_read on storage.objects for select using(bucket_id='bko-publications');
create policy bko_publications_files_insert on storage.objects for insert to authenticated with check(bucket_id='bko-publications' and public.bko_has_role(array['admin','editor']));
create policy bko_publications_files_update on storage.objects for update to authenticated using(bucket_id='bko-publications' and public.bko_has_role(array['admin','editor'])) with check(bucket_id='bko-publications' and public.bko_has_role(array['admin','editor']));
create policy bko_publications_files_delete on storage.objects for delete to authenticated using(bucket_id='bko-publications' and public.bko_has_role(array['admin','editor']));
commit;
