-- 0006_contact_handoff_privileges.sql
-- Revokes public/anon execute privilege on the handoff function and sets postgres as owner.

revoke execute on function public.get_handoff_contact(uuid) from public, anon;
alter function public.get_handoff_contact(uuid) owner to postgres;
