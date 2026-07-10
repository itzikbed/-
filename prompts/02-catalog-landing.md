# PROMPT 02 — Phase 2: Public site (landing, catalog + filters, cat page)

Read `00-orchestrator.md` rules first. Skills: `catalog-and-filters`,
`rtl-hebrew-webapp`, `image-upload-pipeline` (serving section), `code-quality`.
Read DESIGN.md IN FULL before writing markup — §6a (hero media) is mandatory here.

Temporary data note: real cats don't exist yet (upload wizard is Phase 3). Insert ~12
realistic seed cats + photos via `supabase/seed.sql` NOW (Hebrew names — מיצי, שמשון,
לונה, אוסקר... — varied regions/ages/health/special flags, real openly-licensed cat
photos processed into card/full WebP variants). QA of this phase depends on it.

## Track A ∥ — Landing page (`app/page.tsx`)

The client's first impression — this page carries the "alive" requirement.

1. **Hero with real media per DESIGN.md §6a** — video loop (preferred) or art-directed
   photo, gradient overlay, H1 "לכל חתול מגיע בית." in Rubik 800, one sub-sentence.
   A flat colored hero = task failed.
2. **Two-door choice** ON the hero media: "אני רוצה לאמץ" (marmalade treatment →
   `/cats`) and "אני רוצה למסור חתול" (pine outline → `/publish`). Peeking Cat rises
   over the hovered card's top edge (200ms, reduced-motion safe).
3. **Latest-cats strip**: 4–8 newest published cats (real CatCards from Track B — agree
   on the CatCard props contract in advance; it lives in `components/cats/CatCard.tsx`
   owned by Track B), link "לכל החתולים ←".
4. **How-it-works**: 3 steps for adopters, 3 for publishers (בוחרים חתול → ממלאים שאלון
   → האדמין מחבר ביניכם). Small, warm, iconography from the mascot's ink-stroke language.
5. At least two secondary "alive" touches from DESIGN.md §6a's list.

## Track B ∥ — Catalog `/cats` + filters

Implement the catalog-and-filters skill precisely. Key points to not miss:
- `searchParams` = single source of truth; zod-parsed; ONE serialize/parse utility.
- The 6 filters from the skill's table (region/age/health/good_with/special/sex) —
  health and good_with are DERIVED conditions (see table) — put the SQL mapping in one
  utility with unit tests.
- Grid 2/3/4 cols, CatCard per DESIGN.md §5 (card image variant + correct `sizes`!),
  pagination 24/page, chips + "נקה הכל" + "נמצאו X חתולים" counter.
- Mobile: bottom-drawer filters with sticky "הצג תוצאות (X)". Desktop: start-side sidebar.
- Empty states with the Peeking Cat. Skeletons with exact card dimensions.
- "מיוחדים" cats get a small 💙 badge on the card.

## Track C ∥ — Cat detail `/cats/[id]`

- Swipeable gallery (RTL direction!, full variants, first `priority`), name + age bucket
  + sex + region/city, attribute chips (מעוקר/מחוסן ×N/מסתדר עם.../מיוחד), health notes,
  fee callout if `fee_amount` ("סל אימוץ: ₪X" — marmalade-sf tint), description.
- Primary CTA "רוצה לאמץ את {name}" → `/adopt/questionnaire?cat=<id>` if no completed
  questionnaire, else `/cats/[id]/request` (routes stubbed — Phase 3 fills them).
- `generateMetadata`: "{name} מחפש/ת בית" + OG image = cover full variant.
- `notFound()` for non-published (RLS returns null — handle it). `error.tsx` +
  `not-found.tsx` (with sleeping mascot) for the segment.

## Exit criteria

DoD gates clean · filters shareable via URL + back-button verified · grid provably
loads card variants (network tab) · landing hero media present and reduced-motion
tested · screenshots desktop+mobile of all three screens · ARCHITECTURE §12 updated.
