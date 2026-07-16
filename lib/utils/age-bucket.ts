import { AGE_BUCKETS } from '../constants'

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
