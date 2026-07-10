---
name: image-upload-pipeline
description: Photo upload, client-side compression, variants, previews, ordering, and serving cat images. Load for the cat-upload wizard, any photo editing/deleting, catalog image performance, and any bug that involves an image looking wrong, sideways, slow, or missing.
---

# Image Upload Pipeline

Photos are the product. This pipeline makes mediocre phone photos load fast and keeps
Supabase free-tier egress (5GB/month) sustainable. Do not "simplify" it away.

## Client-side processing (before any upload)
1. Accept jpg/png/webp/heic · max 6 photos per cat · first photo = cover (reorderable).
2. Decode with `createImageBitmap(file, { imageOrientation: 'from-image' })` — this applies EXIF rotation. Skip it and Android/desktop users get sideways cats.
3. HEIC (iPhone default): browsers can't decode it — detect by type/extension and convert with `heic2any` (dynamic import; it's heavy) before step 2.
4. Re-encode through canvas to WebP — canvas re-encode also strips EXIF, including GPS. That's a privacy requirement: publishers' photos must not leak home coordinates.
5. Generate **two variants** per photo:
   - `card`: max edge 480px, q≈0.78 (~40–70KB) — used in every grid
   - `full`: max edge 1600px, q≈0.82 (~150–300KB) — cat detail page only
6. Process files **sequentially**, never `Promise.all` — parallel canvas work on six 12MP photos crashes mobile tabs.

## Upload
- Paths: `{cat_id}/{crypto.randomUUID()}-card.webp` + `...-full.webp`, bucket `cat-photos`, `upsert: false`.
- After both variants upload, a server action inserts the `cat_photos` row `{cat_id, path_card, path_full, sort_order}`.
- Per-file progress; a failed file retries alone — never restart the whole batch.
- Deleting a photo (or a cat) must delete BOTH storage objects in the same action — orphans cost storage forever.

## Serving
- Grids use the card variant only, via `next/image` with an accurate `sizes` attr (e.g. `(max-width:640px) 50vw, 25vw`). A wrong `sizes` silently fetches full-width images = egress ×4.
- Detail page uses full variants; first image `priority`, rest lazy.
- `next.config`: `images.remotePatterns` for `*.supabase.co`. Do NOT use Supabase's render/transform API — it's Pro-only; variants are pre-generated instead (see ARCHITECTURE decision log).
- Covers lock to 4:3 with `object-cover` — mixed ratios wreck the grid.

## UX details
- Previews via `URL.createObjectURL`; revoke on unmount/removal (wizard back-and-forth leaks memory otherwise).
- Reorder writes `sort_order` 0..n; `0` is the cover.
- Empty slot shows the coaching tip from DESIGN.md §6 ("תמונה בגובה עיני החתול...").
- Reject files >12MB pre-compression with a Hebrew message instead of hanging.

## Gotchas
- `canvas.toBlob(cb, 'image/webp', q)` returns null on old Safari (<16.4) — fall back to jpeg when null.
- Disable the upload button during processing — double-taps create duplicates.
- Keep `upsert: false`: uuid names make collisions impossible, so a collision means a bug you want to see.

## Done checklist
- [ ] EXIF orientation applied, GPS stripped, HEIC handled
- [ ] Two variants generated; grids provably use `card`
- [ ] Sequential processing, per-file retry
- [ ] Deletes remove both storage objects
