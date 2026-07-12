import React from 'react'
import { STROKE_COLOR, STROKE_WIDTH, MARMALADE_COLOR } from './MascotConstants'

interface PoseProps {
  width: number
  height: number
  className?: string
}

export const SleepingPose: React.FC<PoseProps> = ({ width, height, className }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 80"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Curled Body (with Marmalade spot) */}
      <circle cx="60" cy="45" r="30" fill="var(--surface)" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
      <path d="M50 20C65 15 80 25 80 40C80 55 60 75 40 65Z" fill={MARMALADE_COLOR} opacity="0.8" />

      {/* Sleeping Head */}
      <circle
        cx="40"
        cy="48"
        r="18"
        fill="var(--surface)"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
      
      {/* Closed Eyes (Sleeping arcs) */}
      <path
        d="M30 48C32 50 34 50 36 48"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
      />
      <path
        d="M44 48C46 50 48 50 50 48"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
      />

      {/* Nose */}
      <path d="M39 52L41 52L40 53Z" fill={STROKE_COLOR} />

      {/* Ears (Flat on head while sleeping) */}
      <path d="M28 38L20 28L32 33Z" fill={MARMALADE_COLOR} />
      <path d="M28 38L20 28L32 33" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      
      <path d="M50 38L58 28L48 33Z" fill={MARMALADE_COLOR} />
      <path d="M50 38L58 28L48 33" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />

      {/* Tail curled around body */}
      <path
        d="M85 60C95 55 95 35 85 25"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M85 25L90 28L83 29Z" fill={MARMALADE_COLOR} />
    </svg>
  )
}
