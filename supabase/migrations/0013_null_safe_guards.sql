-- 0013_null_safe_guards.sql
-- Close a three-valued-logic hole in the privilege guards: when a session has NO JWT
-- claims at all (psql / dashboard SQL editor), auth.role() is NULL, so expressions like
-- `not is_admin()` evaluate to NULL and the guard silently passes instead of raising.
-- Not remotely exploitable (every PostgREST request carries claims), but the guards
-- must be deterministic for direct-SQL sessions too. First-admin bootstrap in
-- production goes through the documented set_config('request.jwt.claims', ...) path
-- (docs/deploy-runbook.md).

-- 1. is_admin(): never NULL
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    auth.role() = 'service_role'
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'),
    false
  );
$$;

-- 2. guard_profile_privileges: trusted_actor never NULL
create or replace function public.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  trusted_actor boolean := coalesce(public.is_admin() or auth.role() = 'service_role', false);
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
