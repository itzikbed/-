# DESIGN.md — "Cat's Eye" (עין החתול)

> Visual source of truth. Agents building any UI read this file in full before writing markup.
> Rule of thumb: if a color/font/radius/motion value is not derived from this file, it's wrong.

## 1. Direction

**Modern warmth, built from the subject.** The palette is literally a cat's eye: deep pine
green + marmalade amber on warm paper. Green carries trust and calm (this is a vetted,
admin-moderated platform); amber carries warmth and action (ginger fur, sunbeams). Rounded
geometry everywhere echoes a curled-up cat. Professional ≠ corporate: the tone is a
well-run shelter, not a bank.

**Deliberately avoided:** the cream + terracotta + serif-display look (current AI-default
aesthetic), pink/purple gradients, paw-print wallpaper, cartoon fonts, stock photos of
humans hugging cats. Real listing photos are the imagery. Personality lives in ONE mascot,
the amber buttons, and the copy.

**Signature element — the Peeking Cat (החתול המציץ).** A single line-art cat character
(2px ink stroke, marmalade accent on ears/tail only) that peeks over edges: over the hero's
two entry cards on hover, in empty states, on the 404, and on the success screen after a
request is sent. Same character everywhere — drawn once as a small SVG set (peek-over-edge,
sitting, sleeping, celebrating). No other decorative illustration on the site.

## 2. Color tokens (OKLCH first, hex ≈ sRGB fallback)

```css
:root {
  /* Paper — 60% */
  --paper:        oklch(97.2% 0.006 95);   /* ≈ #F7F5F0 warm paper bg */
  --surface:      oklch(99.3% 0.003 95);   /* ≈ #FDFCFA cards, inputs */
  --border:       oklch(90%   0.010 100);  /* ≈ #E3E0D7 hairlines */
  /* Ink — 30% */
  --ink:          oklch(25%   0.020 170);  /* ≈ #1E2B25 pine-charcoal text */
  --ink-soft:     oklch(45%   0.020 170);  /* ≈ #55645C secondary text */
  /* Brand — 10% */
  --pine:         oklch(40%   0.080 168);  /* ≈ #1C6650 links, focus, secondary btn */
  --pine-soft:    oklch(93%   0.030 165);  /* ≈ #DFF0E7 chips, success tint */
  --marmalade:    oklch(75%   0.130 75);   /* ≈ #EBAF56 primary CTA bg (ink text!) */
  --marmalade-dp: oklch(69%   0.140 70);   /* ≈ #DD9C3D CTA hover */
  --marmalade-sf: oklch(95%   0.040 80);   /* ≈ #FBEFD8 highlight tint */
  /* Status */
  --success:      var(--pine);
  --warning:      oklch(62%   0.130 70);   /* deep amber, ink text */
  --danger:       oklch(52%   0.160 30);   /* ≈ #B0432F clay red, white text */
}
```

Usage map (60-30-10): paper/surface carry the page; ink carries all text; pine is the
brand voice (headings' accent, links, focus rings, active filter chips, secondary buttons
with white text); marmalade is reserved for the primary action on each screen + tiny
accents. If a screen has two amber elements competing, one of them is wrong.

**Contrast contract (verify in QA — hexes above are approximations):**
ink on paper ≥ 12:1 · ink on marmalade ≥ 5:1 · white on pine ≥ 6:1 · white on danger ≥ 4.5:1.
Run a computed-value WCAG audit before every milestone screenshot; adjust L, not hue.

## 3. Typography

| Role | Family | Weights | Notes |
|---|---|---|---|
| Display / headings | **Rubik** | 700, 800 | Rounded terminals = the brand's softness. H1 uses 800. |
| Body / UI | **Assistant** | 400, 600 | Neutral, excellent Hebrew readability. 600 for labels/buttons. |

Both via `next/font/google`, `subsets: ['hebrew','latin']`, `display: 'swap'`. Two families
maximum, ever. Scale: h1 `clamp(2rem, 5vw, 2.75rem)/1.15` · h2 `1.5–1.75rem/1.2` ·
h3 `1.25rem` · body `1rem/1.7` · small `0.875rem`. Body text color is `--ink`, never pure black.

Suggested landing H1: **"לכל חתול מגיע בית."** Sub: one sentence, then the two doors.

