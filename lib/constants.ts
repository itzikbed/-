export const REGIONS = [
  { id: 'north', label: 'צפון' },
  { id: 'south', label: 'דרום' },
  { id: 'center', label: 'מרכז' },
  { id: 'jerusalem', label: 'ירושלים' },
  { id: 'yosh', label: 'איו"ש' }
] as const

export type RegionId = typeof REGIONS[number]['id']

export const AGE_BUCKETS = [
  { id: '0-3m', label: 'עד 3 חודשים' },
  { id: '3-6m', label: '3–6 חודשים' },
  { id: '6-12m', label: '6–12 חודשים' },
  { id: '1-8y', label: 'שנה–8 שנים' },
  { id: '8y+', label: '8 שנים ומעלה' }
] as const

export type AgeBucketId = typeof AGE_BUCKETS[number]['id']

export const FLOOR_TYPES = [
  { id: 'ground_house', label: 'בית קרקע' },
  { id: 'garden_floor', label: 'דירת גן' },
  { id: 'floor_1', label: 'קומה 1' },
  { id: 'floor_2', label: 'קומה 2' },
  { id: 'floor_3_plus', label: 'קומה 3 ומעלה' }
] as const

export type FloorTypeId = typeof FLOOR_TYPES[number]['id']

export const PUBLISHER_TYPES = [
  { id: 'private', label: 'פרטי' },
  { id: 'organization', label: 'עמותה / ארגון' }
] as const

export type PublisherTypeId = typeof PUBLISHER_TYPES[number]['id']

export const CAT_STATUSES = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PUBLISHED: 'published',
  ADOPTED: 'adopted',
  REJECTED: 'rejected',
  ARCHIVED: 'archived'
} as const

export type CatStatus = typeof CAT_STATUSES[keyof typeof CAT_STATUSES]

export const PUBLISHER_STATUSES = {
  NONE: 'none',
  PENDING: 'pending',
  APPROVED: 'approved',
  BLOCKED: 'blocked'
} as const

export type PublisherStatus = typeof PUBLISHER_STATUSES[keyof typeof PUBLISHER_STATUSES]

export const REQUEST_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn'
} as const

export type RequestStatus = typeof REQUEST_STATUSES[keyof typeof REQUEST_STATUSES]

export const HEALTH_LEVELS = [
  { id: 'full', label: 'מלא (מעוקר/מסורס ולפחות 2 חיסונים)' },
  { id: 'partial', label: 'חלקי (חיסון 1)' },
  { id: 'none', label: 'ללא (0 חיסונים)' }
] as const

export type HealthLevelId = typeof HEALTH_LEVELS[number]['id']
