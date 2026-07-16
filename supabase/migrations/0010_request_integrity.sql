-- 0010_request_integrity.sql
-- Enforce request creation defaults, restrict non-admin updates, validate adopter completion, and harden handoff RPC.

-- 0. Redefine is_admin to recognize service_role
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.role() = 'service_role' or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- 1. Recreate requests_insert policy
drop policy if exists requests_insert on public.adoption_requests;
create policy requests_insert on public.adoption_requests for insert
  with check (
    adopter_id = auth.uid()
    and exists (select 1 from public.adopter_profiles ap
                where ap.user_id = auth.uid() and ap.completed_at is not null)
    and exists (select 1 from public.cats c where c.id = cat_id and c.status = 'published')
    and status = 'pending'
    and admin_note is null
    and decided_by is null
    and decided_at is null
  );

-- 2. Trigger function to guard adoption requests update (non-admins)
create or replace function public.guard_request_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    -- Non-admins can only change status from 'pending' to 'withdrawn'
    if not (old.status = 'pending' and new.status = 'withdrawn') then
      raise exception 'invalid request update status transition';
    end if;

    -- All other columns must remain unchanged
    if new.id is distinct from old.id
       or new.cat_id is distinct from old.cat_id
       or new.adopter_id is distinct from old.adopter_id
       or new.message is distinct from old.message
       or new.admin_note is distinct from old.admin_note
       or new.decided_by is distinct from old.decided_by
       or new.decided_at is distinct from old.decided_at
       or new.created_at is distinct from old.created_at then
      raise exception 'non-admin update cannot modify other request fields';
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists trg_request_update_guard on public.adoption_requests;
create trigger trg_request_update_guard before update on public.adoption_requests
  for each row execute function public.guard_request_update();

-- 3. Trigger function to validate adopter profile completion
create or replace function public.guard_adopter_completion()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.completed_at is not null then
    if new.age is null or new.age < 18
       or new.city is null or nullif(btrim(new.city), '') is null
       or new.household_desc is null or nullif(btrim(new.household_desc), '') is null
       or new.floor_type is null or nullif(btrim(new.floor_type), '') is null
       or new.adoption_reason is null or nullif(btrim(new.adoption_reason), '') is null
       or new.surrender_circumstances is null or nullif(btrim(new.surrender_circumstances), '') is null
       or new.has_other_pets is null
       or new.has_cat_experience is null
       or new.has_window_screens is null then
      raise exception 'cannot complete profile with missing questionnaire answers';
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists trg_adopter_completion_guard on public.adopter_profiles;
create trigger trg_adopter_completion_guard before insert or update on public.adopter_profiles
  for each row execute function public.guard_adopter_completion();

-- 4. Harden get_handoff_contact RPC
create or replace function public.get_handoff_contact(request_id uuid)
returns table (full_name text, phone text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_adopter_id uuid;
  v_owner_id uuid;
  v_status text;
  v_decided_by uuid;
begin
  -- get request and cat owner details
  select r.adopter_id, c.owner_id, r.status, r.decided_by
  into v_adopter_id, v_owner_id, v_status, v_decided_by
  from public.adoption_requests r
  join public.cats c on r.cat_id = c.id
  where r.id = request_id;

  -- verify that the request is approved and decided_by is an admin
  if v_status is distinct from 'approved'
     or v_decided_by is null
     or not exists (select 1 from public.profiles p where p.id = v_decided_by and p.role = 'admin') then
    return;
  end if;

  -- check if current user is adopter
  if auth.uid() = v_adopter_id then
    return query
    select p.full_name, p.phone
    from public.profiles p
    where p.id = v_owner_id;
  -- check if current user is owner
  elsif auth.uid() = v_owner_id then
    return query
    select p.full_name, p.phone
    from public.profiles p
    where p.id = v_adopter_id;
  end if;
end;
$$;