## 4. Shape, depth, spacing

- Radius: cards **20px**, buttons **pill (9999px)**, inputs/chips **12px**, photos inside cards **14px**.
- Shadows (warm, never gray-blue): resting `0 1px 2px oklch(25% 0.02 170 / .06), 0 4px 16px oklch(25% 0.02 170 / .06)`; hover raises the second layer to 24px / .10.
- Spacing rhythm: 4px base; sections 64–96px apart on desktop, 40–56px mobile. Generous whitespace is part of the "calm shelter" feel — don't compress.

## 5. Components

- **Primary button:** marmalade bg, `--ink` text, Assistant 600, pill, height 48px (44px min touch target). Hover: `--marmalade-dp` + lift 1px. Example: "רוצה לאמץ את מִיצי".
- **Secondary button:** pine bg, white text. **Tertiary:** ghost with pine text.
- **Cat card:** surface bg, 20px radius, 4:3 cover photo (card variant), name in Rubik 700 18px, meta line (age bucket · sex) in `--ink-soft`, region chip pine-soft. Whole card is the link. Hover: lift 2px + shadow step.
- **Badges:** pill, soft tints — "אומץ! 🎉" pine-soft/pine · "ממתין לאישור" marmalade-sf/deep amber · rejected clay-soft.
- **Inputs:** surface bg, 1px `--border`, 12px radius, focus = 2px pine ring offset 2px. Error: clay border + message below in clay.
- **Two-door hero:** two large cards (אני רוצה לאמץ / אני רוצה למסור חתול) — adopt door uses marmalade treatment, publish door pine outline. Peeking Cat rises over the hovered card's top edge (translateY, 200ms).

## 6. Photography & imagery

- Listing photos only in the catalog — no stock. Upload UI coaches: "תמונה בגובה עיני החתול, אור טבעי, בלי פילטרים".
- Cover crops locked to 4:3, `object-cover`. Adopted cats are hidden from the public site at launch (settled 2026-07-16, ARCHITECTURE §11); the "סיפורי אימוץ" showcase — and any badge/grayscale treatment for it — is deferred post-launch.
- Mascot SVGs live in `components/mascot/`; single ink stroke width site-wide (2px at 1x).

### 6a. Landing hero media — the site must feel ALIVE (not optional)

The landing hero is full-bleed media, not a flat color block. **Skipping this = the task is
not done.** Two acceptable implementations, in order of preference:

1. **Video loop:** a short muted cat clip — `<video autoplay muted loop playsinline
   poster={heroPoster}>`, self-hosted in `/public/hero/`, WebM+MP4, ≤ 8s, ≤ 2.5MB,
   1280px wide is enough. Warm natural light, one cat, slow motion feel (a cat stretching,
   blinking, tail flick — not frantic play). `prefers-reduced-motion` → render the poster
   image only.
2. **Photo:** a single warm, high-quality cat photo (amber/ginger tones that echo
   `--marmalade`, or green-eyed cat echoing `--pine`), art-directed crop per breakpoint.

Both get an ink-tinted gradient overlay (`oklch(25% 0.02 170 / .35→.0)`, bottom→top in RTL
reading flow) so the H1 keeps ≥ 4.5:1 contrast. The two-door cards sit ON the media, on
`--surface` with the resting shadow. Source: openly-licensed (Pexels/Pixabay video, Unsplash)
— cats only, no humans, no watermarks; record the source URL in a comment.

Secondary "alive" touches (pick at least two): latest-cats strip with real listing photos
on the landing · Peeking Cat hover rise on the two doors · subtle `--pine-soft` organic
blob shapes behind section headings (max 2 per page, opacity ≤ .5) · hero H1 fade+rise-in
once on load (300ms, respects reduced-motion).

### 6b. Motion & Video System v2 — "החתול החי" (MOBILE-FIRST)

The site's signature: **cats move.** Every rule below is designed for a 6-inch screen on
cellular data first; desktop inherits and may enhance.

**1. Living cat cards (flagship).** A cat may have one short clip (`cats.video_path`,
nullable — new migration). Card behavior: photo cover by default; the clip plays muted,
looped, WITHOUT controls when the card "wakes". Mobile: the card closest to viewport
center wakes — exactly ONE plays at any moment (IntersectionObserver picks the winner);
Desktop: wake on hover/focus. Clip spec: ≤ 3s · 480px longest edge · WebM+MP4 · ≤ 1MB ·
first frame == cover crop so the swap is seamless. Cards without video stay photos —
never fake it.

