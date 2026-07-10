# PROMPT 03 — Phase 3: Forms & flows (questionnaire, publisher, upload, requests)

Read `00-orchestrator.md` first. Skills: `forms-and-wizards`, `image-upload-pipeline`,
`supabase-fullstack`, `rtl-hebrew-webapp`, `code-quality`.
Every form: one zod schema in `lib/schemas/` shared client+server · Hebrew errors ·
required marker is the word "חובה" · server action re-checks auth+role · returns
`ActionResult`.

## Track A ∥ — Adopter questionnaire `/adopt/questionnaire`

Multi-step wizard (3 steps), fields EXACTLY per client spec / `adopter_profiles`:
1. **עליי:** גיל (חובה) · עיר מגורים (חובה) · מי גר בבית (חובה, textarea)
2. **הבית:** עוד חיות בבית? (+פירוט מותנה) · ניסיון עבר עם חתולים? · קומה (רשימה:
   בית קרקע פרטי/קומת גן/קומה 1/קומה 2/קומה 3 ומעלה, חובה) · רשתות בחלונות?
3. **מוטיבציה:** למה את/ה רוצה לאמץ חתול? (חובה) · באילו נסיבות תחפש/י למסור חתול
   שאימצת? (חובה) · מרפאה וטרינרית קבועה (אופציונלי)

Wizard mechanics per the forms skill (one useForm, per-step `trigger`, upsert to
`adopter_profiles` on every step change, `completed_at` on final submit). Success
screen: celebrating mascot + "השאלון נשמר! עכשיו אפשר לבקש לאמץ" + CTA back to the cat
they came from (`?cat=` param) or to the catalog. Warm tone throughout — this form
decides whether the admin trusts the adopter; microcopy explains WHY each question is
asked (one soft line under sensitive ones like נסיבות מסירה).

## Track B ∥ — Publisher application + cat-upload wizard (`/publish`)

1. **Application** (user → pending publisher): שם מלא · טלפון · גיל · עמותה/אדם פרטי ·
   אזור + עיר → updates profile fields + `publisher_status='pending'`. Status screen for
   pending ("הבקשה אצל האדמין 🐾") / blocked.
2. **Upload wizard** (approved publishers only — gate in layout + action), 4 steps:
   - פרטי החתול: שם · זכר/נקבה · גיל משוער (months/years input → computed `birth_est`)
   - בריאות: כמה חיסונים (0/1/2/3) · מעוקר/מסורס? · בעיות בריאות (טקסט) · חתול מיוחד?
     (+תיאור חובה כשמסומן — נכות/עיוורון/חירשות)
   - אופי והתאמה: מסתדר עם חתולים? עם כלבים? · נדרש סל אימוץ? (+סכום ב-₪ מותנה) ·
     כמה מילים לתאר אותו (min 20 chars) · אזור+עיר (prefilled from profile)
   - **תמונות:** the FULL image-upload-pipeline skill — EXIF/HEIC/WebP, two variants,
     sequential processing, reorder with cover, max 6. No shortcuts.
   Submit → `status='pending'` + success screen ("החתול נשלח לאישור").
3. **My cats** `/publish/my-cats`: list with status badges, edit (published→edit forces
   pending per §5), mark-adopted button, per-status empty states with mascot.

## Track C ∥ — Adoption request flow

- `/cats/[id]/request`: guarded (login + completed questionnaire, else redirect into the
  right step), message textarea (min 10, "ספרו למה דווקא {name}"), one open request per
  cat per adopter (handle the unique-index violation with a friendly Hebrew message).
- `/requests`: adopter's requests with status badges + withdraw (optimistic-guarded
  update per admin-moderation skill's concurrency pattern), empty state with mascot.
- Confirmation email `request-received` is Phase 4 — leave a `TODO(phase4)` call site.

## Exit criteria

DoD gates · draft persistence works (questionnaire survives refresh mid-wizard) ·
upload verified with real phone photos incl. an HEIC file · conditional fields clear on
hide · all four flows screenshot-ed mobile+desktop · ARCHITECTURE §3/§12 updated.
