# Hero Media Licenses

All hero video clips are sourced from [Mixkit](https://mixkit.co/) and are covered by the
[Mixkit Stock Video Free License](https://mixkit.co/license/#videoFree), which permits
free use in personal and commercial projects without attribution.

## Clip inventory

| File       | Source                                                    | Content                          | Duration | License      |
|------------|-----------------------------------------------------------|----------------------------------|----------|--------------|
| hero_1.*   | [Mixkit #1544](https://mixkit.co/free-stock-video/1544/)  | Orange tabby cat close-up        | 8s       | Mixkit Free  |
| hero_2.*   | [Mixkit #1241](https://mixkit.co/free-stock-video/1241/)  | Cat face close-up portrait       | 7s       | Mixkit Free  |
| hero_3.*   | [Mixkit #1547](https://mixkit.co/free-stock-video/1547/)  | Cat grooming medium shot         | 8s       | Mixkit Free  |
| hero_4.*   | [Mixkit #1545](https://mixkit.co/free-stock-video/1545/)  | Kitten playing close-up          | 8s       | Mixkit Free  |
| hero_5.*   | [Mixkit #1543](https://mixkit.co/free-stock-video/1543/)  | Cat resting on blanket           | 8s       | Mixkit Free  |

## Processing

Each source clip was:
1. Downloaded as 720p MP4 from Mixkit.
2. Trimmed to 7–8 seconds.
3. Transcoded to **960px-wide** WebM (VP9, CRF 32, 300kbps cap) and MP4 (H.264, CRF 28).
4. Audio stripped (`-an`).
5. Poster frame extracted as JPEG (`-q:v 2`).

All hero clips are lazy-loaded except clip #1 which preloads its poster for LCP.

## Compliance with DESIGN.md §6b.3

All clips meet the mobile-legibility bar: close-up or medium shots only, cat fills ≥ 40%
of frame height at 390px width. No wide establishing shots.
