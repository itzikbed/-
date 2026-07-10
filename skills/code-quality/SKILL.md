---
name: code-quality
description: Code-quality gates and conventions for TypeScript / Next.js — strict typing, cheap typecheck→lint→build loops, server/client discipline, error-handling patterns, dependency hygiene. Load for EVERY session that writes or edits code, and for any "clean up", "refactor", "build fails", or "types are broken" request.
---

# Code Quality

## The cheap loop (run in this order — each gate is ~10× cheaper than the next)
1. `npx tsc --noEmit` — after every meaningful change. Seconds, catches most bugs.
2. `npm run lint` — before declaring a task done.
3. `npm run build` — at milestones only, not after every micro-change.
4. Browser screenshots — visual milestones only.

Never skip gate 1 to "save time": one type error caught late costs a full rebuild cycle.

## TypeScript rules
- `strict: true`. No `any` — use `unknown` + narrowing. No `@ts-ignore`; if truly unavoidable, `@ts-expect-error` with a one-line reason.
- Types come from the source of truth, never hand-duplicated:
  - Form/data types: `z.infer<typeof schema>` from `lib/schemas/`.
  - DB types: `supabase gen types typescript` → `lib/supabase/database.types.ts`, typed client everywhere. **Regenerate after every migration** — stale generated types lie silently.
- Non-null assertions (`!`) only for env vars validated at startup; nowhere else.

## Server / client discipline
- Server components are the default. `'use client'` only at leaf interactive components — push the boundary down, never mark a page client "to make it work".
- `import 'server-only'` at the top of `lib/supabase/server.ts` and anything touching secrets — turns leaks into build errors.
- Heavy client libs (`heic2any`, gallery libs) are dynamic imports.

## Error handling — one pattern everywhere
```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; formError?: string; fieldErrors?: Record<string, string[]> };
```
- Every server action returns `ActionResult`; the UI handles both branches uniformly. Never throw raw errors across the boundary.
- Route-level `error.tsx` + `not-found.tsx` exist for every segment with data fetching.
- No floating promises: `await` or explicitly `void promise.catch(log)` (the email fire-and-log case).
- No `console.log` in committed code; `console.error` only inside catch blocks that intentionally swallow.

## Agent-specific hygiene (the bugs agents actually create)
- **Read before write**: view the current file before editing; make surgical edits — never regenerate a whole file to change three lines.
- **Never create parallel versions** (`page-new.tsx`, `CatCardV2`) — edit in place. Two versions of a component = a bug factory.
- **New dependency = justify first**: check `package.json` for an existing equivalent, then add one line to ARCHITECTURE §11 explaining why.
- Delete dead code immediately. No commented-out blocks, no unused exports, no leftover TODOs — an open question becomes a line in ARCHITECTURE §10/§12, not a comment.
- Files growing past ~200 lines: split by responsibility before continuing.

## Conventions
- Component files PascalCase matching their export (`CatCard.tsx`); everything else per Next defaults. Path alias `@/` for all internal imports — no `../../..`.
- Prettier + `prettier-plugin-tailwindcss` (stable class order makes RTL-class greps reliable). ESLint: `next/core-web-vitals` + `@typescript-eslint` recommended.
- Pure logic in `lib/` (age buckets, filter serialize/parse, transition maps) gets small vitest unit tests — these are the bug-prone functions and tests double as agent guardrails. No component-test theater in v1.

## Done checklist
- [ ] `tsc --noEmit` clean · lint clean · build passes
- [ ] No new `any` / assertions / parallel files / dead code
- [ ] Actions return `ActionResult`; boundaries have error.tsx
- [ ] DB types regenerated if a migration was added
