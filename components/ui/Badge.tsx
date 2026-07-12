import React from 'react'

export interface BadgeProps {
  variant?: 'adopted' | 'pending' | 'published' | 'rejected' | 'draft' | 'archived'
  children: React.ReactNode
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'draft', children, className = '' }) => {
  const variants = {
    adopted: 'bg-pine-soft text-pine font-semibold',
    published: 'bg-pine-soft text-pine font-semibold',
    pending: 'bg-marmalade-sf text-warning font-semibold',
    rejected: 'bg-danger/10 text-danger font-semibold',
    draft: 'bg-surface border border-border text-ink-soft',
    archived: 'bg-surface border border-border text-ink-soft'
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-sans select-none ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
