import { createClient } from '@/lib/supabase/server'
import { parseFilters, applyFiltersToQuery } from '@/lib/utils/filters'
import { CatalogPageClient } from '@/components/cats/CatalogPageClient'
import { strings } from '@/lib/strings'
import type { Metadata } from 'next'

interface CatalogPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata: Metadata = {
  title: `${strings.nav.catalog} — ${strings.common.siteName}`,
  description: strings.common.metaDesc,
  openGraph: {
    title: `${strings.nav.catalog} — ${strings.common.siteName}`,
    description: strings.common.metaDesc,
    type: 'website',
  }
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  // Await searchParams in Next.js 15+
  const resolvedParams = await searchParams
  const filters = parseFilters(resolvedParams)

  const supabase = await createClient()

  // 1. Count query
  let countQuery = supabase
    .from('cats')
    .select('id', { head: true, count: 'exact' })
    .eq('status', 'published')
 
  // 2. Data query
  let dataQuery = supabase
    .from('cats')
    .select('id, name, sex, birth_est, region, city, is_special, status, video_path, cat_photos(path_card, path_full, sort_order)')
    .eq('status', 'published')
    .eq('cat_photos.sort_order', 0)
 
  // Apply parsed filters
  countQuery = applyFiltersToQuery(countQuery, filters)
  dataQuery = applyFiltersToQuery(dataQuery, filters)
 
  // Apply sorting
  if (filters.sort === 'youngest') {
    dataQuery = dataQuery.order('birth_est', { ascending: false })
  } else if (filters.sort === 'oldest') {
    dataQuery = dataQuery.order('birth_est', { ascending: true })
  } else {
    dataQuery = dataQuery.order('published_at', { ascending: false })
  }
  dataQuery = dataQuery.order('id', { ascending: true })

  // Apply pagination range
  const limit = 24
  const start = (filters.page - 1) * limit
  const end = start + limit - 1
  dataQuery = dataQuery.range(start, end)

  // Execute both queries concurrently
  const [countRes, dataRes] = await Promise.all([countQuery, dataQuery])

  if (countRes.error) {
    throw countRes.error
  }
  if (dataRes.error) {
    throw dataRes.error
  }

  const totalCount = countRes.count || 0
  const cats = dataRes.data || []

  return (
    <CatalogPageClient
      cats={cats}
      totalCount={totalCount}
      filters={filters}
    />
  )
}
