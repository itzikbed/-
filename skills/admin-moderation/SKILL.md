---
name: admin-moderation
description: Admin panel work — approval queues, status transitions, role-gated routes, audit logging, contact handoff. Load when touching anything under /admin, publisher approval, listing approval, adoption-request decisions, or any status change on cats/requests/profiles.
---

# Admin & Moderation

## Route protection — three layers, all required
1. Middleware redirects unauthenticated users away from `/admin/*`.
2. `/admin/layout.tsx` (server component) fetches the profile; `role !== 'admin'` → `redirect('/')`. The layout gate covers every admin page automatically.
3. Every admin server action re-checks `is_admin()` — actions are callable without visiting pages.

Client-side role checks are decoration, never the boundary. RLS is the final backstop.

## Status machines
Single source of truth: `ARCHITECTURE.md` §5. Enforce with explicit transition maps in actions:

```ts
const CAT_TRANSITIONS = { pending: ['published','rejected'], published: ['adopted','archived'], rejected: ['pending'], ... }
```

Reject anything not in the map. No scattered if-chains.

## Concurrency — two admins, one item
Optimistic guard: include the expected current status in the WHERE clause —
`update cats set status='published', published_at=now() where id=$1 and status='pending'`.
Zero rows affected = another admin acted first → show "טופל כבר על ידי אדמין אחר" and refresh the queue. Every decision action must be idempotent.

## Queues UI
- Three tabs with live counts: **מפרסמים ממתינים · מודעות לאישור · בקשות אימוץ**. Order oldest-first (fairness).
- Row = essentials; expand for full detail including photos and, for requests, the adopter's questionnaire answers.
- Approve = one click. **Reject = mandatory reason** (min 10 chars) — the reason is stored AND sent to the user verbatim.
- One server action per decision does all side effects atomically-in-spirit: status update (guarded) → `moderation_log` row → email (rtl-transactional-email skill) → `revalidatePath` of public routes.

## Audit
Every decision writes `moderation_log (actor_id, entity_type, entity_id, action, reason)`. Append-only — never delete rows. Log tab shows the latest 50.

## Contact handoff (the sensitive moment)
Approving an adoption request reveals adopter ↔ owner contact per ARCHITECTURE §10 default: email both sides the other's name + phone. Until approval, neither side's contact is retrievable by the other **in any query** — verify with RLS tests, not by checking the UI.

## Gotchas
- Cats archive; they are never hard-deleted (requests reference them).
- No public UI may query pending counts — that leaks moderation volume.
- Admin promotion is manual SQL/dashboard only; there is deliberately no "make admin" UI in v1.
- Decision buttons work inline from the queue (no page navigation), which is exactly why idempotency matters.

## Done checklist
- [ ] Layout gate + per-action `is_admin()`
- [ ] Transition maps + optimistic WHERE guards
- [ ] Reject requires a reason; log row written; email fired
- [ ] RLS-verified: no contact leakage before approval
