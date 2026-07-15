import { createClient } from '@/lib/supabase/server'
import { isSameOriginMutation } from '@/lib/security/origin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return new NextResponse(null, { status: 403 })
  }

  const supabase = await createClient()
  await supabase.auth.signOut()

  const url = new URL('/', request.url)
  return NextResponse.redirect(url, {
    status: 302,
  })
}
