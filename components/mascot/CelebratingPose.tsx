import React from 'react'
import { STROKE_COLOR, STROKE_WIDTH, MARMALADE_COLOR } from './MascotConstants'

interface PoseProps {
  width: number
  height: number
  className?: string
}

export const CelebratingPose: React.FC<PoseProps> = ({ width, height, className }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 120"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Happy Tail (High, curly, Marmalade tipped) */}
      <path
        d="M65 90C80 90 90 70 85 45"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
      />
      <path d="M85 45L88 50L81 50Z" fill={MARMALADE_COLOR} />

      {/* Body */}
      <path
        d="M35 90C30 90 30 65 35 55C40 45 60 45 65 55C70 65 70 90 65 90Z"
        fill="var(--surface)"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />

      {/* Celebrating Arms Up */}
      <path
        d="M32 58C20 52 15 42 22 38"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
      />
      <path
        d="M68 58C80 52 85 42 78 38"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
      />

      {/* Head (Happy cat) */}
      <circle
        cx="50"
        cy="35"
        r="18"
        fill="var(--surface)"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
      
      {/* Ears */}
      <path d="M40 22L30 8L44 15Z" fill={MARMALADE_COLOR} />
      <path d="M40 22L30 8L44 15" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
      <path d="M60 22L70 8L56 15Z" fill={MARMALADE_COLOR} />
      <path d="M60 22L70 8L56 15" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />

      {/* Happy Eyes (^_^) */}
      <path
        d="M40 33C42 31 44 31 46 33"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
      />
      <path
        d="M54 33C56 31 58 31 60 33"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
      />

      {/* Open Mouth (celebrating!) */}
      <path d="M48 38L52 38L50 40Z" fill={STROKE_COLOR} />
      <path d="M46 42C48 46 52 46 54 42Z" fill="var(--danger)" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />

      {/* Feet */}
      <rect
        x="30"
        y="90"
        width="15"
        height="10"
        rx="5"
        fill="var(--surface)"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
      <rect
        x="55"
        y="90"
        width="15"
        height="10"
        rx="5"
        fill="var(--surface)"
        stroke={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
    </svg>
  )
}
