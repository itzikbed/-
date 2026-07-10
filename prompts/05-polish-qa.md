# PROMPT 05 — Phase 5: Polish, QA, launch readiness

Read `00-orchestrator.md` first. Skills: `code-quality`, `rtl-hebrew-webapp`,
`catalog-and-filters` (SEO section), plus any skill matching a bug you touch.

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
