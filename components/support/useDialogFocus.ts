'use client'

import { useEffect, RefObject } from 'react'

// Focus management for floating dialogs, following the MobileDrawer pattern:
// remember the opener, move focus in, trap Tab, close on ESC, restore focus out.
export function useDialogFocus(
  isOpen: boolean,
  onClose: () => void,
  containerRef: RefObject<HTMLElement | null>,
  initialFocusSelector?: string
) {
  useEffect(() => {
    if (!isOpen) return

    const previousActiveElement = document.activeElement as HTMLElement | null
    const timer = setTimeout(() => {
      const container = containerRef.current
      const target =
        (initialFocusSelector
          ? (container?.querySelector(initialFocusSelector) as HTMLElement | null)
          : null) ||
        (container?.querySelector('button, [href], input, textarea') as HTMLElement | null)
      target?.focus()
    }, 50)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab') {
        if (!containerRef.current) return
        const focusable = containerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
      clearTimeout(timer)
      window.removeEventListener('keydown', handleKeyDown)
      previousActiveElement?.focus()
    }
  }, [isOpen, onClose, containerRef, initialFocusSelector])
}
