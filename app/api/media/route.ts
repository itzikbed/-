import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isStoredMediaPath } from '@/lib/security/media'

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

  // 1. Check if the path is referenced by a cat_photos or cats row
  // that this user has RLS permission to read:
  const supabaseUser = await createClient()

  const { data: photoRow } = await supabaseUser
    .from('cat_photos')
    .select('id, cat_id')
    .or(`path_card.eq.${path},path_full.eq.${path}`)
    .maybeSingle()

  const { data: catRow } = await supabaseUser
    .from('cats')
    .select('id, status')
    .eq('video_path', path)
    .maybeSingle()

  if (!photoRow && !catRow) {
    return notFoundResponse()
  }

  // 2. Resolve published state up front: it drives both the service-role signing
  // fallback and the cache headers on the streamed response.
  let isPublished = catRow?.status === 'published'
  if (!isPublished && photoRow) {
    // Query the parent cat's status using user client to check if it's published
    const { data: cat } = await supabaseUser
      .from('cats')
      .select('status')
      .eq('id', photoRow.cat_id)
      .maybeSingle()
    isPublished = cat?.status === 'published'
  }

  // 3. Try to create signed URL using user session (for owners/admins or logged-in users)
  let { data, error } = await supabaseUser.storage
    .from('cat-photos')
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

  // 4. If it fails (e.g. scraper or Next.js image optimizer fetching without cookies),
  // fall back to the service role — but only for published cats
  if ((error || !data?.signedUrl) && isPublished) {
    const serviceClient = createAdminClient()
    const res = await serviceClient.storage
      .from('cat-photos')
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

    data = res.data
    error = res.error
  }

  if (error || !data?.signedUrl) return notFoundResponse()

  let signedUrl: URL
  try {
    signedUrl = new URL(data.signedUrl)
    const storageOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin

    const normalizeOrigin = (origin: string) => origin.replace('127.0.0.1', 'localhost')
    if (normalizeOrigin(signedUrl.origin) !== normalizeOrigin(storageOrigin)) return notFoundResponse()
  } catch {
    return notFoundResponse()
  }

  // 5. Videos keep the redirect: <video> follows it fine, and Supabase handles
  // Range requests (seeking) which a plain proxy would not.
  if (!path.toLowerCase().endsWith('.webp')) {
    const response = NextResponse.redirect(signedUrl, 307)
    response.headers.set('Cache-Control', 'private, no-store')
    return response
  }

  // 6. Images are streamed through this route rather than redirected: the Next.js
  // image optimizer (and some link-preview crawlers) reject redirect responses,
  // which renders every <Image> broken in production.
  try {
    const upstream = await fetch(signedUrl, { cache: 'no-store' })
    if (!upstream.ok || !upstream.body) return notFoundResponse()

    const headers = new Headers({
      'Content-Type': upstream.headers.get('Content-Type') || 'image/webp',
      // Published media is immutable (migration 0011), so public caching is safe.
      'Cache-Control': isPublished
        ? 'public, max-age=86400, stale-while-revalidate=604800'
        : 'private, no-store'
    })
    const contentLength = upstream.headers.get('Content-Length')
    if (contentLength) headers.set('Content-Length', contentLength)

    return new NextResponse(upstream.body, { status: 200, headers })
  } catch {
    return notFoundResponse()
  }
}
