---
name: supabase-fullstack
description: Supabase + Next.js App Router patterns — schema, migrations, RLS, role-based auth, storage, server actions. Load this whenever the task touches the database, login/signup, permissions, saved data, or file storage, even indirectly (e.g. "the form doesn't save", "users see the wrong cats", "add a field").
---

# Supabase Fullstack (Next.js App Router)

## Read first
- Project truth (tables, statuses, roles, conventions) lives in `ARCHITECTURE.md` at repo root. Never invent schema — read it, extend it, update it in the same session.
- Base schema: `supabase/migrations/0001_init.sql`. Every change = a NEW numbered migration. Applied migrations are immutable.

## Three clients — never mix
| Context | Client | Key |
|---|---|---|
| Browser components | `createBrowserClient` (@supabase/ssr) | anon |
| Server components / actions | `createServerClient` + cookies | anon (user session) |
| Trusted server jobs only | service-role client | service key — never in client bundle, never `NEXT_PUBLIC_*` |

Middleware refreshes the session with `supabase.auth.getUser()` — never `getSession()`, which trusts unverified cookie data.

## RLS rules
- `enable row level security` on EVERY table, no exceptions — a table without RLS + anon key is fully public.
- Default deny; write narrow policies per verb (select/insert/update/delete separately).
- Role checks only via the `security definer` function `is_admin()` — querying `profiles` inside a `profiles` policy directly causes infinite recursion.
- **RLS failures return EMPTY RESULTS, not errors.** A query that "returns nothing" means suspect the policy before debugging app code.
- Privilege-escalation guard: users update their own profile, but the `trg_profiles_guard` trigger blocks non-admin changes to `role`/`publisher_status`. Keep it intact when altering profiles.

## Mutations
- All writes are server actions (`'use server'`), re-validated with the same zod schema the client used (from `lib/schemas/`).
- Every action re-checks auth (and role where relevant) — actions are callable outside pages.
- After writes: `revalidatePath()` on affected routes.
- Status changes go through explicit transition maps (see admin-moderation skill); RLS `with check` clauses back them up at the DB.

## Storage
- Bucket `cat-photos`, public read. Write policy requires the path's first folder to be a cat owned by the uploader.
- Path scheme: `{cat_id}/{uuid}-{card|full}.webp` (see image-upload-pipeline).
- Deleting a row does NOT delete storage objects — remove them explicitly in the same action, both variants.

## Gotchas
- `timestamptz` always; never bare `timestamp`.
- New signup → profile row is created by the `handle_new_user` trigger; pass `full_name`/`phone` via `options.data` on signUp.
- Seed (`supabase/seed.sql`): 1 admin, 2 approved publishers, ~12 published cats with photos — admin promotion is manual SQL only, there is no UI for it.
- Free tier pauses after ~7 idle days — before a client demo, wake the project first.
- Test every policy as each role (anon key, user JWT, admin JWT). Testing only with service role hides all RLS mistakes because service role bypasses RLS.
- `.in()` with an empty array matches nothing — skip the filter instead of passing `[]`.

## Done checklist
- [ ] New tables: RLS enabled + a policy per verb
- [ ] New migration file added; ARCHITECTURE.md §4/§5 updated
- [ ] Mutations are server actions with zod re-validation + auth re-check
- [ ] Behavior verified as anon, user, publisher, admin
