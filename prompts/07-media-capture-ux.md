# PROMPT 07 — Capture guidance + photo crop & rotate (§12 phase 8)

> **STATUS: EXECUTED BY THE ARCHITECT, 2026-07-19 — DO NOT RUN.** Kept for the
> record. Implementation deviated from E4 as specced (consent moved to the
> save boundary; no server action) and from E2 (cropper receives a pre-rotated
> preview) — ARCHITECTURE.md §11 (2026-07-19) is the authoritative account.

**Runs only after prompt 06 is closed and architect-approved.** Read
`00-orchestrator.md`, then ARCHITECTURE.md end-to-end and DESIGN.md. Skills:
`image-upload-pipeline`, `forms-and-wizards`, `rtl-hebrew-webapp`, `code-quality`,
plus `supabase-fullstack` for item E4.

Two client-requested features, both living in the publish wizard's media step
(`components/cats/UploadStep4.tsx`): (1) shooting guidance — lighting, distance,
background, video length — shown where publishers actually upload; (2) crop &
rotate for photos.

## Binding constraints (violations fail the review)

1. NEVER add a `loading.tsx` (or a new streamed Suspense boundary) on `/` or
   `/cats` (ARCHITECTURE §10–§11 — breaks production hydration).
2. Verify every milestone against the production build (`npm run build` +
   `npm run start` on :3000/:3001 — :3100 is reserved for the architect). Prove
   interactivity, not screenshots.
3. `prompts/`, `skills/`, `scripts/checks/` are READ-ONLY.
4. `scripts/rls-smoke.mjs` TEST 12 asserts exactly 12 published cats — keep it
   true or update it in the same commit, stated in the report.
5. One commit per item (G1, E1–E4). Commit locally; do NOT push to the remote —
   the site is live in production and the architect reviews before deploying.
6. NO parallel sub-agents in this prompt: both tracks touch
   `components/cats/UploadStep4.tsx`, `components/cats/PhotoUploadGrid.tsx` and
   `content/he/ui.json`. Run Track G, then Track E, in one lane.
7. Public-page budget: zero new JS on `/`, `/cats`, `/cats/[id]`. Everything
   here is inside the authenticated publish wizard, and the crop editor itself
   loads via dynamic import only when the dialog first opens (prove with a
   network check + build-output comparison).
8. All user-facing text goes in `content/he/ui.json` under `publish.*`. The
   Hebrew strings below are client-facing copy written by the architect — use
   them verbatim; no literals in TSX.

## Architect decisions — do not re-decide, do not expand

- Guidance is a **coaching panel in the media step**, not a live camera overlay.
  No `getUserMedia`, and do NOT add the `capture` attribute to any file input
  (it blocks gallery selection on some Android browsers).
- Crop & rotate applies to **photos only**. The raw-video policy (Phase 3) and
  the video limits (≤15s, ≤25MB) are unchanged.
- Editing entry point: an edit button on each uploaded thumbnail. The editor
  does NOT auto-open during batch upload — the sequential upload pipeline stays
  exactly as the `image-upload-pipeline` skill specifies.
- Editor source: download the photo's `path_full` via the **authenticated**
  supabase client (`storage.from('cat-photos').download(...)`) — the owner
  branch of `storage_media_read` (migration 0011) allows reading the own cat's
  folder regardless of status. Never `/api/media`, never the stale `localUrl`.
- Edited output = a NEW `{catId}/{uuid}-card.webp` + `-full.webp` pair (the
  path regexes in `lib/security/media.ts` are law; `upsert: false` stays).
- Old-pair cleanup after a successful edit: if the photo already has a DB row
  (`id` present — the edit page), LEAVE the old objects in storage — rows still
  reference them until submit rewrites `cat_photos`, and
  `scripts/cleanup-orphan-media.mjs` sweeps orphans later. If it has no row yet
  (uploaded this session), delete the old pair immediately.
- Rotation in 90° steps only, both directions. Drag reposition + zoom
  (pinch/wheel AND buttons). Free aspect ratio — no presets in v1.
- New dependency **authorized: `react-easy-crop`** (MIT, small, no runtime
  deps). Verify it declares React 19 peer support BEFORE installing; if it does
  not, STOP the item and report — no `--legacy-peer-deps`, no substitute
  library without architect approval. Add an ARCHITECTURE §11 decision line.
