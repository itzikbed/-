'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { strings } from '@/lib/strings'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { shouldDisableVideo } from '@/lib/utils/video-playback'
import { getMediaUrl } from '@/lib/security/media'
import { GalleryVideoPlayer } from './GalleryVideoPlayer'

interface Photo {
  path_card: string
  path_full: string
  sort_order: number
}

interface CatGalleryProps {
  photos: Photo[]
  catName: string
  catId?: string
  videoPath?: string | null
}

interface Slide {
  type: 'photo' | 'video'
  photo?: Photo
  index: number
}

export const CatGallery: React.FC<CatGalleryProps> = ({ 
  photos, 
  catName, 
  catId, 
  videoPath = null 
}) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [disableVideo, setDisableVideo] = useState(true)

  useEffect(() => {
    const checkVideoSettings = () => {
      setDisableVideo(shouldDisableVideo())
    }
    requestAnimationFrame(checkVideoSettings)
  }, [])

  if (!photos || photos.length === 0) {
    return (
      <div className="relative w-full aspect-[4/3] bg-paper rounded-card border border-border flex items-center justify-center">
        <span className="text-ink-soft font-semibold">{strings.catalog.noPhotos}</span>
      </div>
    )
  }

  // Construct virtual slides: cover photo, then video (if present), then remaining photos
  const slides: Slide[] = []
  if (photos.length > 0) {
    slides.push({ type: 'photo', photo: photos[0], index: 0 })
    
    if (videoPath) {
      slides.push({ type: 'video', index: -1 })
    }
    
    for (let i = 1; i < photos.length; i++) {
      slides.push({ type: 'photo', photo: photos[i], index: i })
    }
  }

  const nextPhoto = () => {
    setActiveIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
  }

  const prevPhoto = () => {
    setActiveIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const touchEnd = e.targetTouches[0].clientX
    const diff = touchStart - touchEnd

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextPhoto()
      } else {
        prevPhoto()
      }
      setTouchStart(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      nextPhoto()
    } else if (e.key === 'ArrowRight') {
      prevPhoto()
    }
  }

  const activeSlide = slides[activeIndex]

  return (
    <div className="space-y-4">
      {/* Main Slide Viewport */}
      <div 
        className="relative w-full aspect-[4/3] bg-paper rounded-card border border-border overflow-hidden shadow-resting group focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        aria-label={strings.catalog.galleryAriaLabel}
      >
        {activeSlide.type === 'photo' ? (
          <Image
            src={getMediaUrl(activeSlide.photo!.path_full)}
            alt={strings.catalog.photoAlt.replace('{name}', catName).replace('{index}', (activeSlide.index + 1).toString())}
            fill
            priority={activeIndex === 0}
            sizes="(max-width: 768px) 100vw, 50vw"
            style={activeIndex === 0 && catId ? { viewTransitionName: `cat-photo-${catId}` } : undefined}
            className="object-cover object-center transition-all duration-300"
          />
        ) : (
          <GalleryVideoPlayer
            videoPath={videoPath!}
            catName={catName}
            coverPhotoUrl={getMediaUrl(photos[0].path_full)}
            disableVideo={disableVideo}
          />
        )}

        {/* Side Navigation Arrows (Visible on Hover / Touch) */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute inset-y-0 end-3 my-auto w-10 h-10 rounded-full bg-surface/80 hover:bg-surface text-ink flex items-center justify-center shadow-resting transition-all active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
              aria-label={strings.catalog.prevPhoto}
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <button
              onClick={nextPhoto}
              className="absolute inset-y-0 start-3 my-auto w-10 h-10 rounded-full bg-surface/80 hover:bg-surface text-ink flex items-center justify-center shadow-resting transition-all active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
              aria-label={strings.catalog.nextPhoto}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail indicators */}
      {slides.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {slides.map((slide, idx) => {
            const isVideo = slide.type === 'video'
            const thumbUrl = isVideo 
              ? getMediaUrl(photos[0].path_card)
              : getMediaUrl(slide.photo!.path_card)
            const isActive = idx === activeIndex
            
            return (
              <button
                key={isVideo ? 'gallery-video-thumb' : slide.photo!.path_card}
                onClick={() => setActiveIndex(idx)}
                className={`relative w-20 aspect-[4/3] rounded-photo overflow-hidden border-2 transition-all cursor-pointer ${
                  isActive ? 'border-pine shadow-resting' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={thumbUrl}
                  alt={isVideo ? strings.catalog.videoThumbAlt : strings.catalog.thumbAlt.replace('{index}', (slide.index + 1).toString())}
                  fill
                  sizes="80px"
                  className="object-cover object-center"
                />
                {isVideo && (
                  <div className="absolute inset-0 bg-black/35 flex items-center justify-center z-10">
                    <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
