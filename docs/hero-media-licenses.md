# Hero Media Licenses

**As of 2026-07-18 every hero clip is original footage owned by the client** (the site
owner), filmed by her and supplied to Itzik via WhatsApp on 2026-07-18. No stock license
applies anywhere in the hero: the client holds full rights to all footage, no attribution
is required, and there is nothing to re-trace. All previous Mixkit stock clips were
removed from `/public/hero` on the same date (prompt 06 Q13 always preferred client
footage over stock).

The hero uses **two viewport clip sets** (DESIGN.md §6b.3): a landscape desktop set and a
portrait close-up mobile set. Each set's clip #1 has a matching SSR base poster,
art-directed per viewport via `<picture>` in `HeroFilm.tsx` (the LCP element — do not
change a clip #1 without its poster).

## Desktop set (landscape 848×478)

| File       | Content (every poster verified visually by architect, 2026-07-18) | Client source file |
|------------|--------------------------------------------------------------------|--------------------|
| hero_c1.*  | Tuxedo adult + tuxedo kitten side by side on kitchen floor, kitten looking up | וידאו למחשב 1.mp4 (full 5.1s) |
| hero_c2.*  | Same pair; the adult reaches up at a toy while the kitten watches   | וידאו למחשב 2.mp4 (full 5.5s) |
| hero_c3.*  | Long-haired tuxedo adult sitting on tiles, playing and looking up   | וידאו למחשב 3.mp4 (first 8s of 9s) |

## Mobile set (portrait 404×718)

| File       | Content (every poster verified visually by architect, 2026-07-18) | Client source file |
|------------|--------------------------------------------------------------------|--------------------|
| hero_cm1.* | Long-haired tuxedo face close-up, green eyes (mobile SSR base poster) | סרטון מלקוחה 1.mp4 (8s from 2s) |
| hero_cm2.* | Tuxedo kitten sitting against a white wall, looking up              | וידאו לטלפון 2.mp4 (first 8s) |
| hero_cm3.* | Tabby lying on floor tiles, medium close-up                         | וידאו לטלפון 1.mp4 (full 6.4s) |
| hero_cm4.* | Long-haired tuxedo + tabby together on a wooden chair               | וידאו לטלפון 3.mp4 (8s from 2s) |

## Processing (2026-07-18)

Each source clip was trimmed to ≤ 8s at 24fps and muted. Desktop clips kept their native
848×478 (no upscaling); mobile clips were scaled from 478×850 to 404×718. Encoded as
H.264 MP4 (crf 27, maxrate 1200k, faststart) + VP9 WebM (crf 40) with a JPEG poster frame
per clip. All files are within the DESIGN.md §6b budget (≤ 1.2MB per clip; actual range
148–562KB per file). Original client files remain with Itzik (Downloads, 2026-07-18) —
keep a copy before clearing that folder.

## History notes (stock era, retired 2026-07-18)

- 2026-07-12 → 2026-07-18 the hero ran on Mixkit stock clips (Mixkit Stock Video Free
  License). Provenance of the final stock set was fully documented in earlier versions of
  this file (git history).
- **2026-07-16:** a clip downloaded as Mixkit asset #1241 was removed from the rotation:
  it turned out to be a **portrait of a person, not a cat** — it was downloaded without
  visual verification. Lesson retained: every poster frame is verified visually before
  wiring, client footage included.
