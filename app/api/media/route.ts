import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isStoredMediaPath } from '@/lib/security/media'

const SIGNED_URL_TTL_SECONDS = 60

function notFoundResponse() {
  return new NextResponse(null, {
    status: 404,
    headers: { 'Cache-Control': 'private, no-store' }
  })
}

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path')
  if (!path || !isStoredMediaPath(path)) return notFoundResponse()

  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('cat-photos')
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) return notFoundResponse()

  try {
    const signedUrl = new URL(data.signedUrl)
    const storageOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin
    if (signedUrl.origin !== storageOrigin) return notFoundResponse()

    const response = NextResponse.redirect(signedUrl, 307)
    response.headers.set('Cache-Control', 'private, no-store')
    return response
  } catch {
    return notFoundResponse()
  }
}

