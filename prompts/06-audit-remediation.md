# PROMPT 06 — External-audit remediation (§12 phase 7)

**Runs only after prompt 05 is closed and architect-approved.** Read
`00-orchestrator.md`, then `SITE_AUDIT_REPORT.md` (workspace root — an external
read-only audit, 2026-07-15). This prompt is the architect's triage of that report:
it contains ONLY the findings that prompt 05 does not already resolve. Where this
prompt and the report disagree, this prompt wins. Skills: `supabase-fullstack`,
`code-quality`, `rtl-hebrew-webapp`, `forms-and-wizards`, `catalog-and-filters`,
`image-upload-pipeline`, plus any skill matching a file you touch.

## Binding constraints (same as prompt 05 — violations fail the review)

1. NEVER add a `loading.tsx` (or new streamed Suspense boundary) on `/` or `/cats`
   (ARCHITECTURE.md §10–§11 — breaks production hydration). `error.tsx` /
   `global-error.tsx` are fine and are required below.
2. Verify every milestone against the production build. Prove interactivity, not
   screenshots.
3. `prompts/`, `skills/`, `scripts/checks/` are READ-ONLY. Servers on :3000/:3001.
4. `scripts/rls-smoke.mjs` TEST 12 asserts exactly 12 published cats — keep it true
   or update it in the same commit, stated in the report.
5. One commit per item (S1, S2, … as below). Report: raw `npm run gate` +
   `npm run check:rls` output, test credentials, and a mapping table
   `audit ID → item → fixed/skipped/deferred`.

## Triage — audit findings you must NOT act on

- **Covered by prompt 05 (do not duplicate):** SEO-01, SEO-06, most of SEO-02
  (sitemap/robots), A11Y-09 (contrast), A11Y-11 (alt texts), SEC-13 and the
  CAPTCHA/MFA/email-confirmation parts of SEC-05 (SECURITY.md launch checklist,
  executed with Itzik), UX-18's Hebrew-literals part, REL-01's logging-silence part
  (prompt 05 Track D item 8).
- **Intentional design — do not "fix":** UX-08. The video policy is deliberate
  (Phase 3, architect-approved): path WITH extension ⇒ raw upload ⇒ plays on the
  detail page only, no catalog live-card; extensionless ⇒ optimized pair ⇒ catalog
  autoplay. The live-card feature is for optimized assets only.
- **Decided by the architect (2026-07-16, authority delegated by Itzik — see
  ARCHITECTURE §11):** UX-12 → adopters must be 18+, no consent flow (item J9);
  UX-14 → adopted cats stay hidden at launch, showcase deferred (item Q10);
  UX-17 → process-true trust copy (item Q11); SEC-08 → video transcoding stays
  deferred for the ₪0 budget, upload-step privacy notice instead (item Q12).
- **Architect-accepted, document only (SECURITY.md residuals section):** SEC-16,
  SEC-18, PERF-12.

## Track S ∥ — Security at the database boundary (P0, release blockers)

### S1 — migration 0010: adoption-request integrity (SEC-01, SEC-09)

New migration `0010_request_integrity.sql`:

- Recreate `requests_insert` WITH CHECK adding: `status = 'pending'` and
  `admin_note is null and decided_by is null and decided_at is null`.
- `guard_request_update` trigger (BEFORE UPDATE, non-admins only — reuse the
  `public.is_admin()` pattern): the ONLY permitted non-admin change is
  `pending → withdrawn` with every other column unchanged
  (`IS NOT DISTINCT FROM` for each; raise exception otherwise).
- `guard_adopter_completion` trigger on `adopter_profiles` (INSERT/UPDATE):
  `completed_at` may be non-null only when the questionnaire's required fields are
  present — `age`, `city`, `household_desc`, `floor_type`, `adoption_reason`,
  `surrender_circumstances` non-null/non-empty and the boolean answers non-null.
- Harden `get_handoff_contact`: additionally require `r.decided_by is not null`
  AND `exists (select 1 from profiles p where p.id = r.decided_by and p.role =
  'admin')`. With the policies above, only an admin can ever set `decided_by`, so
  disclosure is now bound to an auditable admin decision.
- Verify `app/requests/actions.ts` + admin request actions still pass (they should
  — they already write pending/null fields; fix them if not, never the policy).

### S2 — migration 0011: published-listing media immutability (SEC-02)

- `cat_photos` owner INSERT/UPDATE/DELETE policies gain
  `and c.status <> 'published'` (admin policies unchanged).
- Storage owner write/delete policies on `cat-photos` bucket gain the same
  parent-cat condition.
- The legit edit flow already flips the cat to `pending` in the same action BEFORE
  touching media (`app/publish/cat-actions.ts` — update order: cats row first,
  then photos). Verify that order and keep it; adjust only if the new policies
  break the honest path.

