import { describe, expect, it } from 'vitest'
import nextConfig from '../../next.config'
import { isStoredMediaPath } from './media'

const catId = '11111111-1111-4111-8111-111111111111'
const mediaId = '22222222-2222-4222-8222-222222222222'

// /_next/image is the only place where a stored object reaches a decoder that is
// not ours. Two gates keep attacker-controlled bytes away from it: the optimizer's
// own source allowlist, and the stored-path grammar that /api/media enforces
// before it will serve anything at all. Both are pinned here, because a widened
// allowlist is a silent change — nothing in the UI looks different when it breaks.

describe('image optimizer source allowlist', () => {
  const images = nextConfig.images

  it('accepts no remote source at all', () => {
    // A publisher can put arbitrary bytes in their own storage folder before
    // verify-stored-media.ts ever runs. A remote pattern for signed storage URLs
    // would hand exactly those bytes to the optimizer.
    expect(images?.remotePatterns ?? []).toEqual([])
  })

  it('allows only the /api/media route as a local source', () => {
    expect(images?.localPatterns).toEqual([{ pathname: '/api/media' }])
  })

  it('emits webp only and never renders SVG', () => {
    expect(images?.formats).toEqual(['image/webp'])
    expect(images?.dangerouslyAllowSVG).toBe(false)
  })
})

describe('stored media grammar keeps non-webp containers out of the optimizer', () => {
  const accepts = (name: string) => isStoredMediaPath(`${catId}/${mediaId}-${name}`)

  it('rejects every image container except webp', () => {
    const containers = [
      'card.avif', 'full.avif', 'card.svg', 'full.svg', 'card.jpg', 'card.jpeg',
      'card.png', 'card.gif', 'card.heic', 'card.heif', 'card.tiff', 'card.bmp',
      'card.ico', 'card.jxl'
    ]
    for (const name of containers) {
      expect(accepts(name), name).toBe(false)
    }
  })

  it('rejects a double extension that merely ends in webp', () => {
    expect(accepts('card.avif.webp')).toBe(false)
    expect(accepts('card.svg.webp')).toBe(false)
  })

  it('rejects a webp extension carrying a query, fragment or null byte', () => {
    expect(accepts('card.webp?format=avif')).toBe(false)
    expect(accepts('card.webp#.avif')).toBe(false)
    expect(accepts('card.webp%00.avif')).toBe(false)
  })

  it('rejects a webp name that escapes the cat folder', () => {
    expect(isStoredMediaPath(`${catId}/../${catId}/${mediaId}-card.webp`)).toBe(false)
  })

  it('accepts the two canonical webp variants', () => {
    expect(accepts('card.webp')).toBe(true)
    expect(accepts('full.webp')).toBe(true)
  })
})
