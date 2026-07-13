'use client'

import React, { useState, useEffect, useRef } from 'react'
import { shouldDisableVideo } from '@/lib/utils/video-playback'
import { PlaybackDirector } from '@/lib/utils/playback-director'

export const HeroFilm: React.FC = () => {
  const [disableVideo, setDisableVideo] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  
  const video1Ref = useRef<HTMLVideoElement>(null)
  const video2Ref = useRef<HTMLVideoElement>(null)
  const video3Ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Defer state update to avoid synchronous cascades in effect body
    const checkVideo = () => {
      setDisableVideo(shouldDisableVideo())
    }
    requestAnimationFrame(checkVideo)
    
    // Set isLoaded after page load or component mount to lazy load clip 2 & 3
    if (document.readyState === 'complete') {
      setTimeout(() => setIsLoaded(true), 0)
    } else {
      const handleLoad = () => setIsLoaded(true)
      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [])

  // Slide cycle logic (8 seconds per clip)
  useEffect(() => {
    if (disableVideo) return

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev === 2 ? 0 : prev + 1))
    }, 8000)

    return () => clearInterval(interval)
  }, [disableVideo])

  // PlaybackDirector registration for the active video
  useEffect(() => {
    if (disableVideo) return
    
    const activeVideo = activeIndex === 0 
      ? video1Ref.current 
      : activeIndex === 1 
      ? video2Ref.current 
      : video3Ref.current

    if (!activeVideo) return

    const play = async () => {
      try {
        await activeVideo.play()
      } catch (err) {
        console.error("Hero video playback failed", err)
      }
    }

    const pause = () => {
      activeVideo.pause()
    }

    // Register active video as 'hero'
    PlaybackDirector.register('hero', activeVideo, { play, pause })

    // Play immediately if page is in focus
    if (!document.hidden) {
      play()
    }

    return () => {
      PlaybackDirector.unregister('hero')
    }
  }, [activeIndex, disableVideo])

  if (disableVideo) {
    return (
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center z-0"
        style={{ backgroundImage: "url('/hero/hero_1_poster.jpg')" }}
      >
        {/* Gradient Overlay for Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/40 to-transparent z-20 pointer-events-none" />
      </div>
    )
  }

  const clips = [
    { id: 1, preload: 'metadata' as const, ref: video1Ref },
    { id: 2, preload: isLoaded ? ('metadata' as const) : ('none' as const), ref: video2Ref },
    { id: 3, preload: isLoaded ? ('metadata' as const) : ('none' as const), ref: video3Ref }
  ]

  return (
    <div className="absolute inset-0 z-0 bg-paper" data-hero-section>
      {clips.map((clip, index) => {
        const isActive = index === activeIndex
        return (
          <video
            key={clip.id}
            ref={clip.ref}
            muted
            playsInline
            loop
            preload={clip.preload}
            poster={`/hero/hero_${clip.id}_poster.jpg`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {(clip.id === 1 || isLoaded) && (
              <>
                <source src={`/hero/hero_${clip.id}.webm`} type="video/webm" />
                <source src={`/hero/hero_${clip.id}.mp4`} type="video/mp4" />
              </>
            )}
          </video>
        )
      })}
      {/* Gradient Overlay for Text Contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/40 to-transparent z-20 pointer-events-none" />
    </div>
  )
}