### S3 — storage reads bound to approved records + orphan cleanup (SEC-03, SEC-06)

- Public/anon storage read policy: object must be REFERENCED — its `name` equals a
  `path_card`/`path_full` of a `cat_photos` row of a published cat, or begins with
  the published cat's `cats.video_path` value (covers the optimized/raw video
  derivatives). Owner/admin read policies unchanged.
- `app/api/media/route.ts`: before signing, verify the requested path is
  referenced by a `cat_photos`/`cats` row the caller's RLS lets them see (query
  with the user client, not just the path regex).
- New `scripts/cleanup-orphan-media.mjs`: service-role, localhost guard (copy the
  `bootstrap-admin.mjs` pattern), `--dry-run` default; lists bucket objects not
  referenced by any `cat_photos`/`cats.video_path` and older than 48h; `--delete`
  actually removes. Document in SECURITY.md as a periodic manual task.

### S4 — localhost guards on destructive scripts (SEC-04)

`scripts/seed-data.mjs` and `scripts/rls-smoke.mjs` refuse to run when
`NEXT_PUBLIC_SUPABASE_URL` is not localhost/127.0.0.1 (same guard as
`bootstrap-admin.mjs`).

### S5 — DB safety net for direct status flips (SEC-10)

AFTER UPDATE trigger on `cats`: on transition `published → adopted|archived`, set
that cat's still-`pending` `adoption_requests` to `rejected` with a neutral
`admin_note` (fixed Hebrew string in the migration, e.g. "המודעה כבר אינה זמינה"),
`decided_at = now()`. The app path (`closeSiblings`) still runs first and does the
gendered note + emails; the trigger is idempotent (touches only rows still
pending) and catches direct Data-API flips. rls-smoke: assert a direct owner
`published→adopted` update leaves no pending requests behind.

### S6 — moderation-log write is checked (SEC-11, bounded scope)

Admin actions (`cat-actions.ts`, `publisher-actions.ts`, `request-actions.ts`):
check the `moderation_log` insert result; on failure `console.error` loudly
(message only, no PII) — the decision itself stands. Document in SECURITY.md that
direct Data-API admin edits bypass logging (accepted residual).

### S7 — adversarial RLS tests (extends `scripts/rls-smoke.mjs`)

Inside the existing try/finally span: (a) insert request with `status='approved'`
rejected; (b) insert with `decided_by` set rejected; (c) withdraw that also tampers
`admin_note`/`cat_id` rejected; (d) setting `completed_at` on an incomplete
adopter profile rejected; (e) `cat_photos` insert on a published cat rejected for
owner; (f) storage upload into a published cat's folder rejected for owner;
(g) `get_handoff_contact` returns nothing for an approved row whose `decided_by`
is null (insert it via service role); (h) S5 trigger assertion. Cleanup intact.

## Track J ∥ — Broken user journeys (P0)

### J1 — auth preserves destination (UX-01)

Anon click on the cat-page CTA → `/login?redirect=/adopt/questionnaire?cat=<id>`
(and any guarded page sends its own return URL). Login honors it via the EXISTING
safe-redirect validator (Phase 4 — relative-path-only; do not write a new one).
Signup preserves the same `redirect` through submission and lands the user back on
the intended page. Login⇄signup links carry the param.

### J2 — questionnaire booleans are explicit (UX-02)

The client's safety questions must never default. Radio groups start unselected
(RHF `undefined`), schema requires an explicit boolean (Hebrew required message),
error wired per-field. Existing saved profiles load their stored values normally.
Keep the client's exact 10 questions — wording unchanged.

### J3 — "unknown" compatibility is honest (UX-04)

`good_with_cats`/`good_with_dogs`: wizard offers כן/לא/לא ידוע, stores `null` for
unknown (columns are already nullable), schema accepts null, detail page renders a
neutral "לא ידוע" state (not the negative phrasing), catalog filter behavior
unchanged (filters match only explicit `true` — verify against
`catalog-and-filters`).

### J4 — draft saving is genuinely partial (UX-03)

`draftCatSchema`: name required, everything else optional (keep type shape).
`upsertCatAction` returns `fieldErrors` for draft saves too, and the wizard
surfaces them on the owning fields instead of one generic failure.

### J5 — mobile navigation exists (UX-09) + one accessible dialog primitive (A11Y-01, A11Y-03)

