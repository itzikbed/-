import { getAgeBucketRange } from './age-bucket'

export interface Filters {
  region: ('north' | 'south' | 'center' | 'jerusalem' | 'yosh')[]
  age: ('0-3m' | '3-6m' | '6-12m' | '1-8y' | '8y+')[]
  health: ('full' | 'partial' | 'none')[]
  good_with: ('cats' | 'dogs' | 'neither')[]
  special: boolean
  sex: 'male' | 'female' | 'all'
  page: number
  search: string
  sort: 'newest' | 'youngest' | 'oldest'
}

export function parseFilters(params: Record<string, string | string[] | undefined>): Filters {
  const getArray = (val: string | string[] | undefined): string[] => {
    if (!val) return []
    if (Array.isArray(val)) return val
    if (typeof val === 'string') {
      return val.split(',').map(s => s.trim()).filter(Boolean)
    }
    return []
  }

  const validRegions = ['north', 'south', 'center', 'jerusalem', 'yosh']
  const validAges = ['0-3m', '3-6m', '6-12m', '1-8y', '8y+']
  const validHealth = ['full', 'partial', 'none']
  const validGoodWith = ['cats', 'dogs', 'neither']

  const region = getArray(params.region).filter(v => validRegions.includes(v)) as Filters['region']
  const age = getArray(params.age).filter(v => validAges.includes(v)) as Filters['age']
  const health = getArray(params.health).filter(v => validHealth.includes(v)) as Filters['health']
  const good_with = getArray(params.good_with).filter(v => validGoodWith.includes(v)) as Filters['good_with']
  const special = params.special === 'true'
  const sex = (params.sex === 'male' || params.sex === 'female' || params.sex === 'all') ? params.sex : 'all'
  
  let page = 1
  if (params.page) {
    const parsedPage = parseInt(params.page as string, 10)
    if (!isNaN(parsedPage) && parsedPage > 0) {
      page = parsedPage
    }
  }

  const search = typeof params.search === 'string' ? params.search.trim() : ''
  const sort = (params.sort === 'youngest' || params.sort === 'oldest') ? params.sort : 'newest'

  return {
    region,
    age,
    health,
    good_with,
    special,
    sex,
    page,
    search,
    sort
  }
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
  if (filters.search) {
    params.set('search', filters.search)
  }
  if (filters.sort && filters.sort !== 'newest') {
    params.set('sort', filters.sort)
  }
  return params.toString()
}

interface PostgrestQuery {
  in(column: string, values: string[]): this
  eq(column: string, value: string | boolean): this
  or(filters: string): this
  ilike(column: string, pattern: string): this
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

  // 7. Search by name (case-insensitive)
  if (filters.search) {
    q = q.ilike('name', `%${filters.search}%`)
  }

  return q
}
export { getAgeBucketId, getAgeBucketLabel, getAgeBucketRange } from './age-bucket'
