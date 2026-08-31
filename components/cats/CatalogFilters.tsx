'use client'

import React from 'react'
import { Filters } from '@/lib/utils/filters'
import { REGIONS, AGE_BUCKETS } from '@/lib/constants'
import { strings } from '@/lib/strings'
import { FilterChip } from './FilterChip'
import { SpecialFilterToggle } from './SpecialFilterToggle'

interface CatalogFiltersProps {
  filters: Filters
  totalCount: number
  onFiltersChange: (newFilters: Filters) => void
  onCloseMobile?: () => void
}

type ArrayKey = 'region' | 'age' | 'health' | 'good_with'

// Each group is its own panel rather than one long block, and its options sit
// in rows rather than a column. Together that keeps the whole filter on screen
// while only the results scroll.
const PANEL = 'filter-panel rounded-card p-4'

export const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  filters,
  totalCount,
  onFiltersChange,
  onCloseMobile
}) => {
  const setFilter = (key: keyof Filters, value: unknown) =>
    onFiltersChange({ ...filters, [key]: value, page: 1 })

  const toggleInArray = (key: ArrayKey, item: string, checked: boolean) => {
    const current = filters[key] as string[]
    setFilter(key, checked ? [...current, item] : current.filter((x) => x !== item))
  }

  const hasActiveFilters =
    filters.region.length > 0 ||
    filters.age.length > 0 ||
    filters.health.length > 0 ||
    filters.good_with.length > 0 ||
    filters.special ||
    filters.sex !== 'all'

  const handleClear = () =>
    onFiltersChange({
      region: [], age: [], health: [], good_with: [],
      special: false, sex: 'all', page: 1, search: '', sort: 'newest'
    })

  const groups: { title: string; key: ArrayKey; options: { id: string; label: string }[] }[] = [
    { title: strings.catalog.regionLabel, key: 'region', options: REGIONS.map((r) => ({ id: r.id, label: r.label })) },
    { title: strings.catalog.ageLabel, key: 'age', options: AGE_BUCKETS.map((a) => ({ id: a.id, label: a.label })) },
    {
      title: strings.catalog.healthLabel,
      key: 'health',
      options: [
        { id: 'full', label: strings.catalog.filterHealthFull },
        { id: 'partial', label: strings.catalog.filterHealthPartial },
        { id: 'none', label: strings.catalog.filterHealthNone }
      ]
    },
    {
      title: strings.catalog.filterGoodWithLabel,
      key: 'good_with',
      options: [
        { id: 'cats', label: strings.catalog.filterGoodWithCats },
        { id: 'dogs', label: strings.catalog.filterGoodWithDogs },
        { id: 'neither', label: strings.catalog.filterGoodWithNeither }
      ]
    }
  ]

  const sexOptions = [
    { id: 'all', label: strings.catalog.genderAll },
    { id: 'male', label: strings.catalog.genderMale },
    { id: 'female', label: strings.catalog.genderFemale }
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className={`${PANEL} flex items-center justify-between`}>
        <h2 className="text-base font-display font-bold text-ink">
          {strings.catalog.filterTitle}
        </h2>
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="text-sm font-semibold text-pine hover:underline cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
          >
            {strings.catalog.clearAll}
          </button>
        )}
      </div>

      <fieldset className={PANEL}>
        <legend className="font-display text-sm font-extrabold text-pine px-1">{strings.catalog.genderLabel}</legend>
        <div className="flex flex-wrap gap-2 pt-2">
          {sexOptions.map((o) => (
            <FilterChip
              key={o.id}
              type="radio"
              name="sex"
              label={o.label}
              checked={filters.sex === o.id}
              onChange={() => setFilter('sex', o.id)}
            />
          ))}
        </div>
      </fieldset>

      {groups.map((group) => (
        <fieldset key={group.key} className={PANEL}>
          <legend className="font-display text-sm font-extrabold text-pine px-1">{group.title}</legend>
          <div className="flex flex-wrap gap-2 pt-2">
            {group.options.map((o) => (
              <FilterChip
                key={o.id}
                label={o.label}
                checked={(filters[group.key] as string[]).includes(o.id)}
                onChange={(checked) => toggleInArray(group.key, o.id, checked)}
              />
            ))}
          </div>
        </fieldset>
      ))}

      <SpecialFilterToggle
        checked={filters.special}
        onChange={(checked) => setFilter('special', checked)}
      />

      {onCloseMobile && (
        <button
          onClick={onCloseMobile}
          className="w-full inline-flex items-center justify-center font-sans font-bold rounded-btn min-h-[48px] px-6 text-base bg-marmalade text-ink hover:bg-marmalade-dp transition-colors shadow-resting active:scale-98"
        >
          {strings.catalog.showResultsBtn.replace('{count}', totalCount.toString())}
        </button>
      )}
    </div>
  )
}
