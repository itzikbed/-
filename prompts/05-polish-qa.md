# PROMPT 05 — Phase 5: Polish, QA, launch readiness

Read `00-orchestrator.md` first. Skills: `code-quality`, `rtl-hebrew-webapp`,
`catalog-and-filters` (SEO section), plus any skill matching a bug you touch.

## Phase 4.2→5 context addendum (architect, 2026-07-15) — read before the tracks

Status: Phases 1–4.2 are closed and architect-approved. A security-hardening pass is
committed (`41bc64a`; read `SECURITY.md` — its launch checklist is part of this phase's
final gate). Stack reality: Next 16 / React 19 / Tailwind v4 / zod v4.

Binding constraints (violations fail the review):

1. **NEVER add a `loading.tsx`** (or any new streamed Suspense boundary) on `/` or
   `/cats` — it silently breaks ALL client hydration in Next 16.2.10 production builds
   (ARCHITECTURE.md §10–§11). Any new loading UI needs architect sign-off first.
2. Every milestone is verified against the **production build** (`npm run build` +
   `npm run start`), not dev. Static screenshots don't prove hydration — prove
   interactivity (open the filter drawer, click a control) on the production server.
3. `prompts/`, `skills/`, `scripts/checks/` remain READ-ONLY. Servers on :3000/:3001
   only (:3100 is the architect's). One commit per item, raw `npm run gate` +
   `npm run check:rls` output in the report, all test credentials in the report.
4. Seed↔test coupling: `scripts/rls-smoke.mjs` TEST 12 asserts EXACTLY 12 published
   cats. If your final `seed.sql` changes that count, update the invariant in the same
   commit and call it out in the report. Current seed: 15 cats (12 published, 2
   pending, 1 rejected).
5. Deletion/archive semantics are §5a of ARCHITECTURE.md — QA flows must respect them
   (published listings are archived, never deleted; delete exists only for
   never-published drafts).

Scope facts discovered in review (fold into the tracks):

- The footer ALREADY links to `/privacy` and `/accessibility` — **both routes 404
  today**. Track A must build both (privacy per the track spec; accessibility
  statement in plain Hebrew, aligned with the WCAG audit findings). `/terms` stub too.
- `sitemap.ts` must list only `status='published'` cats — adopted/archived cats are
  hidden from all public queries (§10 decision).
- `app/dev/ui` still exists — Track B deletes it.
- Final-gate scope split: Vercel deploy, Resend domain (SPF/DKIM), and prod Supabase
  setup (apply migrations 0008/0009, enable email confirmations, CAPTCHA, admin MFA,
  prod redirect URLs — the SECURITY.md checklist) are executed **with Itzik** — his
  accounts, his credentials; never ask for or handle them yourself. Your deliverable:
  everything ready + `docs/deploy-runbook.md` in Hebrew (step-by-step, including
  setting `NEXT_PUBLIC_SITE_URL` — it currently points email links at localhost:3000).

## Track D ∥ — carry-over fixes from the 4.x reviews (all architect-confirmed)

Email set (rtl-transactional-email skill rules apply):

1. `RequestClosedCatAdopted` subject is byte-identical to the request-REJECTED subject
   (`ui.json` `requestClosedCatAdoptedSubject*` = "עדכון לגבי בקשת האימוץ של {name}").
   Replace with warm, gendered subjects in the spirit of the body ("‏{name} מצא/ה
   בית") — ≤45 chars for every gender/name variant.
2. Harmonize `CatArchivedByAdmin` + `RequestClosedCatAdopted` chrome with the approved
   templates (`CatApproved`/`CatRejected`): centered logo section, `#FDFCFA`
   container, 20px radius, 600px max-width. Today the logo renders right-aligned and
   the container diverges (white/16px/560px).
3. `CatArchivedByAdmin` reason box must reuse `CatRejected`'s reasonBox style (orange
   accent), not the current green.
4. `emails/emails.test.tsx`: the "male and female" test for `RequestClosedCatAdopted`
   never asserts gendered content — assert the female render contains "מצאה", the male
   "מצא", and that the two differ; assert subject ≤45 for ALL gender variants of both
   new templates.
5. Outlook bulletproofing: add the MSO/VML conditional button pattern to CTA buttons
   in ALL templates (accepted-with-note in Phase 4: currently square corners in
   Outlook).

Admin/UI:

6. `components/admin/AdminArchiveControl.tsx`: the loading label reuses
   `strings.admin.cat.approving` ("מאשר...") — give archiving its own string; the
   dialog placeholder is reject-worded ("מדוע המודעה נדחתה") — add an archive-specific
   placeholder.
7. After a successful admin archive on `/cats/[id]`, `window.location.reload()` lands
   the admin on a 404 (the page hides non-published cats). Redirect to `/admin` with
   the success message instead.
8. `app/admin/request-actions.ts` (path corrected 2026-07-16): the
   `if (adopter && owner)` guard silently skips both party emails when a profile
   lookup fails — add a `console.error` (fire-and-log means LOG), no PII in the
   log line (message only, never the email address).

## Track A ∥ — SEO, a11y, meta

- `generateMetadata` sitewide: Hebrew titles/descriptions, OG defaults + per-cat OG.
  `sitemap.ts` (published cats + static pages), `robots.ts`, favicon + app icons from
  the mascot.
- WCAG audit per DESIGN.md §8: computed contrast pairs (adjust L, not hue), focus
  visible everywhere, keyboard-only walk of every flow, `alt` texts = "שם + מאפיין",
  form errors `role="alert"`, reduced-motion pass (hero video → poster, no lifts).
- Privacy policy page `/privacy` (Hebrew, plain language: מה נאסף, למה, מי רואה — the
  questionnaire data section is required) + link in footer. Terms stub `/terms`.

## Track B ∥ — Seed, role QA, edge cases

- Final `seed.sql`: 1 admin, 2 approved publishers, ~12 published cats covering EVERY
  filter combination (each region, each age bucket, each health level, special cats,
  fee/no-fee), 2 pending cats, 1 rejected, pending publisher, pending+approved requests.
- Full QA matrix as all four roles (anon/user/publisher/admin) — every flow, every
  guard. Specifically verify the RLS failure mode: empty results ≠ bug in app code.
- Edge cases: cat with 1 photo · 40-char English cat name (truncation) · filter combos
  with 0 results · double-submit on every form · withdraw during admin approval ·
  expired session mid-wizard.
- Delete `/dev/ui`. Grep sweep: no `console.log`, no TODO, no dead code, no physical
  direction classes, no Hebrew literals in JSX (all via strings.ts).

## Track C ∥ — "Alive" design audit (the client's explicit demand)

Walk EVERY screen desktop+mobile and grade against DESIGN.md. Fail items to fix:
- Landing hero: real media present? overlay contrast ok? two doors + mascot rise work?
- Any screen that reads as flat/gray/generic — add the missing warmth (paper bg, soft
  tint chips, warm shadows) WITHOUT adding new decoration types (§9 anti-patterns).
- Micro-interactions per §7 present: card lifts, button press scale, chip transitions,
  drawer slide. All disabled under reduced-motion.
- Mascot present at: empty states, 404, questionnaire success, request success.
- Exactly ONE marmalade CTA per screen — hunt duplicates.
- Screenshot every screen (both breakpoints) into `docs/screenshots/` for client review.

## Final gate

`tsc`/lint/build clean · Vercel production deploy + env vars + Supabase URL config
(auth redirect) · Resend domain verified (SPF/DKIM) · Lighthouse ≥ 90 on landing +
catalog (mobile) · ARCHITECTURE.md fully current (§3 all ✅, §12 all phases ✓, §10
decisions resolved with the client or explicitly deferred) · hand the screenshot folder
+ admin credentials + a one-page Hebrew admin guide (`docs/admin-guide.md`) to the user.
