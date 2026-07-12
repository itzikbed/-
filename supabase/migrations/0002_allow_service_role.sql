-- 0002_allow_service_role.sql
-- Allow service_role to modify profile privileges during seeding or admin scripts.

create or replace function public.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role
      or new.publisher_status is distinct from old.publisher_status)
     and not public.is_admin()
     and auth.role() is distinct from 'service_role' then
    raise exception 'changing role/publisher_status requires admin';
  end if;
  return new;
end; $$;
