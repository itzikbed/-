'use client'

import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Filters } from '@/lib/utils/filters'
import { CatalogFilters } from './CatalogFilters'
import { strings } from '@/lib/strings'
import { Portal } from '@/components/ui/Portal'

interface CatalogFilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  filters: Filters
  totalCount: number
  onFiltersChange: (filters: Filters) => void
}

// Mobile bottom-sheet for the catalog filters, with the same dialog behavior
// as the nav drawer: focus moves in on open, Tab is trapped, Esc closes and
// focus returns to the opener.
export function CatalogFilterDrawer({
  isOpen,
  onClose,
  filters,
  totalCount,
  onFiltersChange
}: CatalogFilterDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Prevent scroll while open; move focus in and restore it on close
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      document.body.style.overflow = 'hidden'
      setTimeout(() => {
        const closeBtn = drawerRef.current?.querySelector('[aria-label]') as HTMLElement
        closeBtn?.focus()
      }, 50)
    } else {
      document.body.style.overflow = ''
      if (previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle ESC and focus trap inside the drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab') {
        if (!drawerRef.current) return
        const focusable = drawerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([-1])'
        )
        if (focusable.length === 0) {
          e.preventDefault()
          return
        }

        const first = focusable[0] as HTMLElement
        const last = focusable[focusable.length - 1] as HTMLElement

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === last) {
            first.focus()
            e.preventDefault()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <Portal>
      <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-ink/50 backdrop-blur-xs">
        {/* Backdrop Click */}
        <div className="flex-grow" onClick={onClose} aria-hidden="true" />

        {/* Drawer Content */}
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label={strings.catalog.filterTitle}
          tabIndex={-1}
          className="bg-surface-solid rounded-card border-t border-border p-6 shadow-hover max-h-[85vh] flex flex-col animate-slide-up focus-visible:outline-none"
        >
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              aria-label={strings.common.closeDialog}
              className="inline-flex items-center justify-center min-w-11 min-h-11 -mt-2 -me-2 text-ink-soft hover:text-ink cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* The sheet is capped at 85vh. Without a scroll container of its
              own this list simply ran past the foot of the screen and the
              filters below the fold could not be reached at all. */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <CatalogFilters
              filters={filters}
              totalCount={totalCount}
              onFiltersChange={onFiltersChange}
              onCloseMobile={onClose}
            />
          </div>
        </div>
      </div>
    </Portal>
  )
}
