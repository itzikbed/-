import React from 'react'

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 items-start">
        <label className="flex items-center gap-3 cursor-pointer select-none text-base text-ink font-sans">
          <input
            type="radio"
            ref={ref}
            className={`w-5 h-5 rounded-full border border-border text-pine focus:ring-2 focus:ring-pine bg-surface cursor-pointer transition-all ${className}`}
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
Radio.displayName = 'Radio'
