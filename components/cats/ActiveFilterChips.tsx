'use client'

import React from 'react'
import { Filters } from '@/lib/utils/filters'
import { REGIONS, AGE_BUCKETS } from '@/lib/constants'
import { strings } from '@/lib/strings'
import { X } from 'lucide-react'

interface ActiveFilterChipsProps {
  filters: Filters
  onRemoveArrayItem: (key: 'region' | 'age' | 'health' | 'good_with', item: string) => void
  onRemoveSingleFilter: (key: 'sex' | 'special') => void
  onClearAll: () => void
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  filters,
  onRemoveArrayItem,
  onRemoveSingleFilter,
  onClearAll
}) => {
  const chips: React.ReactNode[] = []

  filters.region.forEach((r) => {
    const label = REGIONS.find((x) => x.id === r)?.label || r
    chips.push(
      <span
        key={`region-${r}`}
        className="inline-flex items-center gap-1 bg-pine-soft text-pine border border-pine/10 text-xs font-bold px-3 py-1.5 rounded-full"
      >
        <span>{label}</span>
        <button
          onClick={() => onRemoveArrayItem('region', r)}
          className="hover:text-ink cursor-pointer focus-visible:outline-none"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </span>
    )
  })

  filters.age.forEach((a) => {
    const label = AGE_BUCKETS.find((x) => x.id === a)?.label || a
    chips.push(
      <span
        key={`age-${a}`}
        className="inline-flex items-center gap-1 bg-pine-soft text-pine border border-pine/10 text-xs font-bold px-3 py-1.5 rounded-full"
      >
        <span>{label}</span>
        <button
          onClick={() => onRemoveArrayItem('age', a)}
          className="hover:text-ink cursor-pointer focus-visible:outline-none"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </span>
    )
  })

  filters.health.forEach((h) => {
    const label =
      h === 'full'
        ? strings.catalog.filterHealthFull
        : h === 'partial'
        ? strings.catalog.filterHealthPartial
        : strings.catalog.filterHealthNone
    chips.push(
      <span
        key={`health-${h}`}
        className="inline-flex items-center gap-1 bg-pine-soft text-pine border border-pine/10 text-xs font-bold px-3 py-1.5 rounded-full"
      >
        <span>{label}</span>
        <button
          onClick={() => onRemoveArrayItem('health', h)}
          className="hover:text-ink cursor-pointer focus-visible:outline-none"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </span>
    )
  })

  filters.good_with.forEach((g) => {
    const label =
      g === 'cats'
        ? strings.catalog.filterGoodWithCats
        : g === 'dogs'
        ? strings.catalog.filterGoodWithDogs
        : strings.catalog.filterGoodWithNeither
    chips.push(
      <span
        key={`good_with-${g}`}
        className="inline-flex items-center gap-1 bg-pine-soft text-pine border border-pine/10 text-xs font-bold px-3 py-1.5 rounded-full"
      >
        <span>{label}</span>
        <button
          onClick={() => onRemoveArrayItem('good_with', g)}
          className="hover:text-ink cursor-pointer focus-visible:outline-none"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </span>
    )
  })

  if (filters.sex !== 'all') {
    const label =
      filters.sex === 'male' ? strings.catalog.genderMale : strings.catalog.genderFemale
    chips.push(
      <span
        key="sex"
        className="inline-flex items-center gap-1 bg-pine-soft text-pine border border-pine/10 text-xs font-bold px-3 py-1.5 rounded-full"
      >
        <span>{label}</span>
        <button
          onClick={() => onRemoveSingleFilter('sex')}
          className="hover:text-ink cursor-pointer focus-visible:outline-none"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </span>
    )
  }

  if (filters.special) {
    chips.push(
      <span
        key="special"
        className="inline-flex items-center gap-1 bg-pine-soft text-pine border border-pine/10 text-xs font-bold px-3 py-1.5 rounded-full"
      >
        <span>{strings.catalog.specialChip}</span>
        <button
          onClick={() => onRemoveSingleFilter('special')}
          className="hover:text-ink cursor-pointer focus-visible:outline-none"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </span>
    )
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border/40 pb-4">
      {chips}
      <button
        onClick={onClearAll}
        className="text-xs font-bold text-pine hover:underline cursor-pointer focus-visible:outline-none"
      >
        {strings.catalog.clearAll}
      </button>
    </div>
  )
}
