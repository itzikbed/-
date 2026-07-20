import { describe, expect, it } from 'vitest'
import { serializeJsonLd } from './json-ld'

describe('serializeJsonLd', () => {
  it('escapes HTML tag openings while preserving valid JSON', () => {
    const value = { description: '</script><script>alert(1)</script>' }
    const serialized = serializeJsonLd(value)

    expect(serialized).not.toContain('</script>')
    expect(serialized).toContain('\\u003c/script>')
    expect(JSON.parse(serialized)).toEqual(value)
  })
})
