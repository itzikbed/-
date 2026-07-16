# Hero Media Licenses

All hero video clips were fetched from Mixkit's asset CDN (`assets.mixkit.co`) and are
covered by the [Mixkit Stock Video Free License](https://mixkit.co/license/#videoFree),
which permits free use in personal and commercial projects without attribution.

## Clip inventory (4-clip rotation)

| File     | Content (verified visually by architect, 2026-07-16) | License     | Source page |
|----------|------------------------------------------------------|-------------|-------------|
| hero_1.* | Cream/orange cat face, extreme close-up              | Mixkit Free | not recorded at original download (Phase 2.5) |
| hero_2.* | Woman petting a black cat through a frame, medium    | Mixkit Free | not recorded at original download (Phase 2.5) |
| hero_3.* | Cat eye, extreme close-up (portrait orientation)     | Mixkit Free | not recorded at download |
| hero_4.* | Woman holding a black cat in a chair, medium         | Mixkit Free | not recorded at download |

## History note (2026-07-16, architect)

A fifth clip (previous `hero_2`, Mixkit asset #1241) was removed from the rotation:
it turned out to be a **portrait of a person, not a cat** — it was downloaded without
visual verification and the earlier version of this document described it incorrectly
("Cat face close-up portrait"). The earlier per-clip source-page links were likewise
not verified and have been replaced with "not recorded". The rotation now has 4 clips,
which satisfies DESIGN.md §6b.3 (4–5 clips). If the client supplies real cat footage,
prefer it for the fifth slot (prompt 06 Q13).

Pre-launch checklist item: re-trace the exact Mixkit source pages for the four clips
(search Mixkit by content) and record the URLs above, so license provenance is fully
documented.

## Processing

Each source clip was downloaded as 720p MP4 from `assets.mixkit.co`, trimmed to ≤8s,
scaled to 960px width (H.264 MP4 + VP9 WebM), muted, and given a JPEG poster frame.
All files are within the DESIGN.md §6b budget (≤1.2MB per clip).
