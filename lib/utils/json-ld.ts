export function serializeJsonLd(value: unknown): string {
  const json = JSON.stringify(value)
  return (json ?? 'null').replace(/</g, '\\u003c')
}
