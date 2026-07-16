-- 0015_request_open_cap.sql
-- Cap concurrent open (pending) adoption requests at 3 per adopter.
-- Defense in depth: the app action also checks this, but only the DB is authoritative.

create or replace function public.guard_request_open_cap()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  open_count integer;
begin
  if coalesce(auth.role() = 'service_role', false) then
    return new;
  end if;

  -- Serialize per-adopter so concurrent inserts cannot race past the cap.
  perform pg_advisory_xact_lock(hashtext('request_open_cap:' || new.adopter_id::text));

  select count(*) into open_count
  from public.adoption_requests
  where adopter_id = new.adopter_id
    and status = 'pending';

  if open_count >= 3 then
    raise exception 'open request cap reached (max 3 pending requests per adopter)';
  end if;

  return new;
end; $$;

drop trigger if exists trg_request_open_cap on public.adoption_requests;
create trigger trg_request_open_cap before insert on public.adoption_requests
  for each row execute function public.guard_request_open_cap();
