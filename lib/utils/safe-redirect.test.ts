import { describe, it, expect } from 'vitest'
import { getSafeRedirect } from './safe-redirect'

describe('safe-redirect utility', () => {
  it('allows safe relative paths', () => {
    expect(getSafeRedirect('/admin')).toBe('/admin')
    expect(getSafeRedirect('/cats?x=1')).toBe('/cats?x=1')
  })

  it('rejects protocol-relative paths', () => {
    expect(getSafeRedirect('//evil.com')).toBe('/')
  })

  it('rejects absolute URLs', () => {
    expect(getSafeRedirect('https://evil.com')).toBe('/')
    expect(getSafeRedirect('http://evil.com/admin')).toBe('/')
  })

  it('rejects backslash protocol relative paths', () => {
    expect(getSafeRedirect('/\\evil.com')).toBe('/')
  })

  it('rejects javascript URIs', () => {
    expect(getSafeRedirect('javascript:alert(1)')).toBe('/')
  })

  it('returns fallback for empty or null paths', () => {
    expect(getSafeRedirect(null)).toBe('/')
    expect(getSafeRedirect(undefined)).toBe('/')
    expect(getSafeRedirect('')).toBe('/')
    expect(getSafeRedirect('   ')).toBe('/')
  })

  it('uses custom fallback if provided', () => {
    expect(getSafeRedirect('https://evil.com', '/cats')).toBe('/cats')
  })
})
