import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Mascot } from '@/components/mascot/Mascot'
import { Badge } from '@/components/ui/Badge'
import { WithdrawButton } from './WithdrawButton'
import { REGIONS, RegionId } from '@/lib/constants'
import Link from 'next/link'
import { Compass, Calendar } from 'lucide-react'

import { strings } from '@/lib/strings'

export const metadata = {
  title: strings.requests.metaTitle,
  description: strings.requests.metaDesc
}

export default async function RequestsPage() {
  const supabase = await createClient()

  // Guard: Authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?redirect=/requests')
  }

  // Fetch adoption requests
  const { data: requests } = await supabase
    .from('adoption_requests')
    .select('*, cats(name, region, city)')
    .eq('adopter_id', user.id)
    .order('created_at', { ascending: false })

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'pending'
      case 'approved':
        return 'adopted'
      case 'rejected':
        return 'rejected'
      default:
        return 'draft'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return strings.requests.statusPending
      case 'approved':
        return strings.requests.statusApproved
      case 'rejected':
        return strings.requests.statusRejected
      case 'withdrawn':
        return strings.requests.statusWithdrawn
      default:
        return status
    }
  }

  const hasRequests = requests && requests.length > 0

  return (
    <div className='flex-grow bg-paper py-10'>
      <div className='app-container max-w-4xl space-y-8'>
        
        {/* Header */}
        <div className='flex flex-col gap-2 border-b border-border/60 pb-5 text-start'>
          <h1 className='text-3xl md:text-4xl font-display font-extrabold text-ink'>
            {strings.requests.title}
          </h1>
          <p className='text-base font-semibold text-ink-soft'>
            {strings.requests.dashboardSubtitle}
          </p>
        </div>

        {/* Requests List */}
        {!hasRequests ? (
          <div className='bg-surface border border-border rounded-card p-8 md:p-12 text-center space-y-6 shadow-resting'>
            <Mascot pose='sleeping' className='mx-auto' width={120} height={80} />
            <div className='space-y-2'>
              <h2 className='text-2xl font-display font-extrabold text-ink'>
                {strings.requests.noRequestsTitle}
              </h2>
              <p className='text-ink-soft font-semibold max-w-md mx-auto leading-relaxed'>
                {strings.requests.noRequestsDesc}
              </p>
            </div>
            <div className='pt-4'>
              <Link
                href='/cats'
                className='inline-flex items-center justify-center font-sans font-bold rounded-btn min-h-[48px] px-6 text-base bg-marmalade text-ink hover:bg-marmalade-dp transition-all duration-150 shadow-resting hover:-translate-y-0.5'
              >
                {strings.notFound.backBtn}
              </Link>
            </div>
          </div>
        ) : (
          <div className='space-y-4'>
            {requests.map((req) => {
              const cat = req.cats as unknown as { name: string; region: string; city: string | null } | null
              const catName = cat?.name || strings.common.defaultCatName
              const regionObj = REGIONS.find((r) => r.id === cat?.region as RegionId)
              const regionLabel = regionObj ? regionObj.label : cat?.region || ''

              return (
                <div
                  key={req.id}
                  className='bg-surface border border-border rounded-card p-5 md:p-6 shadow-resting hover:shadow-hover transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-6'
                >
                  {/* Left Side: Info */}
                  <div className='flex flex-col gap-3 text-start'>
                    <div className='flex items-center gap-3'>
                      <h3 className='text-xl font-display font-extrabold text-ink'>
                        {catName}
                      </h3>
                      <Badge variant={getStatusBadgeVariant(req.status)}>
                        {getStatusLabel(req.status)}
                      </Badge>
                    </div>

                    <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-ink-soft'>
                      <span className='flex items-center gap-1'>
                        <Compass className='w-4 h-4 text-ink-soft/80' />
                        {regionLabel} {cat?.city ? '(' + cat.city + ')' : ''}
                      </span>
                      <span className='hidden md:inline text-ink-soft/40'>&middot;</span>
                      <span className='flex items-center gap-1'>
                        <Calendar className='w-4 h-4 text-ink-soft/80' />
                        <span>{strings.requests.submittedAt}</span>
                      <bdi>
                          {new Date(req.created_at).toLocaleDateString('he-IL')}
                        </bdi>
                      </span>
                    </div>

                    {req.message && (
                      <p className='text-sm font-medium text-ink-soft leading-relaxed mt-1 bg-paper/40 p-3 rounded-input border border-border/40 whitespace-pre-line max-w-2xl'>
                        {req.message}
                      </p>
                    )}

                    {req.admin_note && (
                      <div className='text-sm font-semibold text-pine-dp leading-relaxed mt-2 bg-pine-soft/20 border-s-4 border-pine p-3 rounded'>
                        <strong className='block text-pine text-xs mb-0.5'>{strings.requests.adminNoteLabel}</strong>
                        {req.admin_note}
                      </div>
                    )}
                  </div>

                  {/* Right Side: Actions */}
                  {req.status === 'pending' && (
                    <div className='flex items-center justify-end'>
                      <WithdrawButton requestId={req.id} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
