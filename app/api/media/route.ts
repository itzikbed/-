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

  // 2. Try to create signed URL using user session (for owners/admins or logged-in users)
  let { data, error } = await supabaseUser.storage
    .from('cat-photos')
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

  // 3. If it fails (e.g. scraper or Next.js image optimizer fetching without cookies),
  // check if the cat is published (which we can determine from the RLS-accessible rows)
  if (error || !data?.signedUrl) {
    let isPublished = false
    if (catRow && catRow.status === 'published') {
      isPublished = true
    } else if (photoRow) {
      // Query the parent cat's status using user client to check if it's published
      const { data: cat } = await supabaseUser
        .from('cats')
        .select('status')
        .eq('id', photoRow.cat_id)
        .maybeSingle()
      if (cat && cat.status === 'published') {
        isPublished = true
      }
    }

    if (isPublished) {
      const serviceClient = createAdminClient()
      const res = await serviceClient.storage
        .from('cat-photos')
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
      
      data = res.data
      error = res.error
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
