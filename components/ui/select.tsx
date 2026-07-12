import React, { useId } from 'react'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options: { value: string | number; label: string }[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, helperText, options, ...props }, ref) => {
    const id = useId()
    const selectStyles = `w-full bg-surface border rounded-input px-4 py-3 pe-10 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 transition-all duration-150 appearance-none cursor-pointer ${
      error ? 'border-danger' : 'border-border'
    } ${className}`

    return (
      <div className="w-full flex flex-col gap-1.5 text-start">
        {label && (
          <label htmlFor={id} className="font-sans font-semibold text-sm text-ink-soft select-none">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <select id={id} ref={ref} className={selectStyles} {...props}>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 end-4 flex items-center pointer-events-none text-ink-soft">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && (
          <span role="alert" className="font-sans text-sm text-danger mt-0.5">
            {error}
          </span>
        )}
        {!error && helperText && (
          <span className="font-sans text-sm text-ink-soft mt-0.5">
            {helperText}
          </span>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'
