import React, { useId } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, ...props }, ref) => {
    const id = useId()
    const isLtrType = props.type === 'email' || props.type === 'tel' || props.type === 'url'
    
    const inputStyles = `w-full bg-surface border rounded-input px-4 py-3 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 transition-all duration-150 ${
      error ? 'border-danger' : 'border-border'
    } ${className}`

    return (
      <div className="w-full flex flex-col gap-1.5 text-start">
        {label && (
          <label htmlFor={id} className="font-sans font-semibold text-sm text-ink-soft select-none">
            {label}
          </label>
        )}
        <input 
          id={id}
          ref={ref} 
          className={inputStyles} 
          dir={isLtrType ? 'ltr' : undefined}
          {...props} 
        />
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
Input.displayName = 'Input'
