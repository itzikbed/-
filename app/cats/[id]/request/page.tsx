import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { REGIONS, RegionId } from '@/lib/constants'
import { AdoptionRequestForm } from './AdoptionRequestForm'

interface RequestPageProps {
  params: Promise<{ id: string }>
}

export default async function RequestPage({ params }: RequestPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Guard: Authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?redirect=/cats/${id}/request`)
  }

  // Fetch cat
  const { data: cat } = await supabase
    .from('cats')
    .select('id, name, region, city, status')
    .eq('id', id)
    .single()

  if (!cat || cat.status !== 'published') {
    notFound()
  }

  // Guard: Completed questionnaire
  const { data: profile } = await supabase
    .from('adopter_profiles')
    .select('completed_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile || !profile.completed_at) {
    redirect(`/adopt/questionnaire?cat=${id}`)
  }

  const regionObj = REGIONS.find((r) => r.id === cat.region as RegionId)
  const regionLabel = regionObj ? regionObj.label : cat.region

  return (
    <div className='flex-grow bg-paper py-10'>
      <div className='app-container max-w-xl'>
        <AdoptionRequestForm
          catId={cat.id}
          catName={cat.name}
          region={regionLabel}
          city={cat.city || ''}
        />
      </div>
    </div>
  )
}
