-- 0001_init.sql — CatAdopt IL initial schema
-- Apply via Supabase MCP / CLI. Immutable once applied: changes go in new migrations.

create extension if not exists pgcrypto;

-- ============ helpers ============
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ============ profiles ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  age smallint check (age between 16 and 120),
  region text check (region in ('north','south','center','jerusalem','yosh')),
  city text,
  role text not null default 'user' check (role in ('user','admin')),
  publisher_type text check (publisher_type in ('private','organization')),
  publisher_status text not null default 'none'
    check (publisher_status in ('none','pending','approved','blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- privilege-escalation guard: only admins change role / publisher_status
create or replace function public.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role
      or new.publisher_status is distinct from old.publisher_status)
     and not public.is_admin() then
    raise exception 'changing role/publisher_status requires admin';
  end if;
  return new;
end; $$;
create trigger trg_profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- auto-create profile on signup (metadata: full_name, phone)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''),
          new.raw_user_meta_data->>'phone');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- ============ adopter_profiles (saved questionnaire) ============
-- fields mirror the client's questionnaire spec (2026-07-10); full_name/phone live on profiles
create table public.adopter_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  age smallint check (age between 16 and 120),
  city text,
  household_desc text,                 -- מי גר בבית
  has_other_pets boolean,
  other_pets_desc text,
  has_cat_experience boolean,          -- ניסיון עבר עם חתולים
  vet_clinic text,                     -- שם המרפאה של הווטרינר הקבוע (אופציונלי)
  adoption_reason text,                -- למה את/ה רוצה לאמץ חתול
  surrender_circumstances text,        -- באילו נסיבות תחפש/י למסור חתול שאימצת
  floor_type text check (floor_type in
    ('ground_house','garden_floor','floor_1','floor_2','floor_3_plus')),
  has_window_screens boolean,          -- רשתות בחלונות (שאלת בטיחות סטנדרטית)
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.adopter_profiles enable row level security;
create trigger trg_adopter_updated before update on public.adopter_profiles
  for each row execute function public.set_updated_at();

create policy adopter_select on public.adopter_profiles for select
  using (user_id = auth.uid() or public.is_admin());
create policy adopter_insert on public.adopter_profiles for insert
  with check (user_id = auth.uid());
create policy adopter_update on public.adopter_profiles for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ============ cats ============
create table public.cats (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  sex text not null default 'unknown' check (sex in ('male','female','unknown')),
  birth_est date not null,                       -- approximate; display age is computed
  region text not null check (region in ('north','south','center','jerusalem','yosh')),
  city text,
  description text not null check (char_length(description) >= 20),
  health_notes text,
  neutered boolean,
  vaccinations smallint not null default 0 check (vaccinations between 0 and 3),
  is_special boolean not null default false,     -- "מיוחדים": נכות/עיוורון/חירשות וכו'
  special_needs text,                            -- required when is_special (enforced in zod)
  fee_amount integer check (fee_amount > 0),     -- סל אימוץ בש"ח; null = אין
  good_with_cats boolean,
  good_with_dogs boolean,
  status text not null default 'pending'
    check (status in ('draft','pending','published','adopted','rejected','archived')),
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  adopted_at timestamptz
);
alter table public.cats enable row level security;
create trigger trg_cats_updated before update on public.cats
  for each row execute function public.set_updated_at();

create policy cats_select on public.cats for select
  using (status = 'published' or owner_id = auth.uid() or public.is_admin());
create policy cats_insert on public.cats for insert
  with check (
    owner_id = auth.uid()
    and status in ('draft','pending')
    and exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.publisher_status = 'approved')
  );
-- owners may edit but never self-publish; editing published forces re-approval
create policy cats_update_owner on public.cats for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and status in ('draft','pending','adopted','archived'));
create policy cats_update_admin on public.cats for update
  using (public.is_admin()) with check (public.is_admin());

-- ============ cat_photos (two variants per photo) ============
create table public.cat_photos (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references public.cats(id) on delete cascade,
  path_card text not null,
  path_full text not null,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);
alter table public.cat_photos enable row level security;

create policy photos_select on public.cat_photos for select
  using (exists (select 1 from public.cats c where c.id = cat_id
                 and (c.status = 'published' or c.owner_id = auth.uid() or public.is_admin())));
create policy photos_write on public.cat_photos for all
  using (exists (select 1 from public.cats c where c.id = cat_id
                 and (c.owner_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.cats c where c.id = cat_id
                 and (c.owner_id = auth.uid() or public.is_admin())));

-- ============ adoption_requests ============
create table public.adoption_requests (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references public.cats(id) on delete cascade,
  adopter_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(message) >= 10),
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','withdrawn')),
  admin_note text,
  decided_by uuid references public.profiles(id),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.adoption_requests enable row level security;
create unique index uniq_open_request
  on public.adoption_requests (cat_id, adopter_id) where status = 'pending';

create policy requests_select on public.adoption_requests for select
  using (
    adopter_id = auth.uid()
    or public.is_admin()
    or (status = 'approved' and exists (select 1 from public.cats c
        where c.id = cat_id and c.owner_id = auth.uid()))
  );
create policy requests_insert on public.adoption_requests for insert
  with check (
    adopter_id = auth.uid()
    and exists (select 1 from public.adopter_profiles ap
                where ap.user_id = auth.uid() and ap.completed_at is not null)
    and exists (select 1 from public.cats c where c.id = cat_id and c.status = 'published')
  );
create policy requests_withdraw on public.adoption_requests for update
  using (adopter_id = auth.uid() and status = 'pending')
  with check (adopter_id = auth.uid() and status = 'withdrawn');
create policy requests_admin on public.adoption_requests for update
  using (public.is_admin()) with check (public.is_admin());

-- ============ moderation_log (append-only) ============
create table public.moderation_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id),
  entity_type text not null check (entity_type in ('publisher','cat','request')),
  entity_id uuid not null,
  action text not null,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.moderation_log enable row level security;
create policy modlog_select on public.moderation_log for select using (public.is_admin());
create policy modlog_insert on public.moderation_log for insert with check (public.is_admin());

-- ============ indexes ============
create index idx_cats_published on public.cats (status, published_at desc);
create index idx_cats_region on public.cats (region) where status = 'published';
create index idx_photos_cat on public.cat_photos (cat_id, sort_order);
create index idx_requests_queue on public.adoption_requests (status, created_at);
create index idx_requests_adopter on public.adoption_requests (adopter_id);

-- ============ storage ============
insert into storage.buckets (id, name, public)
  values ('cat-photos','cat-photos', true)
  on conflict (id) do nothing;

create policy storage_public_read on storage.objects for select
  using (bucket_id = 'cat-photos');
create policy storage_owner_insert on storage.objects for insert
  with check (
    bucket_id = 'cat-photos' and auth.role() = 'authenticated'
    and exists (select 1 from public.cats c
                where c.id::text = (storage.foldername(name))[1]
                  and (c.owner_id = auth.uid() or public.is_admin()))
  );
create policy storage_owner_delete on storage.objects for delete
  using (
    bucket_id = 'cat-photos'
    and exists (select 1 from public.cats c
                where c.id::text = (storage.foldername(name))[1]
                  and (c.owner_id = auth.uid() or public.is_admin()))
  );
