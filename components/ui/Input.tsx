import React, { useId, useState } from 'react'
import { strings } from '@/lib/strings'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, ...props }, ref) => {
    const id = useId()
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = props.type === 'password'
    const isLtrType = props.type === 'email' || props.type === 'tel' || props.type === 'url' || isPassword
    
    const inputStyles = `w-full bg-surface border rounded-input py-3 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 transition-all duration-150 ${
      error ? 'border-danger' : 'border-border'
    } ${isPassword ? 'ps-4 pe-14' : 'px-4'} ${className}`

    const errorId = `${id}-error`
    const helperId = `${id}-helper`
    const hasError = !!error
    
    return (
      <div className="w-full flex flex-col gap-1.5 text-start">
        {label && (
          <label htmlFor={id} className="font-sans text-base font-bold text-ink select-none">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <input 
            id={id}
            ref={ref} 
            {...props}
            type={isPassword && showPassword ? 'text' : props.type}
            className={inputStyles} 
            dir={isLtrType ? 'ltr' : undefined}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? errorId : (helperText ? helperId : undefined)}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 end-0 px-4 flex items-center text-sm font-semibold text-pine hover:text-pine-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 rounded-card select-none"
            >
              {showPassword ? strings.common.hide : strings.common.show}
            </button>
          )}
        </div>
        {error && (
          <span id={errorId} role="alert" className="font-sans text-sm text-danger mt-0.5">
            {error}
          </span>
        )}
        {!error && helperText && (
          <span id={helperId} className="font-sans text-sm text-ink-soft mt-0.5">
            {helperText}
          </span>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
