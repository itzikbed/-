# ARCHITECTURE.md — CatAdopt IL (working name: "בית לחתול")

> **⚠ LIVING DOCUMENT — read-first, write-after. This is the breathing part:**
> 1. Every agent session STARTS by reading this file end-to-end. Do not grep the repo to rediscover what is already written here.
> 2. Any change to files, schema, statuses, flows, or product decisions MUST update the matching section below **in the same session** — a session that changes structure but not this file is an unfinished session.
> 3. Hard cap: **250 lines.** Compress and rewrite old content instead of appending. History goes to the Decision Log as one-liners, never prose.
> 4. If reality and this file disagree, fix this file first, then continue working.
> 5. Design values (colors/type/motion) are NOT here — they live in `DESIGN.md`. Read it before any UI work.

## 1. Snapshot

Hebrew-only RTL cat-adoption platform for Israel. Scale target: ~200 published cats,
~1,500 registered users, ~80 concurrent. Everything user-generated is admin-moderated
before it becomes public or actionable.

Actors: **Adopter** (browses freely, fills a one-time questionnaire, sends adoption
requests) · **Publisher** (one-time admin approval, then uploads cats; each listing also
approved) · **Admin** (works three queues, decisions are logged and emailed).

## 2. Stack

Next.js 16.2.10 App Router · React 19 · TypeScript · Tailwind CSS v4 (logical properties only) ·
Supabase: Postgres + Auth + Storage, RLS-first · react-hook-form + zod v4 (schemas shared
client/server) · Resend transactional email · Deploy: Vercel · Fonts/tokens: `DESIGN.md`.

## 3. File map — target structure (update as built; mark ✅ when a path exists)

```
app/
  layout.tsx              # ✅ <html lang="he" dir="rtl">, fonts, header/footer
  page.tsx                # ✅ landing: two-door hero + latest cats strip
  cats/page.tsx           # ✅ public catalog; filters via searchParams
  cats/[id]/page.tsx      # ✅ cat detail, gallery, request CTA
  adopt/questionnaire/    # ✅ adopter wizard → adopter_profiles (saved, reusable)
  publish/                # ✅ publisher application, cat upload wizard, my-cats list
  requests/               # ✅ adopter's own requests + statuses
  admin/                  # ✅ layout.tsx role gate + queues: publishers/cats/requests + log
  (auth)/login, signup    # ✅ Supabase auth (email+password v1)
  dev/ui/page.tsx         # ✅ dev UI kit playground
lib/
  supabase/{client,server,middleware}.ts # ✅ typed clients
  schemas/                # ✅ ALL zod schemas (one per form) + he-errors.ts error map
  constants.ts            # ✅ REGIONS (5), AGE_BUCKETS (5), HEALTH_LEVELS, status enums — single source
  strings.ts              # ✅ every Hebrew UI string, flat keys; no literals in JSX
  emails/send.ts          # ✅ Resend helpers (fire-and-log, never throw to user)
components/
  ui/                     # ✅ Button, Input, Badge, Chip, Dialog, Skeleton — per DESIGN.md
  cats/                   # ✅ CatCard, CatGrid, Filters, Gallery, PhotoUploader
  admin/                  # ✅ QueueTable, DecisionDialog (reject requires reason)
  mascot/                 # ✅ Peeking Cat SVG set (see DESIGN.md §1)
emails/                   # ✅ react-email templates (see rtl-transactional-email skill)
supabase/
  migrations/0001_init.sql  # ✅ full schema + RLS — never edit applied migrations
  seed.sql                # dev: 1 admin, 2 publishers, ~12 published cats
```

## 4. Data model (summary — authoritative DDL in migrations)

