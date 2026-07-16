import React from 'react'
import { strings } from '@/lib/strings'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'draft'
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', loading, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-sans font-semibold rounded-btn transition-all duration-150 ease-out active:scale-98 disabled:opacity-50 disabled:pointer-events-none min-h-[48px] px-6 text-base select-none cursor-pointer border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2'

    const variants = {
      primary: 'bg-marmalade text-ink hover:bg-marmalade-dp hover:-translate-y-0.5 shadow-resting hover:shadow-hover',
      secondary: 'bg-pine text-white hover:bg-pine/90 hover:-translate-y-0.5 shadow-resting hover:shadow-hover',
      tertiary: 'bg-transparent text-pine hover:bg-pine-soft hover:-translate-y-0.5',
      danger: 'bg-danger text-white hover:opacity-90 hover:-translate-y-0.5 shadow-resting hover:shadow-hover',
      draft: 'bg-surface border border-border text-ink-soft hover:bg-ink-soft/10 hover:-translate-y-0.5 shadow-resting hover:shadow-hover'
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>{strings.common.loading}</span>
          </span>
        ) : (
          children
        )}
      </button>
    )
  }
)
Button.displayName = 'Button'
