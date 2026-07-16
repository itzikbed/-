import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import React from 'react'
import AdminDashboardClient from './AdminDashboardClient'
import { strings } from '@/lib/strings'

export const metadata = {
  title: strings.admin.metaTitle,
  description: strings.admin.metaDesc
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedParams = await searchParams
  const successParam = typeof resolvedParams.success === 'string' ? resolvedParams.success : undefined
  const allowedSuccessValues = ['archived']
  const success = successParam && allowedSuccessValues.includes(successParam) ? successParam : undefined

  const supabase = await createClient()

  // Guard: Authenticated & Admin check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?redirect=/admin')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/')
  }

  // Fetch pending publishers (oldest first)
  const { data: pendingPublishers } = await supabase
    .from('profiles')
    .select('*')
    .eq('publisher_status', 'pending')
    .order('created_at', { ascending: true })

  // Fetch pending cats with owner info (oldest first)
  const { data: pendingCats } = await supabase
    .from('cats')
    .select('*, cat_photos(*), owner:profiles(full_name, phone)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  // Fetch pending requests for cats that are still published (oldest first)
  const { data: pendingRequests } = await supabase
    .from('adoption_requests')
    .select(`
      *,
      cats!inner(id, name, sex, status, owner_id),
      adopter:profiles!adoption_requests_adopter_id_fkey(
        id,
        full_name,
        phone,
        adopter_profiles(*)
      )
    `)
    .eq('status', 'pending')
    .eq('cats.status', 'published')
    .order('created_at', { ascending: true })

  // Fetch latest 50 logs
  const { data: logs } = await supabase
    .from('moderation_log')
    .select('*, actor:profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(50)

  // Resolve entity ids to human-readable names for the log table
  const logRows = logs || []
  const catEntityIds = [...new Set(logRows.filter((l) => l.entity_type === 'cat').map((l) => l.entity_id))]
  const profileEntityIds = [
    ...new Set(
      logRows
        .filter((l) => l.entity_type === 'publisher' || l.entity_type === 'profile')
        .map((l) => l.entity_id)
    ),
  ]
  const requestEntityIds = [...new Set(logRows.filter((l) => l.entity_type === 'request').map((l) => l.entity_id))]

  const [catNameRows, profileNameRows, requestNameRows] = await Promise.all([
    catEntityIds.length
      ? supabase.from('cats').select('id, name').in('id', catEntityIds)
      : Promise.resolve({ data: null }),
    profileEntityIds.length
      ? supabase.from('profiles').select('id, full_name').in('id', profileEntityIds)
      : Promise.resolve({ data: null }),
    requestEntityIds.length
      ? supabase.from('adoption_requests').select('id, cat:cats(name)').in('id', requestEntityIds)
      : Promise.resolve({ data: null }),
  ])

  const entityNames: Record<string, string> = {}
  for (const row of catNameRows.data || []) {
    if (row.name) entityNames[row.id] = row.name
  }
  for (const row of profileNameRows.data || []) {
    if (row.full_name) entityNames[row.id] = row.full_name
  }
  for (const row of requestNameRows.data || []) {
    const cat = Array.isArray(row.cat) ? row.cat[0] : row.cat
    if (cat?.name) entityNames[row.id] = cat.name
  }

  return (
    <div className="flex-grow bg-paper py-10">
      <div className="app-container max-w-6xl space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-border/60 pb-5 text-start">
          <h1 className="text-3xl md:text-4xl font-display font-extrabold text-ink">
            {strings.admin.title}
          </h1>
          <p className="text-base font-semibold text-ink-soft">
            {strings.admin.subtitle}
          </p>
        </div>

        {/* Client Shell */}
        <AdminDashboardClient
          pendingPublishers={pendingPublishers || []}
          pendingCats={pendingCats || []}
          pendingRequests={pendingRequests || []}
          logs={logs || []}
          entityNames={entityNames}
          success={success}
        />
      </div>
    </div>
  )
}
