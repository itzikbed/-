'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { REGIONS, RegionId } from '@/lib/constants'
import { getAgeBucketLabel } from '@/lib/utils/age-bucket'
import { Badge } from '@/components/ui/Badge'
import { Heart } from 'lucide-react'
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
    : '/hero/hero_c1_poster.jpg' // fallback placeholder

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
      className={`group relative block w-full aspect-[4/5] overflow-hidden select-none border border-ink/10 bg-surface/45 backdrop-blur-lg backdrop-saturate-125 rounded-card shadow-resting hover:shadow-hover hover:-translate-y-0.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 ${
        isAdopted ? 'opacity-90' : ''
      }`}
    >
      {/* The photo is the card, cut at its foot on the sweep. Below the cut the
          card's own glass carries the details — one continuous surface, so
          there is no second edge to show a seam. */}
      <div className="card-curve-clip absolute inset-0">
        <Image
          src={imageUrl}
          alt={`${cat.name}, ${cat.sex === 'female' ? strings.catalog.genderFemaleNoun : strings.catalog.genderMaleNoun} ${strings.catalog.forAdoption}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          style={{ viewTransitionName: `cat-photo-${cat.id}` }}
          className={`object-cover object-center transition-all duration-500 group-hover:scale-105 ${
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
            className={`absolute top-3 end-3 z-10 bg-surface/85 backdrop-blur-sm text-ink rounded-full px-2.5 py-1 text-xs font-semibold flex items-center gap-1 shadow-sm transition-opacity duration-150 ${
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
              <Heart className="w-3 h-3 fill-current" aria-hidden="true" />
              <span>{strings.catalog.specialBadge}</span>
            </Badge>
          )}
        </div>
      </div>

      {/* The glass pane. Its top edge is the same sweep used between page bands,
          and it is opaque enough to hold ink at AA over any photo underneath. */}
      <div className="card-details-wash absolute inset-x-0 bottom-0 flex flex-col gap-0.5 px-4 pt-9 pb-4">
        <h2 className="text-lg font-display font-bold text-ink leading-tight line-clamp-1">
          {cat.name}
        </h2>
        <p className="text-[13px] font-semibold text-ink-soft leading-snug truncate">
          {ageLabel} &middot; {sexLabel}
        </p>
        <p className="text-[13px] font-semibold text-pine leading-snug truncate">
          {regionLabel} {cat.city ? `(${cat.city})` : ''}
        </p>
      </div>
    </Link>
  )
}
