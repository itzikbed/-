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
  const video4Ref = useRef<HTMLVideoElement>(null)
  const video5Ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Defer state update to avoid synchronous cascades in effect body
    const checkVideo = () => {
      setDisableVideo(shouldDisableVideo())
    }
    requestAnimationFrame(checkVideo)
    
    // Set isLoaded after page load or component mount to lazy load clips 2-5
    if (document.readyState === 'complete') {
      setTimeout(() => setIsLoaded(true), 0)
    } else {
      const handleLoad = () => setIsLoaded(true)
      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [])

  // Slide cycle logic (8 seconds per clip, 5 clips total)
  useEffect(() => {
    if (disableVideo) return

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev === 4 ? 0 : prev + 1))
    }, 8000)

    return () => clearInterval(interval)
  }, [disableVideo])

  // PlaybackDirector registration and pausing inactive videos
  useEffect(() => {
    if (disableVideo) return
    
    const videos = [
      { index: 0, ref: video1Ref.current },
      { index: 1, ref: video2Ref.current },
      { index: 2, ref: video3Ref.current },
      { index: 3, ref: video4Ref.current },
      { index: 4, ref: video5Ref.current }
    ]

    videos.forEach(({ index, ref }) => {
      if (!ref) return
      if (index === activeIndex) {
        // Active video: register and play
        const play = async () => {
          try {
            await ref.play()
          } catch (err) {
            console.error("Hero video playback failed", err)
          }
        }
        const pause = () => {
          ref.pause()
        }

        PlaybackDirector.register('hero', ref, { play, pause })
        if (!document.hidden) {
          play()
        }
      } else {
        // Inactive video: pause
        ref.pause()
      }
    })

    const v1 = video1Ref.current
    const v2 = video2Ref.current
    const v3 = video3Ref.current
    const v4 = video4Ref.current
    const v5 = video5Ref.current

    return () => {
      PlaybackDirector.unregister('hero')
      v1?.pause()
      v2?.pause()
      v3?.pause()
      v4?.pause()
      v5?.pause()
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
    { id: 3, preload: isLoaded ? ('metadata' as const) : ('none' as const), ref: video3Ref },
    { id: 4, preload: isLoaded ? ('metadata' as const) : ('none' as const), ref: video4Ref },
    { id: 5, preload: isLoaded ? ('metadata' as const) : ('none' as const), ref: video5Ref }
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
