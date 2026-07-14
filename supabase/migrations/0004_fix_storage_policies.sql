-- 0004: fix storage RLS owner policies (2026-07-14, architect).
-- In 0001 the EXISTS subquery used unqualified `name`; because cats also has a
-- `name` column it resolved to c.name, so the check compared c.id::text to
-- storage.foldername(<cat's display name>) and never passed — every
-- authenticated photo/video upload and delete was rejected in all environments.
-- Qualify the column as objects.name.

drop policy if exists storage_owner_insert on storage.objects;
create policy storage_owner_insert on storage.objects for insert
  with check (
    bucket_id = 'cat-photos' and auth.role() = 'authenticated'
    and exists (select 1 from public.cats c
                where c.id::text = (storage.foldername(objects.name))[1]
                  and (c.owner_id = auth.uid() or public.is_admin()))
  );

drop policy if exists storage_owner_delete on storage.objects;
create policy storage_owner_delete on storage.objects for delete
  using (
    bucket_id = 'cat-photos'
    and exists (select 1 from public.cats c
                where c.id::text = (storage.foldername(objects.name))[1]
                  and (c.owner_id = auth.uid() or public.is_admin()))
  );
