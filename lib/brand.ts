// The brand mark, defined once so the header, the favicon and the app icon
// cannot drift apart.
//
// The silhouette is a roof whose two peaks are a cat's ears — the name drawn
// rather than spelled. It replaces the 🐾 emoji that used to stand in for the
// second half of the wordmark: an emoji renders differently on every platform,
// carries no brand, and left the site's own name unreadable in its own header.

export const BRAND_MARK_VIEWBOX = '0 0 24 24'

// A square body with two ears rising straight off its walls. The ear tips lean
// outward, the way a cat's do, which is what stops the shape from reading as a
// plain gabled roof.
export const BRAND_MARK_PATH =
  'M3 21V11L5.5 3.5L10 11H14L18.5 3.5L21 11V21Z'

// A doorway, set off centre so the mark is never perfectly symmetrical.
export const BRAND_MARK_WINDOW = 'M12.6 21V15.8H16.2V21Z'

export const BRAND_COLORS = {
  pine: '#1C6650',
  pineDeep: '#154A3C',
  paper: '#F7F5F0',
  marmalade: '#EBAF56'
} as const
