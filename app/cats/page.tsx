import { createClient } from '@/lib/supabase/server'
import { parseFilters, applyFiltersToQuery } from '@/lib/utils/filters'
import { CatalogPageClient } from '@/components/cats/CatalogPageClient'

interface CatalogPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  // Await searchParams in Next.js 15+
  const resolvedParams = await searchParams
  const filters = parseFilters(resolvedParams)

  const supabase = await createClient()

  // 1. Count query
  let countQuery = supabase
    .from('cats')
    .select('*', { head: true, count: 'exact' })
    .eq('status', 'published')

  // 2. Data query
  let dataQuery = supabase
    .from('cats')
    .select('*, cat_photos(*)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .order('id', { ascending: true }) // stable tiebreak for pagination

  // Apply parsed filters
  countQuery = applyFiltersToQuery(countQuery, filters)
  dataQuery = applyFiltersToQuery(dataQuery, filters)

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
