const DEVELOPMENT_ORIGIN = 'http://127.0.0.1:3000'

export function resolveSiteOrigin(
  configuredUrl: string | undefined,
  isProduction: boolean
): string {
  const candidate = configuredUrl?.trim() || (isProduction ? '' : DEVELOPMENT_ORIGIN)
  if (!candidate) {
    throw new Error('NEXT_PUBLIC_SITE_URL is required in production')
  }

  const parsed = new URL(candidate)
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error('NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin without credentials')
  }
  const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
  if (isProduction && parsed.protocol !== 'https:' && !isLocalhost) {
    throw new Error('NEXT_PUBLIC_SITE_URL must use HTTPS in production')
  }

  return parsed.origin
}

export function getTrustedSiteOrigin(): string {
  return resolveSiteOrigin(
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NODE_ENV === 'production'
  )
}

export function getTrustedSiteUrl(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new Error('Site URL path must be relative to the configured origin')
  }
  return new URL(path, getTrustedSiteOrigin()).toString()
}