| Table | Purpose | Key fields |
|---|---|---|
| `profiles` | 1:1 with auth.users | `role` user/admin · `publisher_status` none/pending/approved/blocked · full_name, phone, age, region, city, `publisher_type` private/organization |
| `adopter_profiles` | saved questionnaire (client spec 2026-07-10) | age, city, household_desc, has_other_pets(+desc), has_cat_experience, vet_clinic, adoption_reason, surrender_circumstances, `floor_type` (ground_house/garden_floor/floor_1/floor_2/floor_3_plus), has_window_screens, `completed_at` |
| `cats` | listings | owner_id, name, sex, **birth_est (date — never store age)**, region, city, description, health_notes, neutered, **vaccinations (0–3 count)**, **is_special (+special_needs text)**, **fee_amount (₪, null = אין סל אימוץ)**, good_with_{cats,dogs}, `status`, reject_reason, published_at, adopted_at |
| `cat_photos` | 2 files per photo | cat_id, `path_card` (480px), `path_full` (1600px), sort_order (0 = cover) |
| `adoption_requests` | adopter → cat | cat_id, adopter_id, message, `status`, admin_note, decided_by/at · **unique open request per (cat, adopter)** |
| `moderation_log` | audit, append-only | actor_id, entity_type, entity_id, action, reason |

Storage: private bucket `cat-photos`; `/api/media` issues 60-second signed URLs after
storage RLS verifies published/owner/admin access. Path `{cat_id}/{uuid}-{card|full}.webp`.

## 5. Status machines (enforce via transition maps in actions + RLS `with check`)

- `publisher_status`: none → pending → approved | blocked; admin may flip approved ↔ blocked.
- `cats.status`: draft → pending → published | rejected(+reason) · published → adopted | archived · rejected → pending (owner edits & resubmits) · **owner edit of a published cat forces status back to pending** (re-approval by design).
- `adoption_requests.status`: pending → approved | rejected(+note) · pending → withdrawn (adopter) · pending → rejected(auto) when the cat leaves `published` (see §5a).
- `cats`: archived → pending (owner edits & resubmits — same re-approval path as rejected).

### 5a. Deletion & archival policy (decided 2026-07-15, architect + Itzik)

**Default is archive — never hard delete.** A listing that has EVER been published has public
traces (adoption requests, moderation_log, sent emails); those must survive the listing.
The test for "ever published" is `published_at IS NOT NULL` (it survives the edit→pending round-trip).

Hard delete is permitted in exactly three cases:
1. **Owner deletes a never-published listing** (`published_at IS NULL`, status draft/pending/rejected).
   Order of operations: delete the DB row FIRST and assert exactly one row was affected
   (`.select()` on the delete), only then purge storage files. Requests cannot exist
   pre-publish, so nothing dangles.
2. **Account deletion / privacy request** — service-role script only (never UI); FK cascades
   remove the user's cats and requests; write a moderation_log line before running it.
3. **Unlawful-content purge** — service-role script only; moderation_log line mandatory.

Everything else is archive (`status='archived'`):
- Owner "remove" on an ever-published listing ⇒ archive (UI label: הסרה מהאתר). The delete
  button is only offered on never-published listings.
- Admin removal ⇒ archive with mandatory reason + moderation_log(action='archive') + email
  to owner. There is NO hard-delete control in /admin, by design.
- Archived listings are invisible everywhere except to owner + admin; owner may edit &
  resubmit (archived → pending).
- Media of archived/adopted listings is retained 90 days, then purged by a maintenance
  script (post-launch item; storage pressure is negligible at 200 cats).

RLS enforcement (migration 0007): `cats_delete_owner` — DELETE only when
`owner_id = auth.uid() AND published_at IS NULL AND status IN ('draft','pending','rejected')`.
No DELETE policy for admin via the app (cases 2–3 run as service role, outside the UI).
Until 0007 lands, cats has NO delete policy at all — `deleteCatAction` purges storage, the
row delete silently no-ops, and it reports success; the ordering fix above is part of 0007's change set.

Lifecycle tie-in: any transition OUT of `published` (→ adopted or archived) auto-closes that
cat's sibling pending requests (status='rejected', auto admin_note) via service role and
emails those adopters. Approving a single request does NOT close siblings — adoption is
final only when the owner marks the cat adopted.

## 6. Permission matrix (RLS is the boundary; UI checks are decoration)

| Action | anon | user | approved publisher | admin |
|---|---|---|---|---|
| View published cats/photos | ✅ | ✅ | ✅ | ✅ |
| View pending/rejected cat | — | own only | own only | ✅ |
| Save questionnaire | — | ✅ | ✅ | ✅ |
| Send adoption request | — | ✅ (questionnaire complete) | ✅ | ✅ |
| Create/edit listing | — | — | ✅ (never self-publish) | ✅ |
| Approve / reject anything | — | — | — | ✅ |
| See other side's contact details | — | only after admin approves the request | same | ✅ |
| Read questionnaire answers | — | own | — (admin relays) | ✅ |

