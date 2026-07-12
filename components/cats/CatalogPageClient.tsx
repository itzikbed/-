'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Filters, serializeFilters } from '@/lib/utils/filters'
import { CatalogFilters } from './CatalogFilters'
import { ActiveFilterChips } from './ActiveFilterChips'
import { CatalogPagination } from './CatalogPagination'
import { CatGrid } from './CatGrid'
import { strings } from '@/lib/strings'
import { Filter } from 'lucide-react'

interface CatListing {
  id: string
  name: string
  sex: string
  birth_est: string
  region: string
  city: string | null
  is_special: boolean
  status: string
  cat_photos?: Array<{
    path_card: string
    path_full: string
    sort_order: number
  }> | null
}

interface CatalogPageClientProps {
  cats: CatListing[]
  totalCount: number
  filters: Filters
}

export const CatalogPageClient: React.FC<CatalogPageClientProps> = ({
  cats,
  totalCount,
  filters
}) => {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const limit = 24
  const totalPages = Math.ceil(totalCount / limit) || 1

  const handleFiltersChange = (newFilters: Filters) => {
    const queryString = serializeFilters(newFilters)
    startTransition(() => {
      router.replace(`/cats?${queryString}`, { scroll: false })
    })
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    const newFilters = { ...filters, page }
    const queryString = serializeFilters(newFilters)
    startTransition(() => {
      router.replace(`/cats?${queryString}`, { scroll: true })
    })
  }

  // Remove a specific array item from filter
  const removeFilterItem = (
    key: 'region' | 'age' | 'health' | 'good_with',
    item: string
  ) => {
    const currentArray = filters[key] as string[]
    const newArray = currentArray.filter((x) => x !== item)
    const newFilters = { ...filters, [key]: newArray, page: 1 }
    handleFiltersChange(newFilters)
  }

  // Remove single values
  const removeSingleFilter = (key: 'sex' | 'special') => {
    const value = key === 'sex' ? 'all' : false
    const newFilters = { ...filters, [key]: value, page: 1 }
    handleFiltersChange(newFilters)
  }

  const handleClearAll = () => {
    startTransition(() => {
      router.replace('/cats', { scroll: false })
    })
  }

  const isFiltered =
    filters.region.length > 0 ||
    filters.age.length > 0 ||
    filters.health.length > 0 ||
    filters.good_with.length > 0 ||
    filters.special ||
    filters.sex !== 'all'

  return (
    <div className="flex flex-col flex-grow select-none">
      <div className="app-container py-8 flex flex-col gap-6">
        
        {/* Title and Mobile Filter Button */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-extrabold text-ink leading-tight">
              {strings.nav.catalog}
            </h1>
            <p className="text-sm font-semibold text-ink-soft">
              {strings.catalog.foundCount.replace('{count}', totalCount.toString())}
            </p>
          </div>
          
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden inline-flex items-center justify-center gap-2 font-sans font-bold rounded-btn border border-border bg-surface text-ink px-4 py-2 text-sm shadow-resting cursor-pointer active:scale-98"
          >
            <Filter className="w-4 h-4" />
            <span>{strings.catalog.openFiltersBtn}</span>
          </button>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden md:block md:col-span-1 bg-surface border border-border rounded-card p-6 shadow-resting sticky top-20">
            <CatalogFilters 
              filters={filters} 
              totalCount={totalCount} 
              onFiltersChange={handleFiltersChange} 
            />
          </aside>

          {/* Catalog grid area */}
          <div className="md:col-span-3 space-y-6">
            
            {/* Active filter chips */}
            <ActiveFilterChips
              filters={filters}
              onRemoveArrayItem={removeFilterItem}
              onRemoveSingleFilter={removeSingleFilter}
              onClearAll={handleClearAll}
            />

            <CatGrid cats={cats} isFiltered={isFiltered} loading={isPending} />

            {/* Pagination Footer */}
            <CatalogPagination
              currentPage={filters.page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Slide up / Bottom panel overlay) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-ink/50 backdrop-blur-xs">
          {/* Backdrop Click */}
          <div className="flex-grow" onClick={() => setMobileOpen(false)} />
          
          {/* Drawer Content */}
          <div className="bg-surface rounded-t-card border-t border-border p-6 shadow-hover max-h-[85vh] flex flex-col animate-slide-up">
            <CatalogFilters
              filters={filters}
              totalCount={totalCount}
              onFiltersChange={handleFiltersChange}
              onCloseMobile={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
