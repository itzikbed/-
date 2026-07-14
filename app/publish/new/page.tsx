import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { strings } from '@/lib/strings'
import { CatUploadWizard } from '@/components/cats/CatUploadWizard'
import { ChevronRight } from 'lucide-react'

export const metadata = {
  title: 'פרסום חתול חדש — בית לחתול',
  description: 'פרסמו מודעה חדשה למסירת חתול לאימוץ.'
}

export default async function NewCatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/publish/new')
  }

  // Verify approved publisher status
  const { data: profile } = await supabase
    .from('profiles')
    .select('publisher_status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.publisher_status !== 'approved') {
    redirect('/publish')
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
            <Link href="/publish/my-cats" className="hover:text-pine hover:underline">
              {strings.publish.myCats}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            <span className="text-ink">{strings.publish.addCatBtn}</span>
          </nav>
          <h1 className="text-3xl font-display font-extrabold text-ink">
            {strings.publish.newCatTitle}
          </h1>
        </div>

        {/* Wizard Card */}
        <CatUploadWizard />

      </div>
    </div>
  )
}
