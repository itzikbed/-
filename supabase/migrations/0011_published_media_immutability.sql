-- 0011_published_media_immutability.sql
-- Enforce media immutability on published listings, restrict storage reads to referenced records, and auto-reject sibling requests on adoption/archival.

-- 1. Recreate photos_write policy to block owners from modifying media of published cats
drop policy if exists photos_write on public.cat_photos;
create policy photos_write on public.cat_photos for all
  using (exists (
    select 1 from public.cats c
    where c.id = cat_id
      and (public.is_admin() or (
        c.owner_id = auth.uid()
        and c.status <> 'published'
        and exists (select 1 from public.profiles p
                    where p.id = auth.uid() and p.publisher_status = 'approved')
      ))
  ))
  with check (exists (
    select 1 from public.cats c
    where c.id = cat_id
      and (public.is_admin() or (
        c.owner_id = auth.uid()
        and c.status <> 'published'
        and exists (select 1 from public.profiles p
                    where p.id = auth.uid() and p.publisher_status = 'approved')
      ))
  ));

-- 2. Recreate storage_owner_insert to block uploading objects to published cats' folders
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
          and c.status <> 'published'
          and exists (select 1 from public.profiles p
                      where p.id = auth.uid() and p.publisher_status = 'approved')
        ))
    )
  );

-- 3. Recreate storage_owner_delete to block deleting objects of published cats
drop policy if exists storage_owner_delete on storage.objects;
create policy storage_owner_delete on storage.objects for delete
  using (
    bucket_id = 'cat-photos'
    and exists (
      select 1 from public.cats c
      where c.id::text = (storage.foldername(objects.name))[1]
        and (public.is_admin() or (
          c.owner_id = auth.uid()
          and c.status <> 'published'
        ))
    )
  );

-- 4. Recreate storage_media_read to restrict select access to referenced records only
drop policy if exists storage_media_read on storage.objects;
create policy storage_media_read on storage.objects for select
  using (
    bucket_id = 'cat-photos'
    and (
      public.is_admin()
      or
      exists (
        select 1 from public.cats c
        where c.id::text = (storage.foldername(objects.name))[1]
          and c.owner_id = auth.uid()
      )
      or
      exists (
        select 1 from public.cats c
        where c.id::text = (storage.foldername(objects.name))[1]
          and c.status = 'published'
          and (
            exists (
              select 1 from public.cat_photos cp
              where cp.cat_id = c.id
                and (cp.path_card = objects.name or cp.path_full = objects.name)
            )
            or (
              c.video_path is not null
              and objects.name like c.video_path || '%'
            )
          )
      )
    )
  );

-- 5. Trigger function to auto-reject sibling requests on adoption/archival
create or replace function public.handle_cat_status_transition()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (old.status = 'published' and new.status in ('adopted', 'archived')) then
    update public.adoption_requests
    set status = 'rejected',
        admin_note = 'המודעה כבר אינה זמינה',
        decided_at = now()
    where cat_id = new.id and status = 'pending';
  end if;
  return new;
end; $$;

drop trigger if exists trg_cat_status_transition on public.cats;
create trigger trg_cat_status_transition after update on public.cats
  for each row execute function public.handle_cat_status_transition();
