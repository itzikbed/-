import React from 'react'
import { STROKE_COLOR, STROKE_WIDTH, MARMALADE_COLOR } from './MascotConstants'

interface PoseProps {
  width: number
  height: number
  className?: string
}

export const PeekPose: React.FC<PoseProps> = ({ width, height, className }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 80"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ears (Marmalade filled accents) */}
      <path d="M28 35L15 10L35 22Z" fill={MARMALADE_COLOR} />
      <path d="M92 35L105 10L85 22Z" fill={MARMALADE_COLOR} />

      {/* Head Outline */}
      <path
        d="M35 22C45 18 75 18 85 22C95 26 100 45 100 60C100 70 20 70 20 60C20 45 25 26 35 22Z"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="var(--surface)"
      />

      {/* Ear Outlines */}
      <path
        d="M28 35L15 10L35 22"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M92 35L105 10L85 22"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Eyes */}
      <circle cx="45" cy="42" r="3" fill={STROKE_COLOR} />
      <circle cx="75" cy="42" r="3" fill={STROKE_COLOR} />

      {/* Whiskers */}
      <path d="M15 45H30" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <path d="M12 52H28" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <path d="M105 45H90" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <path d="M108 52H92" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />

      {/* Nose & Mouth */}
      <path d="M57 47L63 47L60 50Z" fill={STROKE_COLOR} />
      <path
        d="M57 53C58.5 55 60 55 60 53C60 55 61.5 55 63 53"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
      />

      {/* Paws peeking over edge */}
      <rect
        x="38"
        y="68"
        width="16"
        height="12"
        rx="8"
        fill="var(--surface)"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
      <rect
        x="66"
        y="68"
        width="16"
        height="12"
        rx="8"
        fill="var(--surface)"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
      
      {/* Paw lines */}
      <path d="M43 74V80" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
      <path d="M49 74V80" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
      <path d="M71 74V80" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
      <path d="M77 74V80" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    </svg>
  )
}
