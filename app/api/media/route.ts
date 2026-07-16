import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isStoredMediaPath, isUuid } from '@/lib/security/media'

export const dynamic = 'force-dynamic'

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

  // 1. Try to create signed URL using user session (for owners/admins or logged-in users)
  const supabaseUser = await createClient()
  let { data, error } = await supabaseUser.storage
    .from('cat-photos')
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

  // 2. If it fails (e.g. Next.js image optimizer fetching without cookies), check if the cat is published
  if (error || !data?.signedUrl) {
    const catId = path.split('/')[0]
    if (isUuid(catId)) {
      const serviceClient = createAdminClient()
      const { data: cat } = await serviceClient
        .from('cats')
        .select('status')
        .eq('id', catId)
        .single()

      if (cat && cat.status === 'published') {
        const res = await serviceClient.storage
          .from('cat-photos')
          .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
        
        data = res.data
        error = res.error
      }
    }
  }

  if (error || !data?.signedUrl) return notFoundResponse()

  try {
    const signedUrl = new URL(data.signedUrl)
    const storageOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin
    
    const normalizeOrigin = (origin: string) => origin.replace('127.0.0.1', 'localhost')
    if (normalizeOrigin(signedUrl.origin) !== normalizeOrigin(storageOrigin)) return notFoundResponse()

    const response = NextResponse.redirect(signedUrl, 307)
    response.headers.set('Cache-Control', 'private, no-store')
    return response
  } catch {
    return notFoundResponse()
  }
}
