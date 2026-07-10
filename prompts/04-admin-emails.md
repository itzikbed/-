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
