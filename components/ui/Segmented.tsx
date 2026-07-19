import React from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

const segmentClass =
  'inline-flex items-center justify-center min-h-11 px-5 text-base font-sans font-semibold cursor-pointer transition-colors bg-surface text-ink-soft hover:bg-paper peer-checked:bg-pine! peer-checked:text-white! peer-focus-visible:ring-2 peer-focus-visible:ring-pine peer-focus-visible:ring-inset'

const groupClass =
  'inline-flex w-fit rounded-btn border border-border overflow-hidden bg-border gap-px select-none'

export interface SegmentedOption {
  value: string
  label: string
}

interface SegmentedFieldProps {
  options: SegmentedOption[]
  registration: UseFormRegisterReturn
}

/**
 * Segmented control over real radio inputs for react-hook-form register()
 * fields — visual upgrade only, identical form semantics to a select/radio.
 */
export function SegmentedField({ options, registration }: SegmentedFieldProps) {
  return (
    <div className={groupClass}>
      {options.map((o) => (
        <label key={o.value}>
          <input type="radio" value={o.value} className="sr-only peer" {...registration} />
          <span className={segmentClass}>{o.label}</span>
        </label>
      ))}
    </div>
  )
}

interface BooleanSegmentedProps {
  name: string
  value: boolean | null | undefined
  onChange: (v: boolean) => void
  yesLabel: string
  noLabel: string
}

/** Yes/No segmented control for Controller-managed tri-state booleans. */
export function BooleanSegmented({ name, value, onChange, yesLabel, noLabel }: BooleanSegmentedProps) {
  const options: Array<{ v: boolean; label: string }> = [
    { v: true, label: yesLabel },
    { v: false, label: noLabel }
  ]
  return (
    <div className={groupClass}>
      {options.map((o) => (
        <label key={String(o.v)}>
          <input
            type="radio"
            name={name}
            value={String(o.v)}
            checked={value === o.v}
            onChange={() => onChange(o.v)}
            className="sr-only peer"
          />
          <span className={`${segmentClass} px-8`}>{o.label}</span>
        </label>
      ))}
    </div>
  )
}