## 7. Core flows

1. **Adopter:** browse → cat page → "רוצה לאמץ" → login/signup if needed → questionnaire if `completed_at` null (saved forever) → request message → pending → admin approves → both sides emailed the other's name+phone.
2. **Publisher:** signup → "אני רוצה למסור חתול" → application sets publisher_status=pending → admin approves (email) → upload wizard (details + photos) → cat pending → admin approves → published → owner marks adopted.
3. **Admin:** `/admin` three queues (oldest first, live counts) → approve one-click / reject with mandatory reason → moderation_log row + email + revalidate, all in the same server action.

## 8. Conventions

- All Hebrew UI strings in `lib/strings.ts`; components import keys. No Hebrew literals in JSX.
- One zod schema per form in `lib/schemas/`, imported by BOTH the client form and its server action.
- Mutations = server actions in `actions.ts` beside their route; every action re-checks auth + role.
- Tailwind logical properties only (`ms/me/ps/pe/start/end`) — physical direction classes are banned (see rtl skill).
- Migrations: new numbered file per change; applied files are immutable. After every migration: regenerate `lib/supabase/database.types.ts`.
- Definition of Done for any code task: `tsc --noEmit` clean → lint clean → build passes (full gates in code-quality skill). Server actions return the shared `ActionResult` type.
- Commits: conventional prefix, Hebrew allowed in body.

## 9. Environment

`NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY`
(server only — never NEXT_PUBLIC) · `RESEND_API_KEY` · `RESEND_FROM_EMAIL` · `NEXT_PUBLIC_SITE_URL`.

## 10. Open product decisions (confirm with client before Phase 4)

