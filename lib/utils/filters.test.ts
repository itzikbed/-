import { describe, it, expect, vi } from 'vitest'
import { parseFilters, serializeFilters, getAgeBucketRange, applyFiltersToQuery } from './filters'

describe('parseFilters', () => {
  it('should parse empty parameters with default values', () => {
    const parsed = parseFilters({})
    expect(parsed.region).toEqual([])
    expect(parsed.age).toEqual([])
    expect(parsed.health).toEqual([])
    expect(parsed.good_with).toEqual([])
    expect(parsed.special).toBe(false)
    expect(parsed.sex).toBe('all')
    expect(parsed.page).toBe(1)
  })

  it('should parse single value and comma-separated arrays', () => {
    const parsed = parseFilters({
      region: 'north,south',
      age: '0-3m',
      health: 'full',
      good_with: 'cats,dogs',
      special: 'true',
      sex: 'female',
      page: '3'
    })
    expect(parsed.region).toEqual(['north', 'south'])
    expect(parsed.age).toEqual(['0-3m'])
    expect(parsed.health).toEqual(['full'])
    expect(parsed.good_with).toEqual(['cats', 'dogs'])
    expect(parsed.special).toBe(true)
    expect(parsed.sex).toBe('female')
    expect(parsed.page).toBe(3)
  })

  it('should handle standard array query params', () => {
    const parsed = parseFilters({
      region: ['north', 'center'],
      age: '0-3m'
    })
    expect(parsed.region).toEqual(['north', 'center'])
    expect(parsed.age).toEqual(['0-3m'])
  })
})

describe('serializeFilters', () => {
  it('should serialize basic filters', () => {
    const query = serializeFilters({
      region: ['center', 'south'],
      special: true,
      sex: 'male',
      page: 2
    })
    expect(query).toContain('region=center%2Csouth')
    expect(query).toContain('special=true')
    expect(query).toContain('sex=male')
    expect(query).toContain('page=2')
  })

  it('should omit default or empty values', () => {
    const query = serializeFilters({
      region: [],
      special: false,
      sex: 'all',
      page: 1
    })
    expect(query).toBe('')
  })
})

describe('getAgeBucketRange', () => {
  const refDate = new Date('2026-07-12T00:00:00Z')

  it('should compute date range for 0-3m', () => {
    const range = getAgeBucketRange('0-3m', refDate)
    expect(range).toEqual({ gte: '2026-04-12' })
  })

  it('should compute date range for 3-6m', () => {
    const range = getAgeBucketRange('3-6m', refDate)
    expect(range).toEqual({ gte: '2026-01-12', lt: '2026-04-12' })
  })

  it('should compute date range for 8y+', () => {
    const range = getAgeBucketRange('8y+', refDate)
    expect(range).toEqual({ lt: '2018-07-12' })
  })
})

describe('applyFiltersToQuery', () => {
  const refDate = new Date('2026-07-12T00:00:00Z')

  it('should apply filters to mock query', () => {
    const mockQuery = {
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis()
    }

    const filters = parseFilters({
      region: 'north,south',
      sex: 'male',
      special: 'true',
      age: '0-3m,3-6m',
      health: 'full',
      good_with: 'cats,neither'
    })

    applyFiltersToQuery(mockQuery, filters, refDate)

    expect(mockQuery.in).toHaveBeenCalledWith('region', ['north', 'south'])
    expect(mockQuery.eq).toHaveBeenCalledWith('sex', 'male')
    expect(mockQuery.eq).toHaveBeenCalledWith('is_special', true)
    
    // Check age conditions OR'ed
    expect(mockQuery.or).toHaveBeenCalledWith('birth_est.gte.2026-04-12,and(birth_est.gte.2026-01-12,birth_est.lt.2026-04-12)')
    
    // Check health conditions OR'ed (full)
    expect(mockQuery.or).toHaveBeenCalledWith('and(neutered.eq.true,vaccinations.gte.2)')
    
    // Check good_with conditions OR'ed (cats, neither)
    expect(mockQuery.or).toHaveBeenCalledWith('good_with_cats.eq.true,and(good_with_cats.eq.false,good_with_dogs.eq.false)')
  })
})