**1a. Video affordance (required on every video card).** Idle state ALWAYS shows the
cover photo, plus a small pill badge at the photo's bottom-start: play glyph + "סרטון"
(surface/85 bg, backdrop-blur, ink text, Assistant 600 small). The badge fades out
(150ms) while the clip plays and returns on pause; it stays visible when video is
disabled (saveData / reduced-motion) — the promise is kept on the detail page.
`aria-label`: "לחצו לצפייה בסרטון של {name}". Strings live in ui.json.

**1b. Clip on the detail page.** A cat with a clip shows it in the gallery as the item
after the cover: cover-photo poster + centered play button, tap toggles play/pause
(muted, loop, no native controls). Explicit user tap MAY fetch the clip even under
saveData (opt-in); reduced-motion still gets poster + tap-to-play, nothing autoplays.
This is what makes the card badge truthful — clicking a card always leads somewhere the
video can actually be watched.

**2. Card → detail morph.** Navigating card→cat page uses the View Transitions API:
the card photo morphs into the detail hero (shared element). 250–300ms, transform/opacity
only. Zero bytes; this is the "feels like an app" moment on mobile. Falls back to a normal
navigation on unsupported browsers — never polyfill.

**3. Hero film sequence.** 4–5 warm clips crossfading (6–8s each, 1.5s fade). Only clip #1
loads eagerly; the rest lazy after `load`. Each ≤ 1.2MB, 960px is enough. Poster-first always.
**Mobile legibility (client feedback via Itzik, 2026-07-16):** the hero is watched on a
6-inch screen — every clip must read at 390px wide: close-up/medium shots only, the cat
filling roughly ≥ 40% of frame height; no wide establishing shots. Visibly over-compressed
sources fail this bar too (the original `hero_2` is the canonical example to replace).

**4. Self-drawing mascot.** Peeking Cat ink strokes draw themselves (CSS
`stroke-dashoffset`, ~700ms) when their section enters the viewport — used in
how-it-works and empty states. Zero data cost.

**5. Micro-life.** Logo ח-ears twitch once every ~20s (SVG transform) · slow CSS sunbeam
gradient drifting on paper sections (≥ 60s cycle, opacity ≤ .06).

**Hard budgets (gate items, verify in DevTools mobile throttling):**
- Above-the-fold transfer on mobile ≤ 2.5MB total, including clip #1.
- Only ONE video element playing at any time, site-wide. Off-screen ⇒ `pause()`.
- `document.hidden` ⇒ pause everything. `navigator.connection.saveData` ⇒ posters only,
  no video requests at all.
- `prefers-reduced-motion` ⇒ posters/static ink everywhere: no autoplay, no draw-on,
  no morph (instant navigation), no twitch, no sunbeam.
- Ambient/stock video ships from `/public` (Vercel bandwidth), NEVER from Supabase
  storage; publisher cat clips live in Supabase, playback poster-first.

## 7. Motion

150–200ms `ease-out` micro-interactions only: card lift, button press (scale .98), heart/save pop (scale 1 → 1.25 → 1), Peeking Cat rise, filter drawer slide. **One exception to "no page transitions": the card→detail shared-element morph defined in §6b.** Still banned: parallax, scroll-jacking, scroll-scrubbed video. Everything transform/opacity only, and fully disabled under `prefers-reduced-motion` (mascot appears static, no lifts, no morph).

## 8. Accessibility floor

WCAG AA on every computed pair · visible focus (pine ring) on all interactive elements ·
touch targets ≥ 44px · `alt` = cat name + one attribute ("מיצי, חתולה ג'ינג'ית") · form
errors announced (`role="alert"`) · never color-only status (badge text always present).

## 9. Anti-patterns (hard no)

Cream+terracotta AI-default look · dark mode (v1) · more than one amber CTA per screen ·
paw-print backgrounds · emoji as icons in UI chrome (allowed inside badges/copy sparingly) ·
serif display fonts · letter-spaced Hebrew headings · gradients as decoration.
