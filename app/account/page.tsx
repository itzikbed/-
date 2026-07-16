import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { strings } from '@/lib/strings'
import { AccountDashboard } from '@/components/account/AccountDashboard'

export const metadata = {
  title: `${strings.account.myAccount} — ${strings.common.siteName}`,
  robots: {
    index: false,
    follow: false
  }
}

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/account')
  }

  // Fetch profiles row
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/')
  }

  return (
    <div className="flex-grow bg-paper py-10 select-none">
      <div className="app-container max-w-2xl space-y-6">
        
        {/* Navigation & Header */}
        <div className="space-y-1">
          <nav className="text-sm font-semibold text-ink-soft flex items-center gap-1.5">
            <Link href="/" className="hover:text-pine hover:underline">
              {strings.nav.home}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            <span className="text-ink">{strings.account.myAccount}</span>
          </nav>
          <h1 className="text-3xl font-display font-extrabold text-ink">
            {strings.account.title}
          </h1>
        </div>

        {/* Dashboard Panels */}
        <AccountDashboard user={user} profile={profile} />

      </div>
    </div>
  )
}
