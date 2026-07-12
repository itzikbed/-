import React from 'react'
import { PeekPose } from './PeekPose'
import { SittingPose } from './SittingPose'
import { SleepingPose } from './SleepingPose'
import { CelebratingPose } from './CelebratingPose'

export interface MascotProps {
  pose: 'peek' | 'sitting' | 'sleeping' | 'celebrating'
  className?: string
  width?: number
  height?: number
}

export const Mascot: React.FC<MascotProps> = ({ pose, className = '', width, height }) => {
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
        return <PeekPose width={w} height={h} className={className} />
      case 'sitting':
        return <SittingPose width={w} height={h} className={className} />
      case 'sleeping':
        return <SleepingPose width={w} height={h} className={className} />
      case 'celebrating':
        return <CelebratingPose width={w} height={h} className={className} />
      default:
        return null
    }
  }

  return <div className={`inline-flex select-none pointer-events-none ${className}`}>{renderSVG()}</div>
}
