'use client'

import React from 'react'
import { Filters } from '@/lib/utils/filters'
import { REGIONS, AGE_BUCKETS } from '@/lib/constants'
import { strings } from '@/lib/strings'
import { Checkbox } from '@/components/ui/Checkbox'
import { Radio } from '@/components/ui/Radio'

interface CatalogFiltersProps {
  filters: Filters
  totalCount: number
  onFiltersChange: (newFilters: Filters) => void
  onCloseMobile?: () => void
}

export const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  filters,
  totalCount,
  onFiltersChange,
  onCloseMobile
}) => {

  const handleSingleChange = (key: keyof Filters, value: unknown) => {
    const newFilters = { ...filters, [key]: value, page: 1 }
    onFiltersChange(newFilters)
  }

  const handleArrayChange = (
    key: 'region' | 'age' | 'health' | 'good_with',
    item: string,
    checked: boolean
  ) => {
    const currentArray = filters[key] as string[]
    const newArray = checked
      ? [...currentArray, item]
      : currentArray.filter((x) => x !== item)
    handleSingleChange(key, newArray)
  }

  const hasActiveFilters =
    filters.region.length > 0 ||
    filters.age.length > 0 ||
    filters.health.length > 0 ||
    filters.good_with.length > 0 ||
    filters.special ||
    filters.sex !== 'all'

  const handleClear = () => {
    onFiltersChange({
      region: [],
      age: [],
      health: [],
      good_with: [],
      special: false,
      sex: 'all',
      page: 1
    })
  }

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h3 className="text-lg font-display font-bold text-ink">
          {strings.catalog.filterTitle}
        </h3>
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="text-sm font-semibold text-pine hover:underline cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
          >
            {strings.catalog.clearAll}
          </button>
        )}
      </div>

      {/* Filter Options */}
      <div className="flex-grow space-y-6 overflow-y-auto pe-1">
        {/* Sex Filter */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-ink border-s-2 border-marmalade ps-2">
            {strings.catalog.genderLabel}
          </h4>
          <div className="flex flex-col gap-2">
            <Radio
              name="sex"
              label={strings.catalog.genderAll}
              checked={filters.sex === 'all'}
              onChange={() => handleSingleChange('sex', 'all')}
            />
            <Radio
              name="sex"
              label={strings.catalog.genderMale}
              checked={filters.sex === 'male'}
              onChange={() => handleSingleChange('sex', 'male')}
            />
            <Radio
              name="sex"
              label={strings.catalog.genderFemale}
              checked={filters.sex === 'female'}
              onChange={() => handleSingleChange('sex', 'female')}
            />
          </div>
        </div>

        {/* Region Filter */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-ink border-s-2 border-marmalade ps-2">
            {strings.catalog.regionLabel}
          </h4>
          <div className="flex flex-col gap-2">
            {REGIONS.map((r) => (
              <Checkbox
                key={r.id}
                label={r.label}
                checked={filters.region.includes(r.id)}
                onChange={(e) => handleArrayChange('region', r.id, e.target.checked)}
              />
            ))}
          </div>
        </div>

        {/* Age Filter */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-ink border-s-2 border-marmalade ps-2">
            {strings.catalog.ageLabel}
          </h4>
          <div className="flex flex-col gap-2">
            {AGE_BUCKETS.map((a) => (
              <Checkbox
                key={a.id}
                label={a.label}
                checked={filters.age.includes(a.id)}
                onChange={(e) => handleArrayChange('age', a.id, e.target.checked)}
              />
            ))}
          </div>
        </div>

        {/* Health Filter */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-ink border-s-2 border-marmalade ps-2">
            {strings.catalog.healthLabel}
          </h4>
          <div className="flex flex-col gap-2">
            <Checkbox
              label={strings.catalog.healthFull}
              checked={filters.health.includes('full')}
              onChange={(e) => handleArrayChange('health', 'full', e.target.checked)}
            />
            <Checkbox
              label={strings.catalog.healthPartial}
              checked={filters.health.includes('partial')}
              onChange={(e) => handleArrayChange('health', 'partial', e.target.checked)}
            />
            <Checkbox
              label={strings.catalog.healthNone}
              checked={filters.health.includes('none')}
              onChange={(e) => handleArrayChange('health', 'none', e.target.checked)}
            />
          </div>
        </div>

        {/* Good With Filter */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-ink border-s-2 border-marmalade ps-2">
            {strings.catalog.goodWithLabel}
          </h4>
          <div className="flex flex-col gap-2">
            <Checkbox
              label={strings.catalog.goodWithCats}
              checked={filters.good_with.includes('cats')}
              onChange={(e) => handleArrayChange('good_with', 'cats', e.target.checked)}
            />
            <Checkbox
              label={strings.catalog.goodWithDogs}
              checked={filters.good_with.includes('dogs')}
              onChange={(e) => handleArrayChange('good_with', 'dogs', e.target.checked)}
            />
            <Checkbox
              label={strings.catalog.goodWithNeither}
              checked={filters.good_with.includes('neither')}
              onChange={(e) => handleArrayChange('good_with', 'neither', e.target.checked)}
            />
          </div>
        </div>

        {/* Special Needs Toggle */}
        <div className="pt-2 border-t border-border">
          <Checkbox
            label={strings.catalog.specialOnly}
            checked={filters.special}
            onChange={(e) => handleSingleChange('special', e.target.checked)}
          />
        </div>
      </div>

      {/* Mobile Sticky Button */}
      {onCloseMobile && (
        <div className="border-t border-border pt-4 mt-auto">
          <button
            onClick={onCloseMobile}
            className="w-full inline-flex items-center justify-center font-sans font-bold rounded-btn min-h-[48px] px-6 text-base bg-marmalade text-ink hover:bg-marmalade-dp transition-colors shadow-resting active:scale-98"
          >
            {strings.catalog.showResultsBtn.replace('{count}', totalCount.toString())}
          </button>
        </div>
      )}
    </div>
  )
}
