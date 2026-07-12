import React from 'react'
import { STROKE_COLOR, STROKE_WIDTH, MARMALADE_COLOR } from './MascotConstants'

interface PoseProps {
  width: number
  height: number
  className?: string
}

export const SittingPose: React.FC<PoseProps> = ({ width, height, className }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 120"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Tail (Marmalade filled tip) */}
      <path d="M75 95C85 95 95 85 92 65Z" fill={MARMALADE_COLOR} />
      
      {/* Body & Tail Outline */}
      <path
        d="M75 95C85 95 95 85 92 65C89 45 80 50 80 75C80 90 70 95 50 95C30 95 25 80 25 60C25 45 35 35 50 35C65 35 75 45 75 60"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Head */}
      <path d="M38 30L27 10L42 20Z" fill={MARMALADE_COLOR} />
      <path d="M62 30L73 10L58 20Z" fill={MARMALADE_COLOR} />
      
      <circle
        cx="50"
        cy="35"
        r="22"
        fill="var(--surface)"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />

      {/* Ear lines */}
      <path d="M38 30L27 10L42 20" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <path d="M62 30L73 10L58 20" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />

      {/* Eyes */}
      <circle cx="42" cy="33" r="2.5" fill={STROKE_COLOR} />
      <circle cx="58" cy="33" r="2.5" fill={STROKE_COLOR} />

      {/* Nose & Mouth */}
      <path d="M48 38L52 38L50 40Z" fill={STROKE_COLOR} />
      <path
        d="M47 43C48.5 44.5 50 44.5 50 43C50 44.5 51.5 44.5 53 43"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
      />

      {/* Sitting Legs & Feet */}
      <rect
        x="32"
        y="85"
        width="14"
        height="20"
        rx="7"
        fill="var(--surface)"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
      <rect
        x="54"
        y="85"
        width="14"
        height="20"
        rx="7"
        fill="var(--surface)"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
      <path d="M37 97V105" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
      <path d="M41 97V105" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
      <path d="M59 97V105" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
      <path d="M63 97V105" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    </svg>
  )
}
