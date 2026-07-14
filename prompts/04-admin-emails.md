# PROMPT 04 — Phase 4: Admin panel + transactional email

Read `00-orchestrator.md` first. Skills: `admin-moderation`, `rtl-transactional-email`,
`supabase-fullstack`, `rtl-hebrew-webapp`, `code-quality`.

## Track A ∥ — Admin panel `/admin`

Implement the admin-moderation skill precisely. Highlights the agent must not skip:
- Three-layer protection: middleware + layout role gate + `is_admin()` re-check in every
  action. Client checks are decoration.
- Three queue tabs with live counts: **מפרסמים ממתינים · מודעות לאישור · בקשות אימוץ**,
  oldest first. Row expand shows everything the admin needs to decide **in place**:
  - Publisher: full application details (שם, גיל, טלפון LTR-span, עמותה/פרטי, אזור+עיר).
  - Cat: all fields + photo gallery + the owner's details.
  - Request: the message + the adopter's FULL questionnaire answers + the cat's card —
    this is the screen the whole product exists for; make it genuinely readable
    (definition list, not a JSON dump).
- Approve = one click; reject = dialog with mandatory reason (min 10 chars). Decision
  actions: optimistic status-guard WHERE → `moderation_log` insert → email (fire-and-log)
  → `revalidatePath` — one action, idempotent, "טופל כבר על ידי אדמין אחר" on conflict.
- Approving an adoption request = contact handoff: email BOTH sides name+phone. Verify
  with RLS tests that neither side can query the other's contact before approval.
- Log tab: latest 50 moderation_log rows.
- Admin UI uses the same design system — the panel should feel like the same warm
  product, just denser (smaller cards, same tokens).

## Track B ∥ — Email templates (`emails/` — zero overlap with Track A files)

All six templates from the rtl-transactional-email skill, react-email + Resend:
`publisher-approved` · `cat-approved` · `cat-rejected` (reason verbatim, helpful tone) ·
`request-received` · `request-approved` (BOTH sides, contact in LTR spans) ·
`request-rejected` (gentle + "עוד חתולים מחכים" CTA).

Non-negotiables from the skill: `dir="rtl"` on html AND every table · table layout,
600px, inline styles only · Assistant→Arial fallback · plain-text part · bulletproof
buttons · subjects ≤ 45 Hebrew chars. Brand: warm paper bg, one marmalade CTA, tiny
ink-stroke cat divider (inline SVG→PNG if needed). `lib/emails/send.ts`: fire-and-log
wrapper, never throws to the user.

Test by sending all six to a real Gmail account; check web + mobile rendering.

## Integration (after both tracks)

Wire Track B's senders into Track A's decision actions and the Phase 3
`TODO(phase4)` call site (request-received). Full loop test: publisher applies → admin
approves (email arrives) → cat uploaded → approved (email) → request sent (email) →
request approved (BOTH emails with correct cross-contact, phones render unscrambled).

## Exit criteria

DoD gates · two-admin race tested (two tabs, same item — second gets the friendly
conflict message) · moderation_log rows written for every decision · all 6 emails
verified in Gmail mobile · ARCHITECTURE §12 updated.

## Phase 3 → 4 context addendum (architect, 2026-07-14 — binding)

State you inherit:
- Phase 3 closed and approved. Migrations now go through 0004 (storage RLS fix —
  architect). `scripts/rls-smoke.mjs` runs TESTS 1–9; EXTEND it (TEST 10+), never
  rewrite. TEST 1 asserts exactly 12 published cats — an invariant.
- Local review accounts: arch-review-pub@example.com / arch-review-adopter@example.com
  (password `Review!2026`). Draft cat `1879afab-…` belongs to the publisher account
  and must stay a DRAFT.

Rules added since prompt 04 was written:
1. **Gendered Hebrew applies to emails** (rtl-hebrew-webapp skill, updated): any email
   about a specific cat (cat-approved, cat-rejected, request-*) must gender-agree with
   `cats.sex` using the `gendered()` helper / `Male|Female|Unknown` triples in ui.json.
   A request-approved email about a female cat reads feminine throughout.
2. **Lint bar is 0 errors / 0 warnings.** For reactive form reads use `useWatch`, not
   render-scope `watch()` and not `getValues()` (see commit b74b5ae).
3. **Admin test account**: create one locally (service-role sets `role='admin'`),
   document its credentials in the report.
4. **Queue/approval testing**: create fresh cats under your own test publisher for the
   full-loop test and return them to non-published states (or delete them) before
   running `check:rls` — do NOT approve/alter the 12 seeded cats.
5. **RESEND_API_KEY is a mock locally** (`re_local_mock_key`). Real delivery cannot be
   verified yet. Required instead: `lib/emails/send.ts` fire-and-log wrapper must no-op
   cleanly on mock key (log + persist rendered HTML to `.email-outbox/` locally);
   verify all six templates via `react-email` preview + a render unit test per template
   (RTL direction, LTR phone spans, subject length ≤ 45 chars). Real-Gmail + mobile
   verification moves to a checklist item blocked on the client's API key — flag it in
   your report, do not fake it.
6. Process (unchanged but restated): one commit per milestone; report includes raw
   `npm run gate` + `npm run check:rls` output and all test credentials; milestone
   verification against a PRODUCTION build; your server on :3000/:3001 — :3100 is
   reserved for architect verification. `prompts/`, `skills/`, `scripts/checks/`
   remain READ-ONLY.
