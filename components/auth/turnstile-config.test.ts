import { describe, expect, it } from 'vitest'
import {
  getCaptchaTokenForSubmission,
  normalizeTurnstileSiteKey,
} from './turnstile-config'

describe('Turnstile deploy-safe configuration', () => {
  it('keeps Turnstile disabled when the site key is missing or blank', () => {
    expect(normalizeTurnstileSiteKey()).toBeUndefined()
    expect(normalizeTurnstileSiteKey('   ')).toBeUndefined()
  })

  it('does not submit a token when Turnstile is disabled', () => {
    expect(getCaptchaTokenForSubmission(undefined, 'forged-token')).toBeUndefined()
  })

  it('submits a normalized token only when a site key is configured', () => {
    const siteKey = normalizeTurnstileSiteKey('  public-site-key  ')

    expect(siteKey).toBe('public-site-key')
    expect(getCaptchaTokenForSubmission(siteKey, '  captcha-token  ')).toBe('captcha-token')
    expect(getCaptchaTokenForSubmission(siteKey, '   ')).toBeUndefined()
  })
})
