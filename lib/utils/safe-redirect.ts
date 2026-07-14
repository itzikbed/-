export function getSafeRedirect(path: string | null | undefined, fallback = '/'): string {
  if (!path) return fallback

  const trimmed = path.trim()
  if (!trimmed) return fallback

  // A path is safe if it starts with a single '/' and NOT '//' or '/\'
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
    return trimmed
  }

  return fallback
}
