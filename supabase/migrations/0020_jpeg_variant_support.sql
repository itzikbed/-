-- 0020_jpeg_variant_support.sql
-- Photo upload failed for every visitor on an iPhone, and had since the mime
-- allowlist landed in 0008. The browser builds the two stored variants with
-- canvas.toBlob('image/webp'); WebKit has no WebP encoder, and the HTML spec
-- tells it to quietly fall back to image/png rather than fail, so Safari (and
-- Chrome and Firefox on iOS, which are all WebKit) handed Storage a PNG under a
-- .webp name. The bucket rejected it: InvalidMimeType, "mime type image/png is
-- not supported", surfaced to the publisher as a bare "something went wrong".
--
-- The client now asks the canvas what it actually produced and falls back to
-- JPEG — the one raster container every browser is required to encode — naming
-- the file for the container it really is. This widens the closed allowlist of
-- stored image containers from one safe raster format to two; the magic-byte
-- check in lib/security/verify-stored-media.ts still ties each stored object to
-- the extension it is named for, so extension spoofing stays shut.

-- 1. Let the bucket accept the fallback container.
update storage.buckets
set allowed_mime_types = array['image/webp','image/jpeg','video/mp4','video/webm','video/quicktime']
where id = 'cat-photos';

-- 2. Same grammar for the upload policy. Everything else in the policy — the
-- owner, approved-publisher and not-yet-published conditions from 0011 — is
-- carried over unchanged.
drop policy if exists storage_owner_insert on storage.objects;
create policy storage_owner_insert on storage.objects for insert
  with check (
    bucket_id = 'cat-photos'
    and auth.role() = 'authenticated'
    and (
      objects.name ~* '^[0-9a-f-]{36}/[0-9a-f-]{36}-(card|full)\.(webp|jpg)$'
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

-- 3. Same grammar for the row-level path constraint from 0008. The card and
-- full variants still have to be the same photo: one uuid, one container.
alter table public.cat_photos
  drop constraint if exists cat_photos_path_format;

alter table public.cat_photos
  add constraint cat_photos_path_format check (
    path_card ~* (
      '^' || cat_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-card\.(webp|jpg)$'
    )
    and path_full ~* (
      '^' || cat_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-full\.(webp|jpg)$'
    )
    -- Collapsing only the role leaves the uuid and the extension in place, so
    -- this one comparison pins both: same photo, same container.
    and regexp_replace(path_card, '-card\.', '-.') = regexp_replace(path_full, '-full\.', '-.')
    and sort_order between 0 and 5
  ) not valid;
