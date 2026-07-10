import React from 'react'

export interface ChipProps {
  active?: boolean
  onClick?: () => void
  children: React.ReactNode
  className?: string
}

export const Chip: React.FC<ChipProps> = ({ active = false, onClick, children, className = '' }) => {
  const isClickable = !!onClick
  const baseStyles = 'inline-flex items-center px-4 py-2 rounded-[12px] text-base font-sans transition-all duration-150 select-none border-0'
  const activeStyles = active
    ? 'bg-pine text-white font-semibold'
    : 'bg-pine-soft text-pine hover:bg-opacity-80'
  
  const clickableStyles = isClickable ? 'cursor-pointer active:scale-95' : ''

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={`${baseStyles} ${activeStyles} ${clickableStyles} ${className}`}
    >
      {children}
    </button>
  )
}
