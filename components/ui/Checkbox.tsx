import React from 'react'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 items-start">
        <label className="flex items-center gap-3 cursor-pointer select-none text-base text-ink font-sans">
          <input
            type="checkbox"
            ref={ref}
            className={`w-5 h-5 rounded border border-border text-pine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 bg-surface cursor-pointer transition-all ${className}`}
            {...props}
          />
          <span>{label}</span>
        </label>
        {error && (
          <span role="alert" className="font-sans text-sm text-danger mt-0.5">
            {error}
          </span>
        )}
      </div>
    )
  }
)
Checkbox.displayName = 'Checkbox'
