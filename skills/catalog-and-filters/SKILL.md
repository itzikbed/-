---
name: catalog-and-filters
description: The public browsing experience — cat grid, cards, filters, pagination, empty/loading states, and the cat detail page. Load for any browse/search/discovery UI, any filter bug, anything on /cats, and SEO/OG work for cat pages.
---

# Catalog & Filters

## Architecture
- Server-component page. **`searchParams` is the single source of truth for filter state** — URLs are shareable, back button works, no client store for filters.
- Filter change = `router.replace` with new params + `{ scroll: false }`; the list sits in `<Suspense>` with a skeleton fallback.
- Query: `status = 'published'` only, card fields + cover photo (`sort_order = 0`), `count: 'exact'` for the results counter.
- Parse `searchParams` through a zod schema; ignore junk/unknown params. Keep serialize/parse in ONE utility — state↔URL drift creates ghost filters.

## Filters (v1 — client spec 2026-07-10)
| Filter | Type | Values (labels from `lib/constants.ts`) |
|---|---|---|
| region | multi | צפון · דרום · מרכז · ירושלים · איו"ש (5 fixed) |
| age | multi | עד 3 חודשים · 3–6 חודשים · 6–12 חודשים · שנה–8 שנים · 8+ |
| health | multi | מעוקר/ת ומחוסן/ת לגמרי (neutered ∧ vaccinations ≥ 2) · מחוסן חיסון אחד (=1) · לא מחוסן (=0) |
| good_with | multi | מסתדר עם חתולים · מסתדר עם כלבים · לא מסתדר עם חתולים/כלבים (both false) |
| special | toggle | מיוחדים 💙 — `is_special` (נכים/עיוורים/חירשים) |
| sex | single | זכר / נקבה |

- Age buckets translate to `birth_est` date ranges server-side (`gte`/`lt`). Ages are always computed — never stored.
- Health/good_with values map to SQL conditions in ONE utility beside the serializer — never inline `.or()` strings in the page.
- Active filters render as removable chips + "נקה הכל". Counter: "נמצאו 37 חתולים".
- Mobile: bottom drawer with sticky "הצג תוצאות (37)". Desktop: sidebar on the start side.
- Skip a filter entirely when its value set is empty — `.in()` with `[]` returns nothing.

## Grid & cards
- 2 cols mobile / 3 tablet / 4 desktop. Card spec (photo variant, radius, hover, typography) comes from `DESIGN.md` §5 — do not restyle locally.
- Grid images use the **card** variant with an accurate `sizes` attr (image-upload-pipeline skill).
- Adopted cats stay visible per product default: badge "אומץ! 🎉" + slight desaturation — social proof.
- Sort: newest `published_at` first; tiebreak on `id` for stable pagination.

## Pagination
Page-based, 24 per page, `?page=2`, numbered pager + prev/next. All filter params persist across pages. (Infinite scroll is explicitly out — see ARCHITECTURE decision log.)

## Empty & loading
- Filtered-empty: Peeking Cat mascot + "לא מצאנו חתול שמתאים לסינון" + "נקה סינון".
- True-empty (pre-launch): "החתולים בדרך!" + publish CTA.
- Skeletons match exact card dimensions — zero layout shift.

## Detail page `/cats/[id]`
- Gallery of full variants (swipeable — RTL direction!), attribute rows, health notes, description, region.
- Primary CTA: "רוצה לאמץ את {name}" → questionnaire-if-missing → request form.
- Anon access to non-published cats: `notFound()` (RLS already returns nothing — handle the null).
- `generateMetadata`: Hebrew title "{name} מחפש/ת בית", OG image = cover full variant.

## Done checklist
- [ ] URL = state; share + back button verified
- [ ] Grid uses card variants + correct `sizes`
- [ ] Empty/skeleton states, live counter, chips
- [ ] searchParams zod-validated; single serialize utility
