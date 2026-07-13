'use client'

import React, { useEffect, useRef, useState } from 'react'
import { PeekPose } from './PeekPose'
import { SittingPose } from './SittingPose'
import { SleepingPose } from './SleepingPose'
import { CelebratingPose } from './CelebratingPose'
import { shouldDisableVideo } from '@/lib/utils/video-playback'

export interface MascotProps {
  pose: 'peek' | 'sitting' | 'sleeping' | 'celebrating'
  className?: string
  width?: number
  height?: number
  animateOnScroll?: boolean
}

export const Mascot: React.FC<MascotProps> = ({ 
  pose, 
  className = '', 
  width, 
  height,
  animateOnScroll = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [disableAnimation, setDisableAnimation] = useState(true)

  useEffect(() => {
    const checkSettings = () => {
      setDisableAnimation(shouldDisableVideo())
    }
    requestAnimationFrame(checkSettings)
  }, [])

  useEffect(() => {
    if (!animateOnScroll || disableAnimation || !containerRef.current) {
      setIsIntersecting(true)
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true)
        observer.unobserve(entry.target)
      }
    }, {
      threshold: 0.1
    })

    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [animateOnScroll, disableAnimation])

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
    const svgClass = animateOnScroll && !disableAnimation
      ? isIntersecting ? 'animate-draw' : 'opacity-0'
      : ''

    switch (pose) {
      case 'peek':
        return <PeekPose width={w} height={h} className={svgClass} />
      case 'sitting':
        return <SittingPose width={w} height={h} className={svgClass} />
      case 'sleeping':
        return <SleepingPose width={w} height={h} className={svgClass} />
      case 'celebrating':
        return <CelebratingPose width={w} height={h} className={svgClass} />
      default:
        return null
    }
  }

  return (
    <div 
      ref={containerRef}
      className={`inline-flex select-none pointer-events-none ${className}`}
    >
      {renderSVG()}
    </div>
  )
}
