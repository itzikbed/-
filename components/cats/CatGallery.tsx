'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { strings } from '@/lib/strings'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Photo {
  path_card: string
  path_full: string
  sort_order: number
}

interface CatGalleryProps {
  photos: Photo[]
  catName: string
}

export const CatGallery: React.FC<CatGalleryProps> = ({ photos, catName }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  if (!photos || photos.length === 0) {
    return (
      <div className="relative w-full aspect-[4/3] bg-paper rounded-card border border-border flex items-center justify-center">
        <span className="text-ink-soft font-semibold">{strings.catalog.noPhotos}</span>
      </div>
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'

  const nextPhoto = () => {
    setActiveIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
  }

  const prevPhoto = () => {
    setActiveIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
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

  const activePhoto = photos[activeIndex]
  const mainImageUrl = `${supabaseUrl}/storage/v1/object/public/cat-photos/${activePhoto.path_full}`

  return (
    <div className="space-y-4">
      {/* Main Image Viewport */}
      <div 
        className="relative w-full aspect-[4/3] bg-paper rounded-card border border-border overflow-hidden shadow-resting group focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        aria-label={strings.catalog.galleryAriaLabel}
      >
        <Image
          src={mainImageUrl}
          alt={strings.catalog.photoAlt.replace('{name}', catName).replace('{index}', (activeIndex + 1).toString())}
          fill
          priority={activeIndex === 0}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-center transition-all duration-300"
        />

        {/* Side Navigation Arrows (Visible on Hover / Touch) */}
        {photos.length > 1 && (
          <>
            {/* Right arrow - Previous photo in RTL */}
            <button
              onClick={prevPhoto}
              className="absolute inset-y-0 end-3 my-auto w-10 h-10 rounded-full bg-surface/80 hover:bg-surface text-ink flex items-center justify-center shadow-resting transition-all active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
              aria-label={strings.catalog.prevPhoto}
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Left arrow - Next photo in RTL */}
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
      {photos.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {photos.map((photo, idx) => {
            const thumbUrl = `${supabaseUrl}/storage/v1/object/public/cat-photos/${photo.path_card}`
            const isActive = idx === activeIndex
            return (
              <button
                key={photo.path_card}
                onClick={() => setActiveIndex(idx)}
                className={`relative w-20 aspect-[4/3] rounded-photo overflow-hidden border-2 transition-all cursor-pointer ${
                  isActive ? 'border-pine shadow-resting' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={thumbUrl}
                  alt={strings.catalog.thumbAlt.replace('{index}', (idx + 1).toString())}
                  fill
                  sizes="80px"
                  className="object-cover object-center"
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
