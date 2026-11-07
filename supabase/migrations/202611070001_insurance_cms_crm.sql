begin;
create table public.bko_admin_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','editor','insurance'))
);
alter table public.bko_admin_members enable row level security;
revoke all on public.bko_admin_members from anon, authenticated;
grant select on public.bko_admin_members to authenticated;
grant all on public.bko_admin_members to service_role;
create policy own_membership on public.bko_admin_members for select to authenticated using (user_id=auth.uid());
create function public.bko_has_role(allowed text[]) returns boolean language sql stable security definer set search_path=public,pg_temp as $$select exists(select 1 from public.bko_admin_members where user_id=auth.uid() and role=any(allowed))$$;
revoke all on function public.bko_has_role(text[]) from public,anon;
grant execute on function public.bko_has_role(text[]) to authenticated;

create table public.insurance_responsibles(id text primary key check(id ~ '^[a-z0-9-]+$'),name text not null check(length(name) between 2 and 160),active boolean not null default true);
insert into public.insurance_responsibles(id,name) values('roxana','Roxana Ximena Oyarzún Bustamante');
alter table public.insurance_responsibles enable row level security;
revoke all on public.insurance_responsibles from anon,authenticated;
grant select on public.insurance_responsibles to anon,authenticated;
grant insert,update,delete on public.insurance_responsibles to authenticated;
grant all on public.insurance_responsibles to service_role;
create policy public_responsibles on public.insurance_responsibles for select using(true);
create policy admin_responsibles on public.insurance_responsibles for all to authenticated using(public.bko_has_role(array['admin'])) with check(public.bko_has_role(array['admin']));

create table public.site_content(key text primary key check(key='insurance'),value jsonb not null check(jsonb_typeof(value)='object' and octet_length(value::text)<500000),updated_at timestamptz not null default now(),revision integer not null default 1);
alter table public.site_content enable row level security;
revoke all on public.site_content from anon,authenticated;
grant select on public.site_content to anon,authenticated;
grant insert,update on public.site_content to authenticated;
grant all on public.site_content to service_role;
create policy public_insurance_content on public.site_content for select using(key='insurance');
create policy edit_insurance_content on public.site_content for insert to authenticated with check(public.bko_has_role(array['admin','editor']));
create policy update_insurance_content on public.site_content for update to authenticated using(public.bko_has_role(array['admin','editor'])) with check(public.bko_has_role(array['admin','editor']));
create function public.bko_content_revision() returns trigger language plpgsql set search_path=public,pg_temp as $$begin new.updated_at=now();new.revision=old.revision+1;return new;end$$;
create trigger content_revision before update on public.site_content for each row execute function public.bko_content_revision();

alter table public.consultations drop constraint consultations_area_check;
alter table public.consultations add constraint consultations_area_check check(area in ('Corporativo y empresarial','Minería, construcción y servicios asociados','Marítimo, naviero, lacustre y seguros','Acuicultura y recursos hidrobiológicos','Derecho laboral','Inmobiliario y familia','Necesito orientación','Negocios y seguros corporativos'));
alter table public.consultations drop constraint consultations_status_check;
alter table public.consultations add constraint consultations_status_check check(status in('new','in_progress','follow_up','closed'));
alter table public.consultations add column insurance_type text check(insurance_type in('Responsabilidad Civil','Construcción','Licitaciones y Garantías','Maquinaria','Seguros Empresariales','Vida y Ahorro','APV','Cesantía','Embarcaciones','Responsabilidad Civil Marítima','Otros seguros')),
 add column company_rut text check(length(company_rut)<=16),
 add column activity text check(length(activity)<=250),
 add column expected_date date,
 add column commercial_consent boolean,
 add column responsible_id text references public.insurance_responsibles(id),
 add column quotation_reference text check(length(quotation_reference)<=250),
 add column quotation_followup boolean not null default false,
 add column admin_notes text check(length(admin_notes)<=4000),
 add constraint insurance_required check(area<>'Negocios y seguros corporativos' or (insurance_type is not null and length(activity)>=3 and commercial_consent is true and responsible_id is not null)),
 add constraint real_quote_reference check(not quotation_followup or coalesce(length(trim(quotation_reference)),0)>0);
