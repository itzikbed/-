# Hero Media Licenses

All hero video clips were fetched from Mixkit's asset CDN (`assets.mixkit.co`) and are
covered by the [Mixkit Stock Video Free License](https://mixkit.co/license/#videoFree),
which permits free use in personal and commercial projects without attribution.

Since 2026-07-16 the hero uses **two viewport clip sets** (DESIGN.md §6b.3): a landscape
desktop set and a portrait close-up mobile set, with `hero_1` shared as clip #1 of both
(its poster is the SSR base poster / LCP element).

## Desktop set (landscape 960×540)

| File      | Content (verified visually by architect, 2026-07-16) | Source page (Mixkit) |
|-----------|-------------------------------------------------------|----------------------|
| hero_1.*  | Cream/orange (flame-point) cat face, extreme close-up | [White, blue-eyed cat (#1538)](https://mixkit.co/free-stock-video/white-blue-eyed-cat-1538/) — re-traced 2026-07-16, same cat/wall/pose confirmed frame-by-frame |
| hero_d2.* | Ginger kitten licking its paw, close-up               | [Cute kitten licking a claw (#14018)](https://mixkit.co/free-stock-video/cute-kitten-licking-a-claw-14018/) |
| hero_d3.* | Pile of ginger + tuxedo kittens on a fur blanket      | [Little cats lying on an armchair (#32471)](https://mixkit.co/free-stock-video/little-cats-lying-on-an-armchair-32471/) |
| hero_d4.* | Ginger-white cat peering through green grass          | [White cat lying among the grasses seen up close (#22732)](https://mixkit.co/free-stock-video/white-cat-lying-among-the-grasses-seen-up-close-22732/) |
| hero_d5.* | Calico cat sitting outside a window, looking in       | [Beautiful cat meowing outside the window (#33154)](https://mixkit.co/free-stock-video/beautiful-cat-meowing-outside-the-window-33154/) |

## Mobile set (portrait; hero_3 is 720×1280, crops are 404×720)

| File      | Content (verified visually by architect, 2026-07-16) | Source page (Mixkit) |
|-----------|-------------------------------------------------------|----------------------|
| hero_1.*  | Shared with desktop set (see above)                   | see above |
| hero_3.*  | Cat eye, extreme close-up (native portrait)           | [White cat with blue eyes (#1545)](https://mixkit.co/free-stock-video/white-cat-with-blue-eyes-1545/) — re-traced 2026-07-16, same eye/fur confirmed frame-by-frame |
| hero_m2.* | Black cat's yellow eye, extreme close-up (portrait crop) | [Black cat with yellow eyes (#1539)](https://mixkit.co/free-stock-video/black-cat-with-yellow-eyes-1539/) |
| hero_m3.* | Ginger kitten licking its paw, face close-up (portrait crop of the hero_d2 source) | [Cute kitten licking a claw (#14018)](https://mixkit.co/free-stock-video/cute-kitten-licking-a-claw-14018/) |
| hero_m4.* | Sleeping ginger kitten face, close-up (portrait crop) | [Cute red kitten sleeping in the couch (#32319)](https://mixkit.co/free-stock-video/cute-red-kitten-sleeping-in-the-couch-32319/) |

## History notes

- **2026-07-16 (viewport split):** previous `hero_2` (woman petting a black cat through a
  frame — failed the mobile legibility bar, client reported low quality) and `hero_4`
  (woman holding a black cat — cat ≈ 30% of frame height, below the ≥ 40% bar) were
  **removed and deleted from `/public/hero`**. Their source pages were never recorded and
  were not re-traced before deletion. Every clip now in the rotation was downloaded from a
  named source page and its poster frame was verified visually before wiring.
- **2026-07-16 (earlier):** a clip downloaded as Mixkit asset #1241 was removed from the
  rotation: it turned out to be a **portrait of a person, not a cat** — it was downloaded
  without visual verification and an earlier version of this document described it
  incorrectly ("Cat face close-up portrait").
- If the client supplies real cat footage, prefer it over stock (prompt 06 Q13) — replace
  files in `/public/hero` and update this table.

## Processing

Each source clip was downloaded as 720p MP4 from `assets.mixkit.co`, trimmed to ≤ 8s at
24fps and muted. Desktop clips were scaled to 960×540; mobile clips were art-direction
cropped to 404×720 portrait centered on the cat (crop offsets chosen per clip after
frame-by-frame review). Encoded as H.264 MP4 (crf 27, maxrate 1200k) + VP9 WebM (crf 40)
with a JPEG poster frame per clip. All files are within the DESIGN.md §6b budget
(≤ 1.2MB per clip; actual range 100–660KB per file).
