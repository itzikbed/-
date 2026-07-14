import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { strings } from '@/lib/strings'
import { Mascot } from '@/components/mascot/Mascot'
import { PublisherApplicationForm } from '@/components/auth/PublisherApplicationForm'

export const metadata = {
  title: 'למסירת חתול — בית לחתול',
  description: 'הגשת בקשה למסירת חתול או ניהול מודעות המסירה שלך.'
}

export default async function PublishPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/publish')
  }

  // Fetch profiles row
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Fallback if profile trigger delayed
    return (
      <div className="flex-grow bg-paper py-16 flex items-center justify-center">
        <div className="text-center font-semibold text-ink-soft">
          {strings.common.loading}
        </div>
      </div>
    )
  }

  const status = profile.publisher_status || 'none'

  // approved uploader redirects to /publish/my-cats
  if (status === 'approved') {
    redirect('/publish/my-cats')
  }

  return (
    <div className="flex-grow bg-paper py-10 md:py-16 select-none">
      <div className="app-container max-w-lg">
        {status === 'none' && (
          <div className="bg-surface border border-border rounded-card p-6 md:p-8 shadow-resting relative overflow-visible">
            {/* Mascot Peeking */}
            <div className="absolute -top-[45px] start-1/2 -translate-x-1/2 rtl:translate-x-1/2">
              <Mascot pose="peek" width={100} height={60} />
            </div>
            
            <div className="pt-4">
              <PublisherApplicationForm 
                initialData={{
                  fullName: profile.full_name || '',
                  phone: profile.phone || ''
                }}
              />
            </div>
          </div>
        )}

        {status === 'pending' && (
          <div className="bg-surface border border-border rounded-card p-8 md:p-12 shadow-resting text-center space-y-6">
            <Mascot pose="sleeping" width={140} height={100} animateOnScroll />
            <h2 className="text-2xl font-display font-extrabold text-ink">
              {strings.publish.pendingTitle}
            </h2>
            <p className="text-base font-semibold text-ink-soft leading-relaxed max-w-md mx-auto">
              {strings.publish.pendingDesc}
            </p>
          </div>
        )}

        {status === 'blocked' && (
          <div className="bg-surface border border-border rounded-card p-8 md:p-12 shadow-resting text-center space-y-6">
            <Mascot pose="sitting" width={120} height={140} className="grayscale" />
            <h2 className="text-2xl font-display font-extrabold text-danger">
              {strings.publish.blockedTitle}
            </h2>
            <p className="text-base font-semibold text-ink-soft leading-relaxed max-w-md mx-auto">
              {strings.publish.blockedDesc}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
