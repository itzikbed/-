import React from 'react'
import { CatCard } from './CatCard'
import { Mascot } from '@/components/mascot/Mascot'
import { Skeleton } from '@/components/ui/Skeleton'
import { strings } from '@/lib/strings'
import Link from 'next/link'

export interface CatGridProps {
  cats: Array<{
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
  }>
  loading?: boolean
  isFiltered?: boolean
}

export const CatGrid: React.FC<CatGridProps> = ({ cats, loading = false, isFiltered = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="bg-surface border border-border rounded-card p-4 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <Skeleton className="aspect-[4/3] w-full rounded-photo" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <Skeleton className="h-8 w-1/2 rounded-full mt-4" />
          </div>
        ))}
      </div>
    )
  }

  if (cats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center select-none">
        {/* Mascot Peeking Over Edge */}
        <div className="relative h-20 w-32 mb-4 overflow-visible flex items-end justify-center">
          <Mascot pose="peek" className="translate-y-2" animateOnScroll={true} />
        </div>
        <h3 className="text-2xl font-display font-extrabold text-ink mb-2">
          {isFiltered ? strings.catalog.noCatsFiltered : strings.catalog.noCatsTrue}
        </h3>
        <p className="text-ink-soft text-base max-w-sm mb-6 leading-relaxed">
          {isFiltered 
            ? strings.catalog.noCatsFilteredDesc 
            : strings.catalog.noCatsTrueDesc}
        </p>
        
        {isFiltered ? (
          <Link
            href="/cats"
            className="inline-flex items-center justify-center font-sans font-bold rounded-btn min-h-[48px] px-6 text-base bg-marmalade text-ink hover:bg-marmalade-dp transition-colors shadow-resting active:scale-98"
          >
            {strings.catalog.clearFilterBtn}
          </Link>
        ) : (
          <Link
            href="/publish"
            className="inline-flex items-center justify-center font-sans font-bold rounded-btn min-h-[48px] px-6 text-base bg-pine text-white hover:bg-pine/90 transition-colors shadow-resting active:scale-98"
          >
            {strings.catalog.publishCta}
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {cats.map((cat) => (
        <CatCard key={cat.id} cat={cat} />
      ))}
    </div>
  )
}
