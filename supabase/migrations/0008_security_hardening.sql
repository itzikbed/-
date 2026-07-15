-- 0008_security_hardening.sql
-- Make unmoderated media private, constrain direct API writes, and enforce owner transitions.

-- Users may submit their own first publisher application, but cannot grant themselves
-- approval or change roles. Admins and service-role jobs retain full control.
create or replace function public.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  trusted_actor boolean := public.is_admin() or auth.role() = 'service_role';
begin
  if new.role is distinct from old.role and not trusted_actor then
    raise exception 'changing role requires admin';
  end if;

  if new.publisher_status is distinct from old.publisher_status
     and not trusted_actor
     and not (old.publisher_status = 'none' and new.publisher_status = 'pending') then
    raise exception 'invalid publisher status transition';
  end if;

  return new;
end; $$;

-- The browser can call Supabase directly, so the database must enforce the same
-- status machine as server actions and protect moderation-owned columns.
create or replace function public.guard_cat_owner_mutation()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  trusted_actor boolean := public.is_admin() or auth.role() = 'service_role';
  valid_transition boolean;
begin
  if trusted_actor then
    return new;
  end if;

  if auth.uid() is null or old.owner_id <> auth.uid() or new.owner_id <> old.owner_id then
    raise exception 'invalid cat owner mutation';
  end if;

  if new.published_at is distinct from old.published_at
     or new.reject_reason is distinct from old.reject_reason then
    raise exception 'moderation-owned fields cannot be changed';
  end if;

  valid_transition := case old.status
    when 'draft' then new.status in ('draft', 'pending')
    when 'pending' then new.status in ('draft', 'pending')
    when 'rejected' then new.status in ('draft', 'pending')
    when 'published' then new.status in ('pending', 'adopted', 'archived')
    when 'adopted' then new.status in ('adopted', 'archived')
    when 'archived' then new.status in ('draft', 'pending', 'archived')
    else false
  end;

  if not valid_transition then
    raise exception 'invalid cat status transition';
  end if;

  if old.status = 'published' and new.status = 'adopted' then
    new.adopted_at := now();
  else
    new.adopted_at := old.adopted_at;
  end if;

  return new;
end; $$;

drop trigger if exists trg_cats_owner_guard on public.cats;
create trigger trg_cats_owner_guard before update on public.cats
  for each row execute function public.guard_cat_owner_mutation();

-- A blocked publisher must not bypass the server action through PostgREST.
drop policy if exists cats_insert on public.cats;
create policy cats_insert on public.cats for insert
  with check (
    owner_id = auth.uid()
    and status in ('draft','pending')
    and published_at is null
    and adopted_at is null
    and reject_reason is null
    and exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.publisher_status = 'approved')
  );

drop policy if exists cats_update_owner on public.cats;
create policy cats_update_owner on public.cats for update
  using (
    owner_id = auth.uid()
    and exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.publisher_status = 'approved')
  )
  with check (
    owner_id = auth.uid()
    and status in ('draft','pending','adopted','archived')
    and exists (select 1 from public.profiles p
                where p.id = auth.uid() and p.publisher_status = 'approved')
  );

drop policy if exists photos_write on public.cat_photos;
create policy photos_write on public.cat_photos for all
  using (exists (
    select 1 from public.cats c
    where c.id = cat_id
      and (public.is_admin() or (
        c.owner_id = auth.uid()
        and exists (select 1 from public.profiles p
                    where p.id = auth.uid() and p.publisher_status = 'approved')
      ))
  ))
  with check (exists (
    select 1 from public.cats c
    where c.id = cat_id
      and (public.is_admin() or (
        c.owner_id = auth.uid()
        and exists (select 1 from public.profiles p
                    where p.id = auth.uid() and p.publisher_status = 'approved')
      ))
  ));

-- Bound attacker-controlled text even when PostgREST is called directly.
alter table public.profiles
  add constraint profiles_text_lengths check (
    char_length(full_name) <= 100
    and (phone is null or char_length(phone) <= 30)
    and (city is null or char_length(city) <= 100)
  ) not valid;

