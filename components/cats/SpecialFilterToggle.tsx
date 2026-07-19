'use client'

import React from 'react'
import { Heart } from 'lucide-react'
import { strings } from '@/lib/strings'
import { Checkbox } from '@/components/ui/Checkbox'

interface SpecialFilterToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

/** Marmalade-highlighted special-needs filter toggle (DESIGN: warm accent). */
export function SpecialFilterToggle({ checked, onChange }: SpecialFilterToggleProps) {
  return (
    <div className="bg-marmalade-sf/60 border border-marmalade/25 rounded-input p-3">
      <Checkbox
        label={
          <span className="flex items-center gap-1.5 font-semibold">
            <Heart className="w-4 h-4 text-marmalade-dp fill-current" aria-hidden="true" />
            {strings.catalog.specialOnly}
          </span>
        }
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  )
}
