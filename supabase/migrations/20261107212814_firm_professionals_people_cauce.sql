begin;
create table public.bko_content (
 id text primary key check(id ~ '^[a-z][a-z0-9-]{0,99}$'),
 kind text not null check(kind in('professional','area','page')),
 sort_order integer not null default 0 check(sort_order between -1000000 and 1000000),
 active boolean not null default true,
 published boolean not null default false,
 data jsonb not null check(jsonb_typeof(data)='object' and octet_length(data::text)<=200000),
 revision bigint not null default 1,
 updated_at timestamptz not null default now(),
 constraint no_unapproved_email check(kind<>'professional' or coalesce((data->>'contactAuthorized')::boolean,false) or coalesce(data->>'email','')=''),
 constraint no_public_calculation_settings check(id<>'cauce' or (coalesce(data#>>'{interestCriteria,norm}','')='' and coalesce(data#>>'{interestCriteria,rateSource}','')='' and coalesce(data#>>'{interestCriteria,formula}','')='' and coalesce(data#>>'{interestCriteria,verification}','')=''))
);
create index bko_content_public_order on public.bko_content(kind,sort_order,id) where active and published;
alter table public.bko_content enable row level security;
revoke all on public.bko_content from anon,authenticated;
grant select on public.bko_content to anon,authenticated;
grant insert(id,kind,sort_order,active,published,data) on public.bko_content to authenticated;
grant update(sort_order,active,published,data) on public.bko_content to authenticated;
create policy bko_content_public on public.bko_content for select to anon,authenticated using(active and published);
create policy bko_content_editor_read on public.bko_content for select to authenticated using(exists(select 1 from public.bko_admin_members where user_id=(select auth.uid()) and role in('admin','editor')));
create policy bko_content_editor_insert on public.bko_content for insert to authenticated with check(exists(select 1 from public.bko_admin_members where user_id=(select auth.uid()) and role in('admin','editor')));
create policy bko_content_editor_update on public.bko_content for update to authenticated using(exists(select 1 from public.bko_admin_members where user_id=(select auth.uid()) and role in('admin','editor'))) with check(exists(select 1 from public.bko_admin_members where user_id=(select auth.uid()) and role in('admin','editor')));
create trigger bko_firm_revision before update on public.bko_content for each row execute function public.bko_content_revision();

create table public.bko_content_private (
 id text primary key references public.bko_content(id) on delete cascade,
 value jsonb not null default '{}'::jsonb check(jsonb_typeof(value)='object' and octet_length(value::text)<=15000)
);
alter table public.bko_content_private enable row level security;
revoke all on public.bko_content_private from anon,authenticated;
grant select,insert,update on public.bko_content_private to authenticated;
create policy bko_private_read on public.bko_content_private for select to authenticated using(exists(select 1 from public.bko_admin_members where user_id=(select auth.uid()) and role in('admin','editor')));
create policy bko_private_insert on public.bko_content_private for insert to authenticated with check(exists(select 1 from public.bko_admin_members where user_id=(select auth.uid()) and role in('admin','editor')));
create policy bko_private_update on public.bko_content_private for update to authenticated using(exists(select 1 from public.bko_admin_members where user_id=(select auth.uid()) and role in('admin','editor'))) with check(exists(select 1 from public.bko_admin_members where user_id=(select auth.uid()) and role in('admin','editor')));

-- Invoker security: RLS and column grants remain enforced. Both records commit atomically.
create function public.save_bko_content(record jsonb,expected_revision bigint default null) returns setof public.bko_content language plpgsql security invoker set search_path='' as $$
declare result public.bko_content; clean jsonb:=record->'data'; private_value jsonb:='{}'::jsonb;
begin
 if not exists(select 1 from public.bko_admin_members where user_id=(select auth.uid()) and role in('admin','editor')) then raise exception 'not_authorized' using errcode='42501';end if;
 if record->>'kind'='professional' then
  private_value:=jsonb_build_object('email',coalesce(clean->>'email',''));
  if not coalesce((clean->>'contactAuthorized')::boolean,false) then clean:=jsonb_set(clean,'{email}','""'::jsonb);end if;
 end if;
 if record->>'id'='cauce' then
  private_value:=jsonb_build_object('interestCriteria',clean->'interestCriteria');
  clean:=jsonb_set(clean,'{interestCriteria}','{"norm":"","rateSource":"","formula":"","verification":"","reviewed":false}'::jsonb);
 end if;
 if expected_revision is null then
  insert into public.bko_content(id,kind,sort_order,active,published,data) values(record->>'id',record->>'kind',(record->>'sort_order')::integer,(record->>'active')::boolean,(record->>'published')::boolean,clean) returning * into result;
 else
  update public.bko_content set sort_order=(record->>'sort_order')::integer,active=(record->>'active')::boolean,published=(record->>'published')::boolean,data=clean where id=record->>'id' and kind=record->>'kind' and revision=expected_revision returning * into result;
  if not found then raise exception 'content_revision_conflict' using errcode='40001';end if;
 end if;
 insert into public.bko_content_private(id,value) values(result.id,private_value) on conflict(id) do update set value=excluded.value;
 return next result;
end $$;
revoke all on function public.save_bko_content(jsonb,bigint) from public,anon;
grant execute on function public.save_bko_content(jsonb,bigint) to authenticated;

-- Keep historical inquiry labels valid while new submissions use the reorganized areas.
alter table public.consultations drop constraint consultations_area_check;
alter table public.consultations add constraint consultations_area_check check(area in('Corporativo','Minería, construcción y servicios asociados','Marítimo y Naviero','Inmobiliario','Derecho de Familia','Derecho Laboral','CAUCE Gestión Integral','Necesito orientación','Negocios y seguros corporativos','Corporativo y empresarial','Marítimo, naviero, lacustre y seguros','Acuicultura y recursos hidrobiológicos','Derecho laboral','Inmobiliario y familia'));
commit;
