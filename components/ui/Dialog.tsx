import React, { useEffect, useRef, useId } from 'react'
import { strings } from '@/lib/strings'

export interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children, actions }) => {
  const dialogId = useId()
  const titleId = `dialog-title-${dialogId}`
  const containerRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Prevent page scroll when open
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      document.body.style.overflow = 'hidden'
      
      // Focus the container or first focusable element on open
      setTimeout(() => {
        if (containerRef.current) {
          const focusable = containerRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([-1])'
          )
          if (focusable.length > 0) {
            ;(focusable[0] as HTMLElement).focus()
          } else {
            containerRef.current.focus()
          }
        }
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

  // Handle ESC key press and focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab') {
        if (!containerRef.current) return
        const focusable = containerRef.current.querySelectorAll(
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      
      <div 
        ref={containerRef}
        className="bg-surface rounded-card p-6 shadow-hover w-full max-w-lg relative border border-border animate-fade-rise focus-visible:outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 id={titleId} className="text-xl font-display font-bold text-ink">{title}</h3>
          <button 
            type="button"
            onClick={onClose}
            aria-label={strings.common.closeDialog}
            className="text-ink-soft hover:text-ink cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine rounded-sm p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mb-6 font-sans text-base text-ink-soft leading-relaxed text-start">
          {children}
        </div>
        {actions && (
          <div className="flex justify-end gap-3 mt-6">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
