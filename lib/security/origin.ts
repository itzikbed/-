export function isSameOriginMutation(request: Request): boolean {
  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') return false

  const origin = request.headers.get('origin')
  if (!origin) return process.env.NODE_ENV !== 'production'

  try {
    const requestUrl = new URL(request.url)
    const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
    const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
    const expectedOrigin = forwardedHost
      ? `${forwardedProto || requestUrl.protocol.replace(':', '')}://${forwardedHost}`
      : requestUrl.origin

    return new URL(origin).origin === new URL(expectedOrigin).origin
  } catch {
    return false
  }
}