- [ ] Contact handoff on approval — implemented default: email both sides name+phone. Confirm.
- [ ] Adopted cats — implemented reality (Phase 4): hidden everywhere once adopted (public queries filter `published`; CatCard's adopted badge is currently unreachable). Decide if the client wants a "סיפורי אימוץ" showcase instead.
- [ ] Questionnaire timing — implemented default: free browsing, required only before first request (differs from client's original "at entry"). Confirm.
- [ ] Should the cat's owner see the adopter's questionnaire directly? Current: admin-only, relayed on approval.
- [ ] Site name + domain. Privacy-policy page text (personal data is collected — mandatory).
- [ ] Re-verify image optimization against the cloud Supabase URL before launch.
- [ ] NEXT_IMAGE_UNOPTIMIZED is a LOCAL-testing flag only; the cloud remote pattern is derived from `NEXT_PUBLIC_SUPABASE_URL`.
- [ ] On the next Next.js upgrade: re-test whether a route-level `loading.tsx` for /cats still breaks production hydration (see 2026-07-13 architect decision); if fixed upstream, restore the route-level skeleton.
- [ ] Server-side transcoding pipeline for publisher video clips (convert RAW mp4/webm/mov inputs to ≤3s, 480px, ≤1MB specs) — future (§11 decision 2026-07-14).

## 11. Decision log (append one line per decision, newest last)

- 2026-07-10 · Stack fixed: Next.js 14 + Supabase (RLS-first) + Resend on Vercel · fits scale at free/low tier.
- 2026-07-10 · Roles from day one (user/admin + publisher_status) · admin-moderated model requires it.
- 2026-07-10 · Two pre-generated image variants client-side (card 480 / full 1600 WebP) · protects 5GB/mo free egress; Supabase transforms are Pro-only.
- 2026-07-10 · Page-based pagination (24/page), not infinite scroll · back-button, SEO, simplicity.
- 2026-07-10 · Closed region list, birth date stored instead of age · clean filtering, no stale data.
- 2026-07-10 · Publisher approval AND per-listing approval ("gam ve-gam" per client).
- 2026-07-10 · Design direction "Cat's Eye" (pine + marmalade on warm paper), signature = Peeking Cat · see DESIGN.md.
- 2026-07-10 · Edit of published listing returns it to pending · moderation integrity.
- 2026-07-10 · code-quality skill added; DoD = tsc/lint/build gates, typed Supabase client, ActionResult pattern.
- 2026-07-10 · Client field-spec v2 integrated (supersedes 9-region list): 5 regions (north/south/center/jerusalem/yosh) · 5 age buckets (0–3m/3–6m/6–12m/1–8y/8y+) · `vaccinations` count 0–3 replaces boolean · `is_special`+`special_needs` for the "מיוחדים" filter · `fee_amount` (סל אימוץ) · publisher fields age/city/publisher_type on profiles · adopter questionnaire rewritten to her exact question list.
- 2026-07-10 · Landing hero must feel alive: real-cat photo or short muted video loop per DESIGN.md §6a — not optional, part of DoD for the landing page.
- 2026-07-12 · Bumped stack versions to Next.js 16, React 19, Tailwind CSS v4, and Zod v4 to leverage modern features and clean validation APIs.
- 2026-07-12 · Added sharp as devDependency for processing openly-licensed cat images into card/full WebP variants client-side and in seeds.
- 2026-07-12 · Added vitest as devDependency to run unit tests on complex, bug-prone filter parsing/serialization and query building.
- 2026-07-12 · Added migration 0002 to allow service_role to bypass the profile role privilege guard, enabling user seeding through auth.admin APIs.
- 2026-07-12 · Design-v2 decision: living cat cards, hero film sequence, and self-drawing mascot approved by architect.
- 2026-07-13 · View Transition production workaround: replaced Next.js experimental.viewTransition with custom promise-based document.startViewTransition wrapper synchronized with route rendering.
- 2026-07-13 · (architect) Removed `app/cats/loading.tsx`: its streamed Suspense boundary silently killed ALL client hydration on / and /cats in production builds (Next 16.2.10 bug — dev unaffected, zero console errors; bisected across commits and confirmed by removal). Filter-change skeletons still work via `useTransition` isPending → CatGrid `loading`. Do NOT reintroduce a route-level loading file (or a page-level Suspense around the catalog) until verified against a fixed Next version — verify hydration on a production build after any Next upgrade (§10).
- 2026-07-14 · Video upload policy v1: accepts RAW uploads (≤15s, ≤25MB), autoplay limited to stored files ≤1.5MB; HEIC images decoded client-side via heic2any before canvas resize.
- 2026-07-14 · (architect) Migration 0004: fixed storage RLS owner policies — 0001 used unqualified `name` inside the EXISTS subquery, which resolved to cats.name, so every authenticated photo/video upload+delete was rejected (surfaced in Phase 3 review; canonical 0001 fixed too). rls-smoke TEST 9 added to keep it covered.
- 2026-07-14 · Added `resend` as dependency to send transactional emails · fits free tier assumptions.
- 2026-07-14 · Added `@react-email/components` as dependency to build responsive RTL transactional email templates.
- 2026-07-15 · (architect) Deletion policy fixed as §5a: archive is the default for anything ever published; hard delete only for never-published listings (owner), account-deletion cascade, or unlawful-content purge via service-role script. Mandates migration 0007 (`cats_delete_owner` RLS), `deleteCatAction` row-first ordering fix (found: cats had NO delete policy — the action purged media, silently no-oped the row delete, and reported success), admin archive-with-reason control, and auto-close of sibling requests on adopted/archived.
- 2026-07-15 · Security hardening: migrations 0008–0009 make media private, constrain direct PostgREST/storage writes, enforce owner status transitions, and block blocked publishers; app adds signed media access, security headers, origin checks, bounded inputs, and production-safe email handling.


## 12. Now / Next (update every session)

| Phase | Scope | Status |
|---|---|---|
| 0 | Client sign-off on §10 decisions | ☐ |
| 1 | Repo, RTL shell, migration 0001, auth, ui/ kit | ☑ |
| 2 | Catalog + filters + cat page | ☑ |
| 2.5 | Design elevation "החתול החי" | ☑ |
| 3 | Questionnaire wizard · upload wizard · request flow | ☑ |
| 4 | Admin queues + emails | ☑ |
| 4.2 | Deletion & archive lifecycle per §5a: migration 0007, deleteCatAction fix, owner/admin archive controls, sibling-request auto-close + emails (prompt 04.2) | ☐ |
| 5 | Polish: SEO/OG, a11y audit, privacy page | ☐ |
| 6 | Seed, QA as all 4 roles, domain, admin handover | ☐ |
