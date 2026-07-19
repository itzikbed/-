import React from 'react'
import { Check } from 'lucide-react'

/** Small end-aligned confirmation line used by wizard save indicators. */
export function SavedNote({ label }: { label: string }) {
  return (
    <p
      className="flex items-center justify-end gap-1.5 text-xs font-sans font-semibold text-pine select-none"
      aria-live="polite"
    >
      <Check className="w-3.5 h-3.5" aria-hidden="true" />
      {label}
    </p>
  )
}
