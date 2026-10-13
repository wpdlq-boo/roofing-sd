-- Ermie's Roofing and Renovations — initial schema (SRS 3.8, 4.2)
-- Run this once in the Supabase SQL Editor (or with `supabase db push`).
-- The database stores website content only. Quote requests are never stored (INV-01, DB-01).

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- services (SRS 3.8.1)
-- ---------------------------------------------------------------------------

create table public.services (
  id                uuid primary key default gen_random_uuid(),
  name              text not null unique check (char_length(name) between 3 and 60),
  short_description text not null check (char_length(short_description) between 10 and 200),
  full_description  text not null check (char_length(full_description) between 10 and 1500),
  image_path        text,
  display_order     integer not null default 0,
  is_visible        boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger services_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- portfolio_projects and project_photos (SRS 3.8.1)
-- ---------------------------------------------------------------------------

create table public.portfolio_projects (
  id              uuid primary key default gen_random_uuid(),
  title           text not null check (char_length(title) between 3 and 100),
  description     text not null check (char_length(description) between 10 and 2000),
  service_id      uuid not null references public.services (id) on delete restrict, -- DB-04
  general_area    text not null check (char_length(general_area) between 2 and 100),
  completion_date date check (completion_date is null or extract(day from completion_date) = 1),
  cover_photo_id  uuid,
  is_published    boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index portfolio_projects_service_id_idx on public.portfolio_projects (service_id);

create trigger portfolio_projects_updated_at
  before update on public.portfolio_projects
  for each row execute function public.set_updated_at();

create table public.project_photos (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.portfolio_projects (id) on delete cascade, -- DB-03
  storage_path  text not null unique,
  alt_text      text check (alt_text is null or char_length(alt_text) <= 150),
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);

create index project_photos_project_id_idx on public.project_photos (project_id);

alter table public.portfolio_projects
  add constraint portfolio_projects_cover_photo_fk
  foreign key (cover_photo_id) references public.project_photos (id) on delete set null;

-- ---------------------------------------------------------------------------
-- faqs (SRS 3.8.1)
-- ---------------------------------------------------------------------------

create table public.faqs (
  id            uuid primary key default gen_random_uuid(),
  question      text not null unique check (char_length(question) between 10 and 200),
  answer        text not null check (char_length(answer) between 10 and 2000),
  category      text not null check (category in ('Our Services', 'Service Area', 'Requesting a Quote', 'General')),
  display_order integer not null default 0,
  is_visible    boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger faqs_updated_at
  before update on public.faqs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security (SEC-02)
-- Public sign-up is disabled in Supabase Auth, so the only "authenticated"
-- user is the admin account (AA-02).
-- ---------------------------------------------------------------------------

alter table public.services enable row level security;
alter table public.portfolio_projects enable row level security;
alter table public.project_photos enable row level security;
alter table public.faqs enable row level security;

create policy "Public can read visible services"
  on public.services for select to anon
  using (is_visible);

create policy "Public can read published projects"
  on public.portfolio_projects for select to anon
  using (is_published);

create policy "Public can read photos of published projects"
  on public.project_photos for select to anon
  using (exists (
    select 1 from public.portfolio_projects p
    where p.id = project_id and p.is_published
  ));

create policy "Public can read visible faqs"
  on public.faqs for select to anon
  using (is_visible);

create policy "Admin manages services"
  on public.services for all to authenticated
  using (true) with check (true);

create policy "Admin manages projects"
  on public.portfolio_projects for all to authenticated
  using (true) with check (true);

create policy "Admin manages photos"
  on public.project_photos for all to authenticated
  using (true) with check (true);

create policy "Admin manages faqs"
  on public.faqs for all to authenticated
  using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Storage buckets and policies (SW-03, SEC-03)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('service-images',   'service-images',   true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('portfolio-photos', 'portfolio-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Public buckets serve files to anyone by URL; only the admin may change them.
create policy "Admin uploads site images"
  on storage.objects for insert to authenticated
  with check (bucket_id in ('service-images', 'portfolio-photos'));

create policy "Admin updates site images"
  on storage.objects for update to authenticated
  using (bucket_id in ('service-images', 'portfolio-photos'));

create policy "Admin deletes site images"
  on storage.objects for delete to authenticated
  using (bucket_id in ('service-images', 'portfolio-photos'));

create policy "Admin lists site images"
  on storage.objects for select to authenticated
  using (bucket_id in ('service-images', 'portfolio-photos'));

-- ---------------------------------------------------------------------------
-- save_project: saves a project and its photo list in one transaction (REL-04)
--
-- p_project: { id?, title, description, service_id, general_area,
--              completion_date?, is_published }
-- p_photos:  [{ id?, storage_path, alt_text?, is_cover }] in display order
-- Returns the storage paths of photos that were removed, so the caller can
-- delete those files from storage.
-- ---------------------------------------------------------------------------

create or replace function public.save_project(p_project jsonb, p_photos jsonb)
returns table (project_id uuid, removed_paths text[])
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid := nullif(p_project ->> 'id', '')::uuid;
  v_published boolean := coalesce((p_project ->> 'is_published')::boolean, false);
  v_photo jsonb;
  v_photo_id uuid;
  v_cover uuid;
  v_order integer := 0;
  v_keep uuid[] := '{}';
  v_removed text[];
begin
  if v_published and jsonb_array_length(coalesce(p_photos, '[]'::jsonb)) = 0 then
    raise exception 'A project needs at least one photo before it can be published.'
      using errcode = 'P0001'; -- PM-08
  end if;

  if jsonb_array_length(coalesce(p_photos, '[]'::jsonb)) > 20 then
    raise exception 'A project can have at most 20 photos.' using errcode = 'P0001';
  end if;

  if v_id is null then
    insert into portfolio_projects (title, description, service_id, general_area, completion_date, is_published)
    values (
      p_project ->> 'title',
      p_project ->> 'description',
      (p_project ->> 'service_id')::uuid,
      p_project ->> 'general_area',
      nullif(p_project ->> 'completion_date', '')::date,
      v_published
    )
    returning id into v_id;
  else
    update portfolio_projects set
      title = p_project ->> 'title',
      description = p_project ->> 'description',
      service_id = (p_project ->> 'service_id')::uuid,
      general_area = p_project ->> 'general_area',
      completion_date = nullif(p_project ->> 'completion_date', '')::date,
      is_published = v_published
    where id = v_id;

    if not found then
      raise exception 'Project not found.' using errcode = 'P0002';
    end if;
  end if;

  for v_photo in select * from jsonb_array_elements(coalesce(p_photos, '[]'::jsonb))
  loop
    v_photo_id := nullif(v_photo ->> 'id', '')::uuid;

    if v_photo_id is null then
      insert into project_photos (project_id, storage_path, alt_text, display_order)
      values (v_id, v_photo ->> 'storage_path', nullif(v_photo ->> 'alt_text', ''), v_order)
      returning id into v_photo_id;
    else
      update project_photos set
        alt_text = nullif(v_photo ->> 'alt_text', ''),
        display_order = v_order
      where id = v_photo_id and project_photos.project_id = v_id;
    end if;

    v_keep := v_keep || v_photo_id;
    if coalesce((v_photo ->> 'is_cover')::boolean, false) then
      v_cover := v_photo_id;
    end if;
    v_order := v_order + 1;
  end loop;

  select coalesce(array_agg(storage_path), '{}') into v_removed
  from project_photos
  where project_photos.project_id = v_id and not (id = any (v_keep));

  delete from project_photos
  where project_photos.project_id = v_id and not (id = any (v_keep));

  -- Cover defaults to the first photo (SRS 3.2.7.2).
  update portfolio_projects
  set cover_photo_id = coalesce(v_cover, v_keep[1])
  where id = v_id;

  return query select v_id, v_removed;
end;
$$;

-- A published project must have at least one photo (PM-08). Checked at commit
-- time, so save_project can insert the project before its photos.
create or replace function public.check_published_has_photos()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.is_published and not exists (
    select 1 from project_photos where project_id = new.id
  ) then
    raise exception 'A project needs at least one photo before it can be published.'
      using errcode = 'P0001';
  end if;
  return null;
end;
$$;

create constraint trigger portfolio_projects_published_has_photos
  after insert or update of is_published on public.portfolio_projects
  deferrable initially deferred
  for each row execute function public.check_published_has_photos();

-- ---------------------------------------------------------------------------
-- Reordering helpers (SM-04, FM-04): set display_order from an ordered id list.
-- ---------------------------------------------------------------------------

create or replace function public.reorder_services(p_ids uuid[])
returns void
language sql
security invoker
set search_path = public
as $$
  update services s
  set display_order = o.pos
  from unnest(p_ids) with ordinality as o(id, pos)
  where s.id = o.id;
$$;

create or replace function public.reorder_faqs(p_ids uuid[])
returns void
language sql
security invoker
set search_path = public
as $$
  update faqs f
  set display_order = o.pos
  from unnest(p_ids) with ordinality as o(id, pos)
  where f.id = o.id;
$$;

revoke execute on function public.save_project(jsonb, jsonb) from anon, public;
revoke execute on function public.reorder_services(uuid[]) from anon, public;
revoke execute on function public.reorder_faqs(uuid[]) from anon, public;
grant execute on function public.save_project(jsonb, jsonb) to authenticated;
grant execute on function public.reorder_services(uuid[]) to authenticated;
grant execute on function public.reorder_faqs(uuid[]) to authenticated;
