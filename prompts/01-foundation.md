# PROMPT 01 — Phase 1: Foundation (repo, RTL shell, design system, DB, auth)

Read `00-orchestrator.md` rules first. Skills for this phase: `supabase-fullstack`,
`rtl-hebrew-webapp`, `code-quality`.

## Step 0 — sequential (lead agent, before splitting)

1. `npx create-next-app@latest` — Next.js 14, App Router, TypeScript, Tailwind, `@/` alias.
2. Copy `ARCHITECTURE.md` and `DESIGN.md` from project-docs into the repo root; copy
   `supabase/migrations/0001_init.sql` into `supabase/migrations/`. These are now the
   in-repo source of truth.
3. Create the skeleton folders from ARCHITECTURE.md §3 and the shared files every track
   depends on: `lib/constants.ts`, `lib/strings.ts`, `lib/schemas/he-errors.ts`,
   `lib/supabase/` (empty client stubs). Commit. Only now spawn the parallel tracks.

## Track A ∥ — App shell, design tokens, UI kit, mascot

- `app/layout.tsx`: `<html lang="he" dir="rtl">`, Rubik (700/800) + Assistant (400/600)
  via `next/font/google` with `subsets: ['hebrew','latin']`, exposed as CSS vars, wired
  into Tailwind. Header (logo text "בית לחתול", nav, auth button slot) + minimal footer.
- Tailwind theme: ALL color tokens from DESIGN.md §2 as CSS custom properties (OKLCH),
  radius/shadow/spacing values from §4. Logical properties only — configure ESLint or a
  grep script that fails CI on physical direction classes.
- `components/ui/`: Button (primary marmalade-pill / secondary pine / tertiary ghost),
  Input, Select, Checkbox, Radio, Badge, Chip, Dialog, Skeleton — exactly per DESIGN.md
  §5. Every interactive element: 44px min touch target, pine focus ring.
- `components/mascot/`: draw the **Peeking Cat SVG set** — 4 poses (peek-over-edge,
  sitting, sleeping, celebrating), single 2px ink stroke, marmalade accent on ears/tail
  only. These are hand-authored inline SVGs, small and clean. This is the site's only
  illustration — invest in making it charming.
- `lib/constants.ts`: REGIONS (5: north/south/center/jerusalem/yosh + Hebrew labels
  צפון/דרום/מרכז/ירושלים/איו"ש), AGE_BUCKETS (5 per ARCHITECTURE §4), HEALTH_LEVELS,
  FLOOR_TYPES, status enums. `lib/strings.ts`: seed with shell strings; flat keys,
  namespaced (`nav.*`, `auth.*`, `common.*`).
- A `/dev/ui` playground page rendering every ui/ component + all 4 mascots (delete in
  Phase 5).

## Track B ∥ — Supabase, migration, auth (start once lib/ scaffolding exists)

- Create the Supabase project; apply `0001_init.sql`; run
  `supabase gen types typescript` → `lib/supabase/database.types.ts`.
- `lib/supabase/{client,server,middleware}.ts` per the supabase-fullstack skill (three
  clients, never mixed; middleware uses `getUser()`).
- `(auth)/login` + `(auth)/signup` pages: email+password, react-hook-form + zod, Hebrew
  error map applied globally (`z.setErrorMap`), full_name+phone passed via
  `options.data`. Styled with Track A's ui kit (if not ready yet, use plain elements and
  swap in a follow-up commit — do not restyle locally).
- `.env.local.example` with the five vars from ARCHITECTURE §9.
- Verify RLS as three roles (anon, user, admin) with a scripted smoke test: anon sees
  only published cats (0 rows now), user can upsert own adopter_profile, non-admin
  cannot flip `role` (trigger blocks).

## Exit criteria (both tracks merged)

- `tsc`/lint/build clean · signup→login→logout works end-to-end · profile row
  auto-created on signup · `/dev/ui` shows the full kit + mascots · RTL grep clean ·
  ARCHITECTURE.md §3 paths check-marked, §12 Phase 1 ✓.
