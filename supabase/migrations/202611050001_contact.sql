-- Ejecutar en el proyecto de BKO. No concede lectura/escritura pública.
begin;
create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 3 and 120),
  company text check (char_length(company) <= 160),
  email text not null check (char_length(email) <= 254),
  phone text check (char_length(phone) <= 25),
  city text not null check (city in ('Calama','Santiago','Puerto Varas','Otra ciudad')),
  area text not null check (area in ('Corporativo y empresarial','Minería, construcción y servicios asociados','Marítimo, naviero, lacustre y seguros','Acuicultura y recursos hidrobiológicos','Derecho laboral','Inmobiliario y familia','Necesito orientación')),
  message text not null check (char_length(message) between 20 and 4000),
  privacy_accepted boolean not null check (privacy_accepted = true),
  privacy_version text not null default 'draft-v1',
  status text not null default 'new' check (status in ('new','in_progress','closed'))
);
alter table public.consultations enable row level security;
revoke all on public.consultations from anon, authenticated;
grant select, insert, update, delete on public.consultations to service_role;

create table if not exists public.contact_rate_limits (
  fingerprint text not null,
  window_start timestamptz not null,
  requests integer not null default 1,
  primary key (fingerprint, window_start)
);
alter table public.contact_rate_limits enable row level security;
revoke all on public.contact_rate_limits from anon, authenticated;
grant all on public.contact_rate_limits to service_role;

-- Límite por ventana móvil; el bloqueo evita carreras entre peticiones concurrentes.
create or replace function public.submit_consultation(payload jsonb, client_fingerprint text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  submission_id uuid;
  bucket timestamptz := date_trunc('minute', now());
  recent_count integer;
begin
  if client_fingerprint is null or length(client_fingerprint) <> 64 then
    raise exception 'invalid_fingerprint';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(client_fingerprint, 0));
  select coalesce(sum(requests), 0) into recent_count from public.contact_rate_limits
    where fingerprint = client_fingerprint and window_start >= now() - interval '1 hour';
  if recent_count >= 5 then raise exception 'rate_limit_exceeded'; end if;
  insert into public.contact_rate_limits (fingerprint, window_start) values (client_fingerprint, bucket)
    on conflict (fingerprint, window_start) do update set requests = contact_rate_limits.requests + 1;
  delete from public.contact_rate_limits where window_start < now() - interval '2 hours';
  insert into public.consultations (name, company, email, phone, city, area, message, privacy_accepted, privacy_version)
    values (payload->>'name', nullif(payload->>'company',''), payload->>'email', nullif(payload->>'phone',''), payload->>'city', payload->>'area', payload->>'message', (payload->>'privacy')::boolean, 'draft-v1')
    returning id into submission_id;
  return submission_id;
end;
$$;
revoke all on function public.submit_consultation(jsonb, text) from public, anon, authenticated;
grant execute on function public.submit_consultation(jsonb, text) to service_role;
commit;
