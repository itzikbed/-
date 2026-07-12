'use client'

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CatalogPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export const CatalogPagination: React.FC<CatalogPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 border-t border-border pt-6 mt-8">
      {/* Prev page button */}
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-border bg-surface text-ink hover:bg-paper disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-pine active:scale-95 transition-all"
      >
        <ChevronRight className="w-5 h-5 rtl:-scale-x-100" />
      </button>

      {/* Page numbers */}
      {Array.from({ length: totalPages }).map((_, idx) => {
        const pNum = idx + 1
        const isCurrent = currentPage === pNum
        return (
          <button
            key={pNum}
            onClick={() => onPageChange(pNum)}
            className={`w-10 h-10 rounded-full font-display font-extrabold flex items-center justify-center text-sm shadow-resting cursor-pointer focus-visible:ring-2 focus-visible:ring-pine active:scale-95 transition-all ${
              isCurrent
                ? 'bg-marmalade text-ink'
                : 'bg-surface border border-border text-ink hover:bg-paper'
            }`}
          >
            {pNum}
          </button>
        )
      })}

      {/* Next page button */}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-border bg-surface text-ink hover:bg-paper disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-pine active:scale-95 transition-all"
      >
        <ChevronLeft className="w-5 h-5 rtl:-scale-x-100" />
      </button>
    </div>
  )
}
