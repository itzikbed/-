export function getSafeRedirect(path: string | null | undefined, fallback = '/'): string {
  if (!path) return fallback

  const trimmed = path.trim()
  if (!trimmed) return fallback

  const pathOnly = trimmed.split(/[?#]/, 1)[0]
  if (/[\u0000-\u001f\u007f\\]/.test(trimmed) || /%2f|%5c/i.test(pathOnly)) return fallback
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback

  try {
    const base = new URL('https://safe.invalid')
    const parsed = new URL(trimmed, base)
    if (parsed.origin !== base.origin) return fallback
    return parsed.pathname + parsed.search + parsed.hash
  } catch {
    return fallback
  }
}
