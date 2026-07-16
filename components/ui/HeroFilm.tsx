'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { shouldDisableVideo } from '@/lib/utils/video-playback'
import { PlaybackDirector } from '@/lib/utils/playback-director'

// Two clip sets (DESIGN §6b.3): landscape clips for desktop, portrait close-up
// crops for mobile. Clip #1 is shared by both sets because its first frame must
// match the SSR base poster (the LCP element).
const DESKTOP_CLIPS = ['hero_1', 'hero_d2', 'hero_d3', 'hero_d4', 'hero_d5']
const MOBILE_CLIPS = ['hero_1', 'hero_3', 'hero_m2', 'hero_m3', 'hero_m4']

export const HeroFilm: React.FC = () => {
  const [disableVideo, setDisableVideo] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [clips, setClips] = useState<string[] | null>(null)

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  useEffect(() => {
    // Defer state update to avoid synchronous cascades in effect body
    const checkVideo = () => {
      setDisableVideo(shouldDisableVideo())
    }
    requestAnimationFrame(checkVideo)

    // Pick the clip set for the current viewport; re-pick if the viewport
    // crosses the breakpoint (e.g. phone rotation, window resize)
    const mq = window.matchMedia('(min-width: 768px)')
    const applyClipSet = () => {
      setClips(mq.matches ? DESKTOP_CLIPS : MOBILE_CLIPS)
      setActiveIndex(0)
    }
    applyClipSet()
    mq.addEventListener('change', applyClipSet)

    // Set isLoaded after page load or component mount to lazy load clips 2-5
    let removeLoadListener: (() => void) | undefined
    if (document.readyState === 'complete') {
      setTimeout(() => setIsLoaded(true), 0)
    } else {
      const handleLoad = () => setIsLoaded(true)
      window.addEventListener('load', handleLoad)
      removeLoadListener = () => window.removeEventListener('load', handleLoad)
    }

    return () => {
      mq.removeEventListener('change', applyClipSet)
      removeLoadListener?.()
    }
  }, [])

  // Slide cycle logic (8 seconds per clip)
  const clipCount = clips?.length ?? 0
  useEffect(() => {
    if (disableVideo || clipCount === 0) return

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % clipCount)
    }, 8000)

    return () => clearInterval(interval)
  }, [disableVideo, clipCount])

  // PlaybackDirector registration and pausing inactive videos
  useEffect(() => {
    if (disableVideo || !clips) return

    videoRefs.current.forEach((ref, index) => {
      if (!ref) return
      if (index === activeIndex) {
        // Active video: register and play
        const play = async () => {
          try {
            await ref.play()
          } catch (err) {
            console.error('Hero video playback failed', err)
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

    const registered = videoRefs.current.slice()
    return () => {
      PlaybackDirector.unregister('hero')
      registered.forEach((ref) => ref?.pause())
    }
  }, [activeIndex, disableVideo, clips])

  // Base poster is the first child of the same container in both branches, so React
  // keeps it mounted across the disableVideo swap and the LCP paints from SSR HTML
  // instead of waiting for hydration.
  const basePoster = (
    <Image
      src="/hero/hero_1_poster.jpg"
      alt=""
      aria-hidden="true"
      priority
      fetchPriority="high"
      unoptimized
      fill
      sizes="100vw"
      className="object-cover z-0"
    />
  )

  if (disableVideo || !clips) {
    return (
      <div className="absolute inset-0 z-0 bg-paper" data-hero-section>
        {basePoster}
        {/* Gradient Overlay for Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/40 to-transparent z-20 pointer-events-none" />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-0 bg-paper" data-hero-section>
      {basePoster}
      {clips.map((clip, index) => {
        const isActive = index === activeIndex
        // Only clip #1 loads eagerly; the rest wait for the window load event
        const isFetchable = index === 0 || isLoaded
        return (
          <video
            key={clip}
            ref={(el) => {
              videoRefs.current[index] = el
            }}
            muted
            playsInline
            loop
            preload={isFetchable ? 'metadata' : 'none'}
            poster={`/hero/${clip}_poster.jpg`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {isFetchable && (
              <>
                <source src={`/hero/${clip}.webm`} type="video/webm" />
                <source src={`/hero/${clip}.mp4`} type="video/mp4" />
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
