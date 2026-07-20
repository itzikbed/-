export function normalizeTurnstileSiteKey(value?: string | null): string | undefined {
  const siteKey = value?.trim()
  return siteKey || undefined
}

export function getConfiguredTurnstileSiteKey(): string | undefined {
  return normalizeTurnstileSiteKey(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
}

export function getCaptchaTokenForSubmission(
  siteKey: string | undefined,
  token: string | undefined
): string | undefined {
  if (!siteKey) return undefined

  const captchaToken = token?.trim()
  return captchaToken || undefined
}
