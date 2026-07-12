import React from 'react'

export interface MascotProps {
  pose: 'peek' | 'sitting' | 'sleeping' | 'celebrating'
  className?: string
  width?: number
  height?: number
}

export const Mascot: React.FC<MascotProps> = ({ pose, className = '', width, height }) => {
  const strokeColor = 'currentColor'
  const strokeWidth = 2
  const marmaladeColor = 'var(--marmalade)' // --marmalade

  // Default dimensions
  const dims = {
    peek: { w: 120, h: 80 },
    sitting: { w: 100, h: 120 },
    sleeping: { w: 120, h: 80 },
    celebrating: { w: 100, h: 120 }
  }

  const w = width || dims[pose].w
  const h = height || dims[pose].h

  const renderSVG = () => {
    switch (pose) {
      case 'peek':
        return (
          <svg
            width={w}
            height={h}
            viewBox="0 0 120 80"
            fill="none"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Ears (Marmalade filled accents) */}
            <path d="M28 35L15 10L35 22Z" fill={marmaladeColor} />
            <path d="M92 35L105 10L85 22Z" fill={marmaladeColor} />

            {/* Head Outline */}
            <path
              d="M35 22C45 18 75 18 85 22C95 26 100 45 100 60C100 70 20 70 20 60C20 45 25 26 35 22Z"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="var(--surface)"
            />

            {/* Ear Outlines */}
            <path
              d="M28 35L15 10L35 22"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M92 35L105 10L85 22"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Eyes */}
            <circle cx="45" cy="42" r="3" fill={strokeColor} />
            <circle cx="75" cy="42" r="3" fill={strokeColor} />

            {/* Whiskers */}
            <path d="M15 45H30" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
            <path d="M12 52H28" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
            <path d="M105 45H90" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
            <path d="M108 52H92" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />

            {/* Nose & Mouth */}
            <path d="M57 47L63 47L60 50Z" fill={strokeColor} />
            <path
              d="M57 53C58.5 55 60 55 60 53C60 55 61.5 55 63 53"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
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
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <rect
              x="66"
              y="68"
              width="16"
              height="12"
              rx="8"
              fill="var(--surface)"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            
            {/* Paw lines */}
            <path d="M43 74V80" stroke={strokeColor} strokeWidth={strokeWidth} />
            <path d="M49 74V80" stroke={strokeColor} strokeWidth={strokeWidth} />
            <path d="M71 74V80" stroke={strokeColor} strokeWidth={strokeWidth} />
            <path d="M77 74V80" stroke={strokeColor} strokeWidth={strokeWidth} />
          </svg>
        )
      case 'sitting':
        return (
          <svg
            width={w}
            height={h}
            viewBox="0 0 100 120"
            fill="none"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Tail (Marmalade filled tip) */}
            <path d="M75 95C85 95 95 85 92 65Z" fill={marmaladeColor} />
            
            {/* Body & Tail Outline */}
            <path
              d="M75 95C85 95 95 85 92 65C89 45 80 50 80 75C80 90 70 95 50 95C30 95 25 80 25 60C25 45 35 35 50 35C65 35 75 45 75 60"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Head */}
            <path d="M38 30L27 10L42 20Z" fill={marmaladeColor} />
            <path d="M62 30L73 10L58 20Z" fill={marmaladeColor} />
            
            <circle
              cx="50"
              cy="35"
              r="22"
              fill="var(--surface)"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />

            {/* Ear lines */}
            <path d="M38 30L27 10L42 20" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
            <path d="M62 30L73 10L58 20" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />

            {/* Eyes */}
            <circle cx="42" cy="33" r="2.5" fill={strokeColor} />
            <circle cx="58" cy="33" r="2.5" fill={strokeColor} />

            {/* Nose & Mouth */}
            <path d="M48 38L52 38L50 40Z" fill={strokeColor} />
            <path
              d="M47 43C48.5 44.5 50 44.5 50 43C50 44.5 51.5 44.5 53 43"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
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
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <rect
              x="54"
              y="85"
              width="14"
              height="20"
              rx="7"
              fill="var(--surface)"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <path d="M37 97V105" stroke={strokeColor} strokeWidth={strokeWidth} />
            <path d="M41 97V105" stroke={strokeColor} strokeWidth={strokeWidth} />
            <path d="M59 97V105" stroke={strokeColor} strokeWidth={strokeWidth} />
            <path d="M63 97V105" stroke={strokeColor} strokeWidth={strokeWidth} />
          </svg>
        )
      case 'sleeping':
        return (
          <svg
            width={w}
            height={h}
            viewBox="0 0 120 80"
            fill="none"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Curled Body (with Marmalade spot) */}
            <circle cx="60" cy="45" r="30" fill="var(--surface)" stroke={strokeColor} strokeWidth={strokeWidth} />
            <path d="M50 20C65 15 80 25 80 40C80 55 60 75 40 65Z" fill={marmaladeColor} opacity="0.8" />

            {/* Sleeping Head */}
            <circle
              cx="40"
              cy="48"
              r="18"
              fill="var(--surface)"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            
            {/* Closed Eyes (Sleeping arcs) */}
            <path
              d="M30 48C32 50 34 50 36 48"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <path
              d="M44 48C46 50 48 50 50 48"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Nose */}
            <path d="M39 52L41 52L40 53Z" fill={strokeColor} />

            {/* Ears (Flat on head while sleeping) */}
            <path d="M28 38L20 28L32 33Z" fill={marmaladeColor} />
            <path d="M28 38L20 28L32 33" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
            
            <path d="M50 38L58 28L48 33Z" fill={marmaladeColor} />
            <path d="M50 38L58 28L48 33" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />

            {/* Tail curled around body */}
            <path
              d="M85 60C95 55 95 35 85 25"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M85 25L90 28L83 29Z" fill={marmaladeColor} />
          </svg>
        )
      case 'celebrating':
        return (
          <svg
            width={w}
            height={h}
            viewBox="0 0 100 120"
            fill="none"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Happy Tail (High, curly, Marmalade tipped) */}
            <path
              d="M65 90C80 90 90 70 85 45"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <path d="M85 45L88 50L81 50Z" fill={marmaladeColor} />

            {/* Body */}
            <path
              d="M35 90C30 90 30 65 35 55C40 45 60 45 65 55C70 65 70 90 65 90Z"
              fill="var(--surface)"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />

            {/* Celebrating Arms Up */}
            <path
              d="M32 58C20 52 15 42 22 38"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <path
              d="M68 58C80 52 85 42 78 38"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Head (Happy cat) */}
            <circle
              cx="50"
              cy="35"
              r="18"
              fill="var(--surface)"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            
            {/* Ears */}
            <path d="M40 22L30 8L44 15Z" fill={marmaladeColor} />
            <path d="M40 22L30 8L44 15" stroke={strokeColor} strokeWidth={strokeWidth} />
            <path d="M60 22L70 8L56 15Z" fill={marmaladeColor} />
            <path d="M60 22L70 8L56 15" stroke={strokeColor} strokeWidth={strokeWidth} />

            {/* Happy Eyes (^_^) */}
            <path
              d="M40 33C42 31 44 31 46 33"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <path
              d="M54 33C56 31 58 31 60 33"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Open Mouth (celebrating!) */}
            <path d="M48 38L52 38L50 40Z" fill={strokeColor} />
            <path d="M46 42C48 46 52 46 54 42Z" fill="var(--danger)" stroke={strokeColor} strokeWidth={strokeWidth} />

            {/* Feet */}
            <rect
              x="30"
              y="90"
              width="15"
              height="10"
              rx="5"
              fill="var(--surface)"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <rect
              x="55"
              y="90"
              width="15"
              height="10"
              rx="5"
              fill="var(--surface)"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </svg>
        )
      default:
        return null
    }
  }

  return <div className={`inline-flex select-none pointer-events-none ${className}`}>{renderSVG()}</div>
}
