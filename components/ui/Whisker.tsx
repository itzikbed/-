import React from 'react'

/**
 * Hand-drawn marmalade underline stroke for section headings — the site's
 * single "human touch" accent (DESIGN §3a). Use at most once per heading.
 */
export function Whisker({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 8"
      width="64"
      height="8"
      aria-hidden="true"
      className={`block ${className}`}
    >
      <path
        d="M2 6 C20 1 44 1 62 6"
        stroke="var(--marmalade)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
