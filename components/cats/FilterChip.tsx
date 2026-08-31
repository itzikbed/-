import React from 'react'

export interface FilterChipProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  /** 'radio' for one-of-many groups, 'checkbox' for any-of-many. */
  type?: 'radio' | 'checkbox'
  /** Radio groups need a shared name. */
  name?: string
}

// A filter option as a chip rather than a stacked row. The control underneath
// is still a real radio or checkbox — it is only visually hidden — so keyboard
// use, grouping and screen-reader announcements are unchanged. Laying the
// options out in rows is what lets every filter group stay on screen at once
// instead of pushing the list past the fold.
export function FilterChip({ label, checked, onChange, type = 'checkbox', name }: FilterChipProps) {
  return (
    <label className="cursor-pointer select-none">
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      {/* No frame: the chip is a pane of white glass, and the chosen one is a
          different SHAPE — it opens on the opposite diagonal as well. Anyone
          who cannot separate the two colours can still see which is chosen. */}
      <span
        className="inline-flex items-center rounded-input bg-surface/55 backdrop-blur-sm px-3 py-1.5 text-sm font-semibold text-ink-soft
                   shadow-resting transition-all duration-150
                   peer-checked:rounded-[3px_12px_3px_12px] peer-checked:bg-surface/90 peer-checked:text-pine peer-checked:font-extrabold
                   peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-pine peer-focus-visible:ring-offset-2"
      >
        {label}
      </span>
    </label>
  )
}
