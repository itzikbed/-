import React from 'react'

interface SectionCurveProps {
  /** Text-color class of the NEXT section's background, e.g. "text-pine-soft" */
  className?: string
}

/**
 * Gentle arc divider between page bands (DESIGN §4 rounded geometry).
 * Renders a hill in currentColor on top of the previous section's background —
 * place it immediately BEFORE the section whose background matches className.
 *
 * Two details keep a pale hairline from appearing between the arc and the band
 * below it, which is what the seam above the footer was:
 *  - the fill runs past the bottom of the viewBox, so the last row of pixels is
 *    solid colour rather than an anti-aliased edge;
 *  - the divider pulls the next band up by one pixel, so a fractional device
 *    pixel at any zoom or DPR is covered by the band instead of showing the
 *    page behind it.
 */
export function SectionCurve({ className = '' }: SectionCurveProps) {
  return (
    <div aria-hidden="true" className={`w-full overflow-hidden leading-none -mb-px ${className}`}>
      <svg
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        focusable="false"
        className="block w-full h-6 md:h-9"
      >
        <path d="M0,48 C480,0 960,0 1440,48 L1440,60 L0,60 Z" fill="currentColor" />
      </svg>
    </div>
  )
}
