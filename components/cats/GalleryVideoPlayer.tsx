'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { strings } from '@/lib/strings'

interface GalleryVideoPlayerProps {
  videoPath: string
  catName: string
  coverPhotoUrl: string
  disableVideo: boolean
}

export const GalleryVideoPlayer: React.FC<GalleryVideoPlayerProps> = ({
  videoPath,
  catName,
  coverPhotoUrl,
  disableVideo
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [userOptIn, setUserOptIn] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'

  useEffect(() => {
    const resetPlay = () => {
      setIsPlaying(false)
    }
    requestAnimationFrame(resetPlay)
    if (videoRef.current) {
      videoRef.current.pause()
    }
  }, [videoPath])

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    const video = videoRef.current
    if (!video) {
      setUserOptIn(true)
      setIsPlaying(true)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(err => console.error("Gallery video play failed", err))
        }
      }, 50)
      return
    }

    if (isPlaying) {
      setIsPlaying(false)
      video.pause()
    } else {
      setUserOptIn(true)
      setIsPlaying(true)
      video.play().catch(err => console.error("Gallery video play failed", err))
    }
  }

  return (
    <div 
      onClick={togglePlay}
      className="relative w-full h-full cursor-pointer bg-paper select-none"
    >
      {/* Poster cover image */}
      <Image
        src={coverPhotoUrl}
        alt={strings.catalog.videoPreviewAlt.replace('{name}', catName)}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className={`object-cover object-center transition-opacity duration-300 ${
          isPlaying ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Video element - preloaded if data saver is off, or loaded on-demand */}
      {(userOptIn || !disableVideo) && (
        <video
          ref={videoRef}
          muted
          playsInline
          loop
          preload="metadata"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <source src={`${supabaseUrl}/storage/v1/object/public/cat-photos/${videoPath}.webm`} type="video/webm" />
          <source src={`${supabaseUrl}/storage/v1/object/public/cat-photos/${videoPath}.mp4`} type="video/mp4" />
        </video>
      )}

      {/* Play Button Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
          <button
            type="button"
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-surface/90 hover:bg-surface text-ink flex items-center justify-center shadow-resting transition-transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
            aria-label={strings.catalog.playVideo}
          >
            <svg className="w-8 h-8 fill-current translate-x-[2px]" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