- Published-listing media (E4): migration 0011 makes a published cat's media
  immutable for owners — which is why add/remove photo on
  `/publish/edit/[id]` of a published cat already fails with a raw storage
  error today. The product answer is an explicit, confirmed "unpublish to
  edit" step that flips `published → pending` — the same transition submit
  performs anyway. The `guard_cat_owner_mutation` trigger (0008) already
  permits owner `published → pending`; **no new migration is needed** — the
  fix is app-level only.

## Track G — shooting-guidance panel

### G1 — CaptureTipsPanel

New `components/cats/CaptureTipsPanel.tsx` (client component), mounted in
`UploadStep4` above `PhotoUploadGrid`:

- Collapsible panel: a header toggle button (`aria-expanded` + `aria-controls`,
  ≥44px target, chevron) revealing a list of 4 tips, each with a lucide icon
  (suggested: Sun, Maximize2, LayoutGrid, Film) and one string.
- First-ever visit: the panel opens automatically. Use a localStorage flag,
  read AND written inside `useEffect` so the SSR markup is stable (initial
  markup renders collapsed; only first-time visitors see it expand). Persist
  the user's last open/closed choice on subsequent toggles.
- Design per DESIGN.md: warm surface card (`rounded-input`, `border-border`,
  surface tones, pine accents), `text-ink`/`text-ink-soft`, and NO physical
  direction classes. The existing `photosCoaching` and `videoCoaching` lines
  stay where they are.
- Strings (exact values, keys under `publish.*`):
  - `captureTipsToggle`: "טיפים לצילום מוצלח"
  - `captureTipsLight`: "תאורה: צלמו באור יום, ליד חלון או בחוץ. בלי פלאש — הוא מבהיל את החתול ויוצר עיניים זוהרות."
  - `captureTipsDistance`: "מרחק: התקרבו ורדו לגובה העיניים של החתול, כך שהחתול ממלא את רוב התמונה."
  - `captureTipsBackground`: "רקע: בחרו פינה נקייה ורגועה — רצפה, ספה או קיר חלק, בלי חפצים שמסיחים את העין."
  - `captureTipsVideo`: "סרטון: צילום אחד רציף של 8–15 שניות שבו החתול פעיל — משחק, מתחכך, אוכל. בלי מוזיקה ובלי כתוביות."

## Track E — photo crop & rotate

### E1 — crop math + processing refactor

- New `lib/utils/crop-math.ts`: pure geometry — given the source dimensions,
  react-easy-crop's `croppedAreaPixels`, and a rotation (0/90/180/270), return
  the canvas geometry (rotated bounding box, draw offsets, output size).
  **Vitest unit tests** covering all four rotations and edge-touching crops
  (pure math only — jsdom has no real canvas).
- `lib/utils/image-processing.ts`: extract the variant-generation core so the
  existing `processImageFile` (behavior unchanged — its current outputs must
  stay byte-compatible in dimensions/quality) and a new
  `processEditedImage(source: Blob, edit: { croppedAreaPixels, rotation })`
  share it. `processEditedImage` decodes with `createImageBitmap` (the source
  is an already-stored webp — EXIF/GPS were stripped on first upload; no HEIC
  path here), applies rotation + crop on canvas per crop-math, and produces
  the same card (480px, q≈0.78) / full (1600px, q≈0.82) pair. eslint
  `max-lines` 220: split modules, never raise the limit.

### E2 — PhotoCropDialog

- New `components/cats/PhotoCropDialog.tsx`, reusing `components/ui/Dialog.tsx`
  (do NOT fork a second dialog primitive — focus trap, Esc, `role="dialog"`
  come from it). Content: react-easy-crop area (free aspect, drag + pinch/wheel
  zoom) and controls: rotate-right, rotate-left (90° steps), zoom-in/zoom-out
  buttons (keyboard users must be able to zoom without a wheel), cancel, and
  apply with a busy state while processing/uploading. All controls are real
  `<button>`s with Hebrew `aria-label`s, ≥44px targets.
- react-easy-crop (and the dialog body that imports it) load via dynamic
  import so the chunk is fetched only when the dialog first opens.
- Strings (exact values, keys under `publish.*`):
  - `editPhoto`: "עריכת תמונה"
  - `cropDialogTitle`: "חיתוך וסיבוב התמונה"
  - `rotateRight`: "סיבוב ימינה" · `rotateLeft`: "סיבוב שמאלה"
  - `zoomIn`: "התקרבות" · `zoomOut`: "התרחקות"
  - `cropApply`: "שמירת התמונה" · `cropCancel`: "ביטול"
  - `cropSaving`: "שומר את התמונה..."
  - `cropLoadError`: "שגיאה בטעינת התמונה לעריכה. נסו שוב."
  - `cropSaveError`: "שגיאה בשמירת התמונה הערוכה. נסו שוב."

