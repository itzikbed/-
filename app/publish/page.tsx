import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { strings } from '@/lib/strings'
import { Mascot } from '@/components/mascot/Mascot'
import { PublisherApplicationForm } from '@/components/auth/PublisherApplicationForm'

export const metadata = {
  title: `${strings.publish.title} — ${strings.common.siteName}`,
  description: strings.publish.publishPageDesc
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
    // Retry UI on profile fetch failure
    return (
      <div className="flex-grow bg-paper py-16 flex items-center justify-center">
        <div className="text-center font-semibold text-ink-soft space-y-4">
          <p>{strings.publish.loadError}</p>
          <a 
            href="/publish" 
            className="inline-flex items-center justify-center font-sans font-bold rounded-btn min-h-[40px] px-6 text-sm bg-marmalade text-ink hover:bg-marmalade-dp transition-colors shadow-resting active:scale-98 cursor-pointer"
          >
            {strings.publish.retryBtn}
          </a>
        </div>
      </div>
    )
  }

  const status = profile.publisher_status || 'none'

  // approved uploader redirects to /publish/my-cats
  if (status === 'approved') {
    redirect('/publish/my-cats')
  }

  // Admins moderate the queue themselves — grant publisher access on entry
  // instead of routing them through their own approval. RLS + the profile
  // guard trigger permit this transition only for admins.
  if (profile.role === 'admin' && (status === 'none' || status === 'pending')) {
    const { data: granted } = await supabase
      .from('profiles')
      .update({ publisher_status: 'approved' })
      .eq('id', user.id)
      .eq('role', 'admin')
      .in('publisher_status', ['none', 'pending'])
      .select('id')

    if (granted && granted.length > 0) {
      const { error: logErr } = await supabase.from('moderation_log').insert({
        actor_id: user.id,
        entity_type: 'publisher',
        entity_id: user.id,
        action: 'approve'
      })
      if (logErr) {
        console.error('Failed to insert moderation log:', logErr)
      }
      redirect('/publish/my-cats')
    }
  }

  let rejectionReason = null
  if (status === 'blocked') {
    const { data: latestLog } = await supabase
      .from('moderation_log')
      .select('reason')
      .eq('entity_id', user.id)
      .eq('entity_type', 'publisher')
      .in('action', ['reject', 'block'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    rejectionReason = latestLog?.reason || null
  }

  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@example.com'

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
            <p className="text-base font-semibold text-ink-soft leading-relaxed max-w-md mx-auto mb-2">
              {strings.publish.blockedDesc}
            </p>
            {rejectionReason && (
              <div className="bg-danger/10 border border-danger/20 rounded-input p-4 text-start">
                <span className="font-bold text-danger block mb-1">{strings.publish.rejectionReasonLabel}</span>
                <p className="text-sm text-ink-soft font-semibold">{rejectionReason}</p>
              </div>
            )}
            <div className="pt-4 border-t border-border/40 text-sm text-ink-soft leading-relaxed">
              {strings.publish.supportContactIntro}{' '}
              <a href={`mailto:${contactEmail}`} className="text-pine font-bold hover:underline">
                {contactEmail}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
