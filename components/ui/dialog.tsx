import React, { useEffect } from 'react'

export interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children, actions }) => {
  // Prevent page scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div 
        className="bg-surface rounded-card p-6 shadow-hover w-full max-w-lg relative border border-border animate-fade-rise"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-display font-bold text-ink">{title}</h3>
          <button 
            type="button"
            onClick={onClose}
            className="text-ink-soft hover:text-ink cursor-pointer focus-visible:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