Build ONE accessible modal primitive (upgrade `components/ui/Dialog.tsx`):
`role="dialog"`, `aria-modal`, `aria-labelledby`, initial focus, focus trap, focus
restoration, Escape, scroll lock, backdrop click. Reuse it for: (a) a new mobile
nav — hamburger button (visible `<md`, ≥44px, `aria-expanded`) opening a drawer
with all nav links + auth actions; (b) the catalog filter drawer
(`CatalogPageClient`); (c) `DecisionDialog`. RTL slide direction, reduced-motion
respected, mascot optional.

### J6 — errors are not empty states (UX-05, PERF-11)

Catalog, cat detail, requests, my-cats, admin queues: distinguish query error from
empty result — error state UI (Hebrew, retry link), never a silent empty list or
false 404. Add `app/error.tsx` + `app/global-error.tsx` (client components, Hebrew,
mascot, "נסו שוב"). Reminder: no new `loading.tsx` anywhere.

### J7 — publish page cannot load forever (UX-06)

Missing/slow profile ⇒ explicit Hebrew error with a retry action, not an infinite
skeleton.

### J8 — rejection reasons reach publishers + a real contact channel (UX-07)

`/publish` shows the publisher's stored rejection reason (it is already in the DB).
Add a contact channel: `NEXT_PUBLIC_CONTACT_EMAIL` env (placeholder in
`.env.example`; Itzik supplies the real address at deploy), rendered as a `mailto:`
link in the footer + in the "פנו לתמיכה" copy so the promise is real.

### J9 — adopters are 18+ (UX-12, decided)

Questionnaire age: schema minimum 18 (Hebrew error: "האימוץ דרך האתר מגיל 18
בלבד"), input `min` attribute to match, and the privacy page states the 18+
requirement. No parental-consent field. Existing stored profiles are unaffected.

## Track R ∥ — Reliability & lifecycle (P1)

### R1 — email delivery survives serverless (REL-01)

Wrap every fire-and-log email tail in Next's `after()` (stable in Next 16; runs
post-response on Vercel — the current bare `void (async…)` can be killed
mid-flight). Add migration for `email_log` (id, template, recipient_user_id — NOT
the raw address, cat_id/request_id nullable, status sent|failed, error text,
created_at; admin-only RLS) written via service role after each attempt, with one
retry on failure. Never fail the parent action.

### R2 — hero videos pause when hidden (PERF-02)

On crossfade switch, pause the outgoing video; `unregister` pauses its element.
Exactly one hero video plays at any moment. Proof (pane is `visibility:hidden` —
rAF never fires): sample `currentTime` deltas of all three elements over ~3s on
the production build; only the active one advances.

### R3 — proxy skips static media (PERF-03)

`proxy.ts` matcher excludes `/videos/…`, `/images/…`, `/api/media`, and static
extensions (`.mp4 .webm .jpg .png .webp .svg .ico .woff2`).

### R4 — request/upload abuse caps (SEC-05, app-level part)

Server-enforced: max 5 new adoption requests per user per day (count in action,
Hebrew refusal), max photos per cat enforced server-side (same limit as the wizard
UI), video ≤1 per cat (verify existing). No new infra — plain DB counts.

### R5 — stored-media validation hardening (SEC-07)

`lib/security/verify-stored-media.ts`: reject null/absent MIME or size; fetch the
first bytes (ranged request) and verify magic numbers for jpeg/png/webp and
mp4/webm before accepting. Keep it cheap (≤32 bytes per object) — no full
downloads.

### R6 — self-service account deletion + retention (SEC-12 delta)

New minimal `/account` page: "מחיקת חשבון" with typed confirmation. Server action:
re-verify session; per ARCHITECTURE §5a — archive the user's ever-published cats,
hard-delete never-published ones (reuse existing actions/helpers), then delete the
auth user via service role (cascades). Sibling auto-close fires via S5/existing
paths. Privacy page (from prompt 05) gains a retention + deletion paragraph
describing exactly this behavior.

## Track Q ∥ — Quality batch (P2)

- **Q1 a11y deltas (A11Y-02, 04, 05, 06, 07, 08, 10):** `aria-invalid` +
  `aria-describedby` wired in Input/Select/Textarea error states; skip link; fix
  nested `<main>` (questionnaire); `h1` on auth pages; admin queue rows become
  real buttons/links (keyboard + focus visible); upload/reorder/delete controls
  keyboard-reachable and visible on focus (no hover-only `opacity-0`), ≥44px along
  with chips, pagination, gallery arrows; `aria-current` on pagination; polite live
  region announcing filter result count; skeletons `aria-hidden`; video
  pause control stays a real button after playback starts.
- **Q2 auth UX (UX-10, UX-11):** password-reset flow
  (`resetPasswordForEmail` + `/reset-password` route + email redirect config note);
  show/hide password toggle; correct `autocomplete` attributes; `dir="ltr"` on
  email/password inputs; placeholder matches the real 8-char minimum.