create index consultations_insurance_created on public.consultations(area,created_at desc);
create index consultations_insurance_category on public.consultations(insurance_type,status);
grant select on public.consultations to authenticated;
grant update(status,responsible_id,quotation_reference,quotation_followup,admin_notes) on public.consultations to authenticated;
create policy crm_read on public.consultations for select to authenticated using(public.bko_has_role(array['admin']) or (area='Negocios y seguros corporativos' and public.bko_has_role(array['insurance'])));
create policy crm_update on public.consultations for update to authenticated using(public.bko_has_role(array['admin']) or (area='Negocios y seguros corporativos' and public.bko_has_role(array['insurance']))) with check(public.bko_has_role(array['admin']) or (area='Negocios y seguros corporativos' and public.bko_has_role(array['insurance'])));

-- Retains the original atomic rate limit and legal-consultation storage.
create or replace function public.submit_consultation(payload jsonb,client_fingerprint text) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare submission_id uuid;bucket timestamptz:=date_trunc('minute',now());recent_count integer;insurance boolean:=payload->>'area'='Negocios y seguros corporativos';assigned text;
begin
 if client_fingerprint is null or length(client_fingerprint)<>64 then raise exception 'invalid_fingerprint';end if;
 perform pg_advisory_xact_lock(hashtextextended(client_fingerprint,0));
 select coalesce(sum(requests),0) into recent_count from public.contact_rate_limits where fingerprint=client_fingerprint and window_start>=now()-interval '1 hour';
 if recent_count>=5 then raise exception 'rate_limit_exceeded';end if;
 insert into public.contact_rate_limits(fingerprint,window_start)values(client_fingerprint,bucket)on conflict(fingerprint,window_start)do update set requests=contact_rate_limits.requests+1;
 delete from public.contact_rate_limits where window_start<now()-interval '2 hours';
 if insurance then
   select value->>'responsible' into assigned from public.site_content where key='insurance';
   assigned:=coalesce(assigned,'roxana');
   if not exists(select 1 from public.insurance_responsibles where id=assigned and active) then raise exception 'insurance_responsible_unavailable';end if;
 end if;
 insert into public.consultations(name,company,email,phone,city,area,message,privacy_accepted,privacy_version,insurance_type,company_rut,activity,expected_date,commercial_consent,responsible_id)
 values(payload->>'name',nullif(payload->>'company',''),payload->>'email',nullif(payload->>'phone',''),payload->>'city',payload->>'area',payload->>'message',(payload->>'privacy')::boolean,case when insurance then 'insurance-v1' else 'draft-v1' end,
 case when insurance then payload->>'insuranceType' end,case when insurance then nullif(payload->>'companyRut','') end,case when insurance then payload->>'activity' end,case when insurance then nullif(payload->>'expectedDate','')::date end,case when insurance then (payload->>'commercialConsent')::boolean end,assigned)returning id into submission_id;
 return submission_id;
end$$;
revoke all on function public.submit_consultation(jsonb,text) from public,anon,authenticated;
grant execute on function public.submit_consultation(jsonb,text) to service_role;

create function public.insurance_metrics() returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
 select jsonb_build_object('received',count(*),'pending',count(*)filter(where status='new'),'construction',count(*)filter(where insurance_type='Construcción'),'guarantees',count(*)filter(where insurance_type='Licitaciones y Garantías'),'liability',count(*)filter(where insurance_type='Responsabilidad Civil'),'quotationFollowup',count(*)filter(where quotation_followup and nullif(trim(quotation_reference),'') is not null))from public.consultations where area='Negocios y seguros corporativos'
$$;
revoke all on function public.insurance_metrics() from public,anon;
grant execute on function public.insurance_metrics() to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)values('insurance-media','insurance-media',true,8000000,array['image/jpeg','image/png','image/webp'])on conflict(id)do nothing;
create policy insurance_media_read on storage.objects for select using(bucket_id='insurance-media');
create policy insurance_media_insert on storage.objects for insert to authenticated with check(bucket_id='insurance-media' and public.bko_has_role(array['admin','editor']));
create policy insurance_media_update on storage.objects for update to authenticated using(bucket_id='insurance-media' and public.bko_has_role(array['admin','editor'])) with check(bucket_id='insurance-media' and public.bko_has_role(array['admin','editor']));
commit;
