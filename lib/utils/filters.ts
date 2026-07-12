import { z } from 'zod'
import { AGE_BUCKETS } from '../constants'

export const filterSchema = z.object({
  region: z.array(z.enum(['north', 'south', 'center', 'jerusalem', 'yosh'])).default([]),
  age: z.array(z.enum(['0-3m', '3-6m', '6-12m', '1-8y', '8y+'])).default([]),
  health: z.array(z.enum(['full', 'partial', 'none'])).default([]),
  good_with: z.array(z.enum(['cats', 'dogs', 'neither'])).default([]),
  special: z.boolean().default(false),
  sex: z.enum(['male', 'female', 'all']).default('all'),
  page: z.number().int().positive().default(1)
})

export type Filters = z.infer<typeof filterSchema>

export function parseFilters(params: Record<string, string | string[] | undefined>): Filters {
  const getArray = (val: string | string[] | undefined): string[] => {
    if (!val) return []
    if (Array.isArray(val)) return val
    if (typeof val === 'string') {
      return val.split(',').map(s => s.trim()).filter(Boolean)
    }
    return []
  }

  const region = getArray(params.region)
  const age = getArray(params.age)
  const health = getArray(params.health)
  const good_with = getArray(params.good_with)
  const special = params.special === 'true'
  const sex = (params.sex === 'male' || params.sex === 'female') ? params.sex : 'all'
  const page = params.page ? parseInt(params.page as string, 10) || 1 : 1

  return filterSchema.parse({
    region,
    age,
    health,
    good_with,
    special,
    sex,
    page
  })
}

export function serializeFilters(filters: Partial<Filters>): string {
  const params = new URLSearchParams()
  if (filters.region && filters.region.length > 0) {
    params.set('region', filters.region.join(','))
  }
  if (filters.age && filters.age.length > 0) {
    params.set('age', filters.age.join(','))
  }
  if (filters.health && filters.health.length > 0) {
    params.set('health', filters.health.join(','))
  }
  if (filters.good_with && filters.good_with.length > 0) {
    params.set('good_with', filters.good_with.join(','))
  }
  if (filters.special) {
    params.set('special', 'true')
  }
  if (filters.sex && filters.sex !== 'all') {
    params.set('sex', filters.sex)
  }
  if (filters.page && filters.page > 1) {
    params.set('page', filters.page.toString())
  }
  return params.toString()
}

export function getAgeBucketRange(bucket: string, referenceDate: Date = new Date()): { gte?: string; lt?: string } {
  const d = new Date(referenceDate)
  
  const subtract = (months: number) => {
    const res = new Date(d)
    res.setMonth(res.getMonth() - months)
    return res.toISOString().split('T')[0]
  }
  
  switch (bucket) {
    case '0-3m':
      return { gte: subtract(3) }
    case '3-6m':
      return { gte: subtract(6), lt: subtract(3) }
    case '6-12m':
      return { gte: subtract(12), lt: subtract(6) }
    case '1-8y':
      return { gte: subtract(8 * 12), lt: subtract(12) }
    case '8y+':
      return { lt: subtract(8 * 12) }
    default:
      return {}
  }
}

interface PostgrestQuery {
  in(column: string, values: string[]): this
  eq(column: string, value: string | boolean): this
  or(filters: string): this
}

export function applyFiltersToQuery<T extends PostgrestQuery>(
  query: T,
  filters: Filters,
  referenceDate: Date = new Date()
): T {
  let q = query

  // 1. Region filter
  if (filters.region.length > 0) {
    q = q.in('region', filters.region)
  }

  // 2. Sex filter
  if (filters.sex !== 'all') {
    q = q.eq('sex', filters.sex)
  }

  // 3. Special filter
  if (filters.special) {
    q = q.eq('is_special', true)
  }

  // 4. Age buckets (OR combined)
  if (filters.age.length > 0) {
    const ageConditions = filters.age.map(bucket => {
      const range = getAgeBucketRange(bucket, referenceDate)
      if (range.gte && range.lt) {
        return `and(birth_est.gte.${range.gte},birth_est.lt.${range.lt})`
      } else if (range.gte) {
        return `birth_est.gte.${range.gte}`
      } else if (range.lt) {
        return `birth_est.lt.${range.lt}`
      }
      return ''
    }).filter(Boolean)
    
    if (ageConditions.length > 0) {
      q = q.or(ageConditions.join(','))
    }
  }

  // 5. Health levels (OR combined)
  if (filters.health.length > 0) {
    const healthConditions = filters.health.map(h => {
      if (h === 'full') return 'and(neutered.eq.true,vaccinations.gte.2)'
      if (h === 'partial') return 'vaccinations.eq.1'
      if (h === 'none') return 'vaccinations.eq.0'
      return ''
    }).filter(Boolean)
    
    if (healthConditions.length > 0) {
      q = q.or(healthConditions.join(','))
    }
  }

  // 6. Good with levels (OR combined)
  if (filters.good_with.length > 0) {
    const goodWithConditions = filters.good_with.map(g => {
      if (g === 'cats') return 'good_with_cats.eq.true'
      if (g === 'dogs') return 'good_with_dogs.eq.true'
      if (g === 'neither') return 'and(good_with_cats.eq.false,good_with_dogs.eq.false)'
      return ''
    }).filter(Boolean)
    
    if (goodWithConditions.length > 0) {
      q = q.or(goodWithConditions.join(','))
    }
  }

  return q
}

export function getAgeBucketId(birthEst: string | Date): string {
  const birth = new Date(birthEst)
  const now = new Date()
  const diffMs = now.getTime() - birth.getTime()
  const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.4375)
  
  if (diffMonths < 3) return '0-3m'
  if (diffMonths < 6) return '3-6m'
  if (diffMonths < 12) return '6-12m'
  if (diffMonths < 96) return '1-8y'
  return '8y+'
}

export function getAgeBucketLabel(birthEst: string | Date): string {
  const bucketId = getAgeBucketId(birthEst)
  const bucket = AGE_BUCKETS.find(b => b.id === bucketId)
  return bucket ? bucket.label : ''
}

