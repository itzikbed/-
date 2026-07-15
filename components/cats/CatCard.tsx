'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { REGIONS, RegionId } from '@/lib/constants'
import { getAgeBucketLabel } from '@/lib/utils/filters'
import { Badge } from '@/components/ui/Badge'
import { strings } from '@/lib/strings'
import { shouldDisableVideo, hasExtension } from '@/lib/utils/video-playback'
import { PlaybackDirector } from '@/lib/utils/playback-director'
import { triggerViewTransition } from '@/lib/utils/view-transition-navigation'
import { getMediaUrl } from '@/lib/security/media'

export interface CatCardProps {
  cat: {
    id: string
    name: string
    sex: string
    birth_est: string
    region: string
    city: string | null
    is_special: boolean
    status: string
    video_path?: string | null
    cat_photos?: Array<{
      path_card: string
      path_full: string
      sort_order: number
    }> | null
  }
}

export const CatCard: React.FC<CatCardProps> = ({ cat }) => {
  const router = useRouter()
  
  // Find cover photo (sort_order = 0), otherwise fall back to first photo or a placeholder
  const coverPhoto = cat.cat_photos?.find(p => p.sort_order === 0) || cat.cat_photos?.[0]
  const imageUrl = coverPhoto
    ? getMediaUrl(coverPhoto.path_card)
    : '/hero/hero_1_poster.jpg' // fallback placeholder

  // Look up region label
  const regionObj = REGIONS.find(r => r.id === cat.region as RegionId)
  const regionLabel = regionObj ? regionObj.label : cat.region

  // Hebrew sex label
  const sexLabel = cat.sex === 'male' 
    ? strings.catalog.genderMale 
    : cat.sex === 'female' 
    ? strings.catalog.genderFemale 
    : strings.catalog.genderUnknown

  // Age bucket label
  const ageLabel = getAgeBucketLabel(cat.birth_est)

  const isAdopted = cat.status === 'adopted'

  // Video state management
  const [disableVideo, setDisableVideo] = React.useState(true)
  const [isActive, setIsActive] = React.useState(false)
  const videoRef = React.useRef<HTMLVideoElement>(null)

  React.useEffect(() => {
    // Defer state update to avoid synchronous cascades in effect body
    const checkVideo = () => {
      setDisableVideo(shouldDisableVideo())
    }
    requestAnimationFrame(checkVideo)
  }, [])

  React.useEffect(() => {
    if (!videoRef.current || !cat.video_path || disableVideo) return

    const video = videoRef.current
    const play = async () => {
      setIsActive(true)
      try {
        await video.play()
      } catch (err) {
        console.error("Card video playback failed", err)
      }
    }

    const pause = () => {
      setIsActive(false)
      video.pause()
    }

    PlaybackDirector.register(cat.id, video, { play, pause })

    return () => {
      PlaybackDirector.unregister(cat.id)
    }
  }, [cat.id, cat.video_path, disableVideo])

  const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If it's a modified click (Ctrl, Cmd, Shift, Middle click), keep native browser behavior
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) {
      return
    }
    e.preventDefault()
    triggerViewTransition(router, `/cats/${cat.id}`)
  }

  const hasAutoplayVideo = !!(cat.video_path && !hasExtension(cat.video_path))

  return (
    <Link
      href={`/cats/${cat.id}`}
      onClick={handleCardClick}
      data-cat-card
      data-cat-card-id={cat.id}
      onMouseEnter={() => {
        if (hasAutoplayVideo && !disableVideo) PlaybackDirector.playSingle(cat.id)
      }}
      onMouseLeave={() => {
        if (hasAutoplayVideo && !disableVideo) PlaybackDirector.pauseSingle(cat.id)
      }}
      onFocus={() => {
        if (hasAutoplayVideo && !disableVideo) PlaybackDirector.playSingle(cat.id)
      }}
      onBlur={() => {
        if (hasAutoplayVideo && !disableVideo) PlaybackDirector.pauseSingle(cat.id)
      }}
      className={`group bg-surface rounded-card border border-border shadow-resting hover:shadow-hover hover:-translate-y-0.5 transition-all duration-150 flex flex-col overflow-hidden select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 ${
        isAdopted ? 'opacity-90' : ''
      }`}
    >
      {/* 4:3 Aspect Ratio Image Container */}
      <div className="relative w-full aspect-[4/3] bg-paper overflow-hidden">
        <Image
          src={imageUrl}
          alt={strings.catalog.cardImageAlt.replace('{name}', cat.name)}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          style={{ viewTransitionName: `cat-photo-${cat.id}` }}
          className={`object-cover object-center transition-all duration-200 group-hover:scale-102 ${
            isAdopted ? 'grayscale-[30%]' : ''
          }`}
        />

        {/* Video Overlay with 150ms opacity transition */}
        {hasAutoplayVideo && !disableVideo && (
          <video
            ref={videoRef}
            muted
            playsInline
            loop
            preload="none"
            poster={imageUrl}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-150 ${
              isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <source src={getMediaUrl(`${cat.video_path}.webm`)} type="video/webm" />
            <source src={getMediaUrl(`${cat.video_path}.mp4`)} type="video/mp4" />
          </video>
        )}

        {/* Video Affordance Badge */}
        {hasAutoplayVideo && (
          <div 
            className={`absolute bottom-3 start-3 z-10 bg-surface/85 backdrop-blur-sm text-ink rounded-full px-2.5 py-1 text-xs font-semibold flex items-center gap-1 shadow-sm transition-opacity duration-150 ${
              (disableVideo || !isActive) ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            aria-label={strings.catalog.videoAriaLabel.replace('{name}', cat.name)}
          >
            {/* Play glyph */}
            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <span>{strings.catalog.videoBadge}</span>
          </div>
        )}
        
        {/* Floating Badges */}
        <div className="absolute top-3 start-3 flex flex-col gap-2 z-10">
          {isAdopted && (
            <Badge variant="adopted" className="shadow-md">
              {strings.badges.adopted}
            </Badge>
          )}
          {cat.is_special && (
            <Badge variant="pending" className="shadow-md flex items-center gap-1 font-bold">
              <span>{strings.catalog.specialBadge}</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Info Content */}
      <div className="p-5 flex flex-col flex-grow justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold text-ink leading-tight">
              {cat.name}
            </h3>
          </div>
          
          {/* Meta line: Age bucket · Sex */}
          <p className="text-sm font-semibold text-ink-soft">
            {ageLabel} &middot; {sexLabel}
          </p>
        </div>

        {/* Location chip */}
        <div className="flex items-center justify-between mt-auto">
          <span className="inline-flex items-center justify-center font-sans font-semibold rounded-full bg-pine-soft text-pine text-xs px-3 py-1.5 border border-pine/10">
            {regionLabel} {cat.city ? `(${cat.city})` : ''}
          </span>
        </div>
      </div>
    </Link>
  )
}