alter table public.adopter_profiles
  add constraint adopter_text_lengths check (
    (city is null or char_length(city) <= 100)
    and (household_desc is null or char_length(household_desc) <= 1000)
    and (other_pets_desc is null or char_length(other_pets_desc) <= 1000)
    and (vet_clinic is null or char_length(vet_clinic) <= 200)
    and (adoption_reason is null or char_length(adoption_reason) <= 2000)
    and (surrender_circumstances is null or char_length(surrender_circumstances) <= 2000)
  ) not valid;

alter table public.cats
  add constraint cats_text_and_value_limits check (
    (city is null or char_length(city) <= 100)
    and char_length(description) <= 5000
    and (health_notes is null or char_length(health_notes) <= 3000)
    and (special_needs is null or char_length(special_needs) <= 2000)
    and (not is_special or nullif(btrim(special_needs), '') is not null)
    and (fee_amount is null or fee_amount <= 10000)
  ) not valid,
  add constraint cats_video_path_format check (
    video_path is null or video_path ~* (
      '^' || id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-video(\.(mp4|webm|mov))?$'
    )
  ) not valid;

alter table public.cat_photos
  add constraint cat_photos_path_format check (
    path_card ~* (
      '^' || cat_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-card\.webp$'
    )
    and path_full ~* (
      '^' || cat_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-full\.webp$'
    )
    and regexp_replace(path_card, '-card\.webp$', '') = regexp_replace(path_full, '-full\.webp$', '')
    and sort_order between 0 and 5
  ) not valid;

alter table public.adoption_requests
  add constraint adoption_request_text_lengths check (
    char_length(message) <= 2000
    and (admin_note is null or char_length(admin_note) <= 2000)
  ) not valid;

alter table public.moderation_log
  add constraint moderation_reason_length check (
    reason is null or char_length(reason) <= 2000
  ) not valid;

-- Private storage prevents unapproved uploads from being shared by URL. The app
-- issues short-lived signed links only after this RLS check succeeds.
update storage.buckets
set public = false,
    file_size_limit = 26214400,
    allowed_mime_types = array['image/webp','video/mp4','video/webm','video/quicktime']
where id = 'cat-photos';

drop policy if exists storage_public_read on storage.objects;
drop policy if exists storage_media_read on storage.objects;
create policy storage_media_read on storage.objects for select
  using (
    bucket_id = 'cat-photos'
    and exists (
      select 1 from public.cats c
      where c.id::text = (storage.foldername(objects.name))[1]
        and (c.status = 'published' or c.owner_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists storage_owner_insert on storage.objects;
create policy storage_owner_insert on storage.objects for insert
  with check (
    bucket_id = 'cat-photos'
    and auth.role() = 'authenticated'
    and (
      (
        objects.name ~* '^[0-9a-f-]{36}/[0-9a-f-]{36}-(card|full)\.webp$'
        and lower(coalesce(objects.metadata->>'mimetype', '')) = 'image/webp'
        and coalesce((objects.metadata->>'size')::bigint, 0) between 1 and 4194304
      )
      or (
        objects.name ~* '^[0-9a-f-]{36}/[0-9a-f-]{36}-video\.(mp4|webm|mov)$'
        and lower(coalesce(objects.metadata->>'mimetype', '')) in ('video/mp4','video/webm','video/quicktime')
        and coalesce((objects.metadata->>'size')::bigint, 0) between 1 and 26214400
      )
    )
    and exists (
      select 1 from public.cats c
      where c.id::text = (storage.foldername(objects.name))[1]
        and (public.is_admin() or (
          c.owner_id = auth.uid()
          and exists (select 1 from public.profiles p
                      where p.id = auth.uid() and p.publisher_status = 'approved')
        ))
    )
  );

drop policy if exists storage_owner_delete on storage.objects;
create policy storage_owner_delete on storage.objects for delete
  using (
    bucket_id = 'cat-photos'
    and exists (
      select 1 from public.cats c
      where c.id::text = (storage.foldername(objects.name))[1]
        and (c.owner_id = auth.uid() or public.is_admin())
    )
  );
