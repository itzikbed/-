import uiStrings from '@/content/he/ui.json'

export const strings = uiStrings

type UISections = keyof typeof uiStrings

export function gendered(
  section: UISections,
  key: string,
  sex: string | null | undefined
): string {
  const sec = uiStrings[section] as Record<string, string>
  if (!sec) return ''

  // Determine the primary suffix based on sex
  let suffix = 'Unknown'
  if (sex === 'male') {
    suffix = 'Male'
  } else if (sex === 'female') {
    suffix = 'Female'
  }

  // 1. Try resolved variant key
  const resolvedKey = `${key}${suffix}`
  if (resolvedKey in sec) {
    return sec[resolvedKey]
  }

  // 2. Try Male form
  const maleKey = `${key}Male`
  if (maleKey in sec) {
    return sec[maleKey]
  }

  // 3. Try un-suffixed key
  if (key in sec) {
    return sec[key]
  }

  return ''
}