- **Q3 perf batch (PERF-05, 06, 07, 08, 09, 10):** move the age-bucket helper out
  of the zod-importing module so `/` and `/cats` bundles drop zod; heic2any loaded
  only when a HEIC file is actually selected; hero preloads clip 1 only (2–3 lazy);
  trim font preloads to faces used above the fold; catalog queries select named
  columns + `count: 'estimated'`; cat detail fetches once for metadata+page
  (React `cache()`); admin dashboards batch queries with `Promise.all`. Report
  before/after gzip sizes for `/`, `/cats`, `/publish/new`.
- **Q4 SEO deltas (SEO-02..05):** `manifest.ts`; JSON-LD (Organization sitewide +
  minimal per-cat item); canonical: filtered `/cats?…` → `/cats`; `noindex` on
  auth/adopt/requests/admin/publish routes; OG/metadata URLs absolute from
  `NEXT_PUBLIC_SITE_URL` with a loud build-time warning when unset; per-cat OG
  image uses the public-bucket URL of the card photo (never the signed
  `/api/media` redirect).
- **Q5 copy sweep (UX-18, UX-19):** Hebrew pluralization ("1 cats" class of bugs),
  the English "Cat preview" label, phone numbers as `tel:` links where contact is
  legitimately shown, remove `select-none` where it blocks copying contact info.
- **Q6 (UX-13):** success screens: explicit continue button; any auto-redirect
  ≥10s and cancellable.
- **Q7 (UX-16):** 320px pass: catalog single column below ~360px, action groups
  wrap, no horizontal scroll anywhere.
- **Q8 headers/tooling (SEC-15, SEC-17, SEC-14):** HSTS gains `includeSubDomains`
  (add `preload` only as a SECURITY.md note for Itzik — it is hard to undo); new
  `scripts/check-deps.mjs` running `npm audit --omit=dev --audit-level=high`
  (report artifact, NOT part of `gate`); attempt a nonce-based CSP via proxy — if
  Next 16 inline constraints defeat it within a reasonable effort, keep
  `unsafe-inline` and update SECURITY.md's residual rationale instead.
- **Q9 catalog discovery (UX-15):** name search (`ilike`, debounced, in the filter
  drawer) + sort select (newest / youngest / oldest). Keyset pagination is
  OPTIONAL — document if skipped.
- **Q10 adopted-cats cleanup (UX-14, decided):** adopted cats remain hidden at
  launch. Delete the unreachable adopted-badge branch in `CatCard` and align any
  copy/docs that promise visible adopted listings ("סיפורי אימוץ" is deferred
  post-launch — do not build it).
- **Q11 process-true trust copy (UX-17, decided):** replace unverifiable claims
  (variants of "בטוח", "מאובטח", "התאמה מלאה") with accurate process statements —
  every listing is reviewed and approved by the site team before publication;
  contact details are shared only after a request is approved; adopters complete a
  questionnaire. Where the copy promises support, link the J8 contact channel. Do
  not invent organizational credentials or certifications.
- **Q12 raw-video privacy notice (SEC-08, deferred):** Hebrew notice in the video
  upload step: the clip is published exactly as uploaded — including audio and any
  identifying details visible in it. No transcoding work.
- **Q13 hero film v2.1 (client feedback via Itzik, 2026-07-16):** the current 3-clip
  hero fails on phones — wide shots are illegible at 390px and `hero_2` is visibly
  over-compressed. Per DESIGN.md §6b item 3 (amended): rebuild the rotation with
  **4–5 clips**, close-up/medium shots where the cat fills roughly ≥ 40% of frame
  height, warm grading per §6a; replace `hero_2`; source openly-licensed footage
  like the existing assets and document each source + license in the report.
  Budgets unchanged: clip #1 eager only (combine with Q3's preload change), each
  ≤ 1.2MB @ 960px, WebM+MP4+poster per clip, reduced-motion/saveData ⇒ poster, one
  video playing site-wide (PERF-02/R2 fix applies to the new clips too).
  Acceptance: at a 390px viewport every clip's subject is instantly identifiable;
  the crossfade cycles through all clips; above-the-fold mobile transfer stays
  ≤ 2.5MB.

## Done checklist

Every audit ID above appears in the report mapping table with
fixed / skipped-per-triage / deferred-documented. Gate 0/0, check:rls green
including all S7 additions, production-build verification of: J1 full loop
(anon → CTA → login → questionnaire with cat preserved; same via signup), J2
(submit blocked until every boolean answered), J5 (keyboard-only: open mobile
drawer, tab through, Escape closes, focus restored), J6 (kill Supabase, catalog
shows the error state, not an empty list), R2 sampling proof. Test credentials +
raw outputs in the report.
