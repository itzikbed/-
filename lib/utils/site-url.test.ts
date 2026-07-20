import { describe, expect, it } from 'vitest'
import { resolveSiteOrigin } from './site-url'

describe('resolveSiteOrigin', () => {
  it('accepts an HTTPS production origin', () => {
    expect(resolveSiteOrigin('https://cats.example/path', true)).toBe('https://cats.example')
  })

  it('rejects a missing production origin', () => {
    expect(() => resolveSiteOrigin(undefined, true)).toThrow()
  })

  it('rejects insecure production origins', () => {
    expect(() => resolveSiteOrigin('http://cats.example', true)).toThrow()
  })

  it('allows HTTP only for local production-mode testing', () => {
    expect(resolveSiteOrigin('http://127.0.0.1:3000', true)).toBe('http://127.0.0.1:3000')
  })

  it('rejects URL credentials', () => {
    expect(() => resolveSiteOrigin('https://user:pass@cats.example', true)).toThrow()
  })

  it('uses a local origin only outside production', () => {
    expect(resolveSiteOrigin(undefined, false)).toBe('http://127.0.0.1:3000')
  })
})
