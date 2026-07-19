import React from 'react'

interface SectionCurveProps {
  /** Text-color class of the NEXT section's background, e.g. "text-pine-soft" */
  className?: string
}

/**
 * Gentle arc divider between page bands (DESIGN §4 rounded geometry).
 * Renders a hill in currentColor on top of the previous section's background —
 * place it immediately BEFORE the section whose background matches className.
 */
export function SectionCurve({ className = '' }: SectionCurveProps) {
  return (
    <div aria-hidden="true" className={`w-full overflow-hidden leading-none ${className}`}>
      <svg
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        focusable="false"
        className="block w-full h-6 md:h-9"
      >
        <path d="M0,48 C480,0 960,0 1440,48 Z" fill="currentColor" />
      </svg>
    </div>
  )
}
