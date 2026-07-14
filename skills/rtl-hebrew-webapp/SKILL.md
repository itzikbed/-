---
name: rtl-hebrew-webapp
description: Hebrew right-to-left rules for live web apps — layout, mixed Hebrew/English text, forms, dates, icons. Load for EVERY task that renders UI in this project, including "small" tweaks; RTL bugs come precisely from small tweaks made without these rules.
---

# Hebrew RTL Web App

## Foundations
- `<html lang="he" dir="rtl">` in the root layout — one source of truth. Per-element `dir` is only for deliberate LTR islands.
- Fonts: the families defined in `DESIGN.md`, via `next/font/google` with `subsets: ['hebrew','latin']`, `display: 'swap'`, exposed as CSS variables and wired into Tailwind.

## Tailwind: logical properties only
- Allowed: `ms-* me-* ps-* pe-*`, `start-* end-*`, `text-start/text-end`, `rounded-s-*/e-*`, `border-s/e`.
- **Banned:** `ml- mr- pl- pr- left- right- text-left text-right` — except media-player-style controls that must not flip. Before finishing any UI task, grep for the banned classes.
- Flex/grid already follow `dir`. Never add `flex-row-reverse` to "fix RTL" — if a row looks reversed, something upstream forced LTR; find it.

## Mixed-direction content — the #1 bug source
- Phone numbers, emails, URLs, code, English brand names inside Hebrew text: wrap in `<span dir="ltr">` (utility class with `unicode-bidi: isolate`). Otherwise punctuation and digits scramble: `050-1234567.` renders broken at line edges.
- Inputs for email/phone/URL: `dir="ltr"` with `text-align: start` — the user types LTR content inside an RTL form.
- Placeholder alignment follows input dir; LTR inputs left-align their placeholder. Acceptable — don't fight it.

## Icons & motion direction
- Directional icons (arrows, chevrons, "back") must flip: `rtl:-scale-x-100`. Non-directional (heart, check, close, logo) never flip.
- Carousels/swipes: "next" moves leftward in RTL. Any gallery lib must be initialized with `direction: 'rtl'` and tested by swiping.

## Locale — never hand-format
- Dates: `Intl.DateTimeFormat('he-IL', ...)`; relative time: `Intl.RelativeTimeFormat('he')`.
- Numbers: `Intl.NumberFormat('he-IL')`.
- Cat age: computed from `birth_est`, displayed as one of 5 bucket labels (עד 3 חודשים / 3–6 חודשים / 6–12 חודשים / שנה–8 שנים / 8+) — definitions in `lib/constants.ts`.

## Hebrew UI text
- Every string lives in `lib/strings.ts` (flat keys). No Hebrew literals inside JSX — this is a grep-able convention, enforce it.
- zod Hebrew error map in `lib/schemas/he-errors.ts`, applied once globally with `z.setErrorMap`.
- Required-field marker is the word "חובה", not a bare `*`.
- **Grammatical gender**: any string that refers to a specific cat must agree with `cats.sex` — verbs, pronouns, adjectives (מחפש/מחפשת, לו/לה, מסורס/מעוקרת). Use the `<key>Male/<key>Female/<key>Unknown` triple in ui.json with the `gendered()` helper; unknown sex uses the "/ת" slash form or falls back to male. Generic/plural copy and FILTER labels stay masculine. This applies to emails too (Phase 4+): a request-received email about a female cat must read feminine.

## Gotchas
- `truncate` on mixed Hebrew/English text can clip the wrong end — test cards with a long English cat name.
- Trailing punctuation rendering on the wrong side = a missing `dir` on an ancestor, not a CSS bug.
- Browser autofill paints its own background — override `:autofill` to keep the warm surface color.
- Shadows/gradients don't auto-flip; fine for symmetric ones, check any asymmetric decoration.
- Keyboard focus order follows DOM order, which is already RTL-correct — don't add `tabindex` "fixes".

## Done checklist
- [ ] Grep clean of banned physical-direction classes
- [ ] Phones/emails/URLs wrapped `dir="ltr"`
- [ ] Directional icons flip; others don't
- [ ] Dates/numbers via Intl `he-IL`; all strings from `lib/strings.ts`
- [ ] Cat-specific strings gender-agree with `cats.sex` (spot-check one female cat page)
