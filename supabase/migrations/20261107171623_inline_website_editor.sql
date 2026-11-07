begin;
alter table public.site_content drop constraint site_content_key_check;
alter table public.site_content add constraint site_content_key_check check(key in('insurance','website'));
create policy public_website_content on public.site_content for select using(key='website');
insert into public.site_content(key,value) values('website','{"pages":{}}'::jsonb) on conflict(key) do nothing;
commit;
