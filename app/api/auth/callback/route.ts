import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/lib/supabase/database.types'
import { getSafeRedirect } from '@/lib/utils/safe-redirect'
import { getTrustedSiteOrigin } from '@/lib/utils/site-url'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = getSafeRedirect(searchParams.get('next'))

  let siteOrigin: string
  try {
    siteOrigin = getTrustedSiteOrigin()
  } catch {
    console.error('Invalid NEXT_PUBLIC_SITE_URL configuration')
    return new NextResponse(null, { status: 500 })
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // SetAll can be ignored if handled by middleware
            }
          },
        },
      }
    )
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, siteOrigin))
    }
  }

  // Redirect to login with error
  return NextResponse.redirect(new URL('/login?error=auth_callback_failed', siteOrigin))
}
