-- 0009_storage_insert_policy_fix.sql
-- Storage populates objects.metadata after its INSERT authorization check. Keep
-- extension/path checks in RLS and enforce MIME/size through storage.buckets.

drop policy if exists storage_owner_insert on storage.objects;
create policy storage_owner_insert on storage.objects for insert
  with check (
    bucket_id = 'cat-photos'
    and auth.role() = 'authenticated'
    and (
      objects.name ~* '^[0-9a-f-]{36}/[0-9a-f-]{36}-(card|full)\.webp$'
      or objects.name ~* '^[0-9a-f-]{36}/[0-9a-f-]{36}-video\.(mp4|webm|mov)$'
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

