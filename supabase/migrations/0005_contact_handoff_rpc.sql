-- 0005_contact_handoff_rpc.sql — Secure counterpart contact handoff RPC
-- Pins search_path to public and runs as security definer owned by postgres.

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
begin
  -- get request and cat owner details
  select r.adopter_id, c.owner_id, r.status
  into v_adopter_id, v_owner_id, v_status
  from public.adoption_requests r
  join public.cats c on r.cat_id = c.id
  where r.id = request_id;

  -- verify that the request is approved
  if v_status is distinct from 'approved' then
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

grant execute on function public.get_handoff_contact(uuid) to authenticated;
