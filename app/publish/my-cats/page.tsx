import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { strings } from '@/lib/strings'
import { MyCatsList } from '@/components/cats/MyCatsList'
import { ChevronRight, Plus } from 'lucide-react'

export const metadata = {
  title: `${strings.publish.myCats} — ${strings.common.siteName}`,
  description: strings.publish.myCatsPageDesc
}

export default async function MyCatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/publish/my-cats')
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

  // Fetch cats with photos
  const { data: cats } = await supabase
    .from('cats')
    .select('*, cat_photos(*)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex-grow bg-paper py-10 select-none">
      <div className="app-container max-w-4xl space-y-6">
        
        {/* Header / Nav */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <nav className="text-sm font-semibold text-ink-soft flex items-center gap-1.5">
              <Link href="/" className="hover:text-pine hover:underline">
                {strings.nav.home}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              <span className="text-ink">{strings.publish.myCats}</span>
            </nav>
            <h1 className="text-3xl font-display font-extrabold text-ink">
              {strings.publish.dashboardTitle}
            </h1>
          </div>

          <Link
            href="/publish/new"
            className="inline-flex items-center gap-1.5 font-bold px-5 py-3 bg-marmalade text-ink hover:bg-marmalade-dp rounded-btn shadow-resting transition-all active:scale-98 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2 self-start sm:self-auto"
          >
            <Plus className="w-5 h-5" />
            {strings.publish.addCatBtn}
          </Link>
        </div>

        {/* List component */}
        <MyCatsList initialCats={cats || []} />

      </div>
    </div>
  )
}