### E3 — wiring in the grid

- `PhotoUploadGrid`: add an edit (pencil) button to each thumbnail's overlay
  next to move/delete (disabled while `isProcessing`), opening PhotoCropDialog
  for that photo.
- Apply flow: authenticated `download(path_full)` → editor → on apply:
  `processEditedImage` → upload the new card+full pair (`contentType:
  'image/webp'`, `upsert: false`) → old-pair cleanup per the architect rule →
  update wizard state: new paths, a fresh `URL.createObjectURL` of the new
  card blob as `localUrl` (revoke the previous one), `sort_order` and cover
  semantics untouched → close the dialog. Errors surface in the existing
  `uploadError` alert area.
- Both wizard flows must work: new-cat (photos without DB rows) and the edit
  page (photos with rows). `validateCatMedia` on submit must pass with the
  edited paths — prove it end-to-end, don't assume it.

### E4 — published-listing media unlock

- New server action `unpublishForMediaEditAction(catId)` (mind `max-lines` —
  `cat-status-actions.ts` is near the limit; a new file is fine): uuid check,
  authz owner-or-admin (same pattern as `markAsAdoptedAction`), optimistic
  guard `.eq('status', 'published')`, sets `status = 'pending'`, revalidates
  `/`, `/cats`, `/cats/[id]`, `/publish/my-cats`. It can only ever move
  published → pending.
- Media step UI: when the edited cat's status is `published` (the edit page
  already fetches it — pass it down), ALL media mutations (add/remove/edit
  photo, add/remove video) are locked behind a notice + confirm button;
  confirming runs the action and unlocks the controls. Other statuses see no
  notice and no behavior change.
- Strings (exact values, keys under `publish.*`):
  - `mediaEditLockedNotice`: "המודעה מפורסמת כרגע באתר. עריכת תמונות או סרטון תוריד אותה זמנית מהאתר, עד אישור מחדש של מנהל."
  - `mediaEditUnlockBtn`: "אישור והמשך לעריכה"
  - `mediaEditUnlockError`: "שגיאה בפתיחת המודעה לעריכה. רעננו את הדף ונסו שוב."
- `scripts/rls-smoke.mjs`: add a test proving (a) an owner CAN flip their
  published cat to `pending`, and (b) an owner still CANNOT set `published`,
  `draft`, or moderation-owned columns on it via direct update. Leave the DB
  in the seeded state (TEST 12 invariant).

### E5 — production verification (no commit; evidence goes in the report)

- Production build, mobile 390 + desktop 1280: full journey — upload a photo →
  edit it (crop + one 90° rotation) → grid preview updates → submit → admin
  approves → the detail page serves the EDITED full variant (verify by decoded
  dimensions/aspect, not by success toasts).
- Edit-page journey on a published cat: notice shown → confirm → cat drops off
  `/cats` → media edit now works → submit → re-approve.
- Keyboard-only pass of the dialog (open, rotate, zoom, apply, Esc). 320px
  width pass on the media step.
- Network proof that the cropper chunk loads only when the dialog opens, and a
  build-output comparison showing no public-page bundle grew.

## Done checklist

- [ ] Tips panel: 4 tips verbatim, collapsible, first-visit auto-open,
      `aria-expanded`/`aria-controls`, DESIGN-compliant, RTL-clean
- [ ] Crop math unit-tested; `processImageFile` behavior unchanged
- [ ] Edited photos become new uuid pairs; cleanup rule followed; regex
      conventions in `lib/security/media.ts` untouched and still satisfied
- [ ] Published-cat unlock works for owner AND admin; new rls-smoke assertions
      green; TEST 12 invariant intact
- [ ] Cropper chunk lazy-loads; zero public-page bundle growth
- [ ] `npm run gate` + `npm run check:rls` + `npm run build` all green; one
      commit per item, nothing uncommitted, nothing pushed
- [ ] ARCHITECTURE.md updated in-session: §3 map for new files, §11 lines
      (react-easy-crop dependency; published-media unlock decision), §12 row 8

## Report (Hebrew, mandatory)

Per-item table (G1, E1–E5 → done/blocked + why), raw `npm run gate` and
`npm run check:rls` outputs, test credentials, and screenshots: tips panel open
+ closed (mobile), the crop dialog, before/after of an edited photo on the live
detail page, and the published-cat unlock notice. State explicitly how you
proved the cropper chunk lazy-loads and that public bundles did not grow.
