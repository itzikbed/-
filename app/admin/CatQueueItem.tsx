'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { REGIONS, RegionId } from '@/lib/constants'
import { getAgeBucketLabel } from '@/lib/utils/age-bucket'
import { strings } from '@/lib/strings'
import { getMediaUrl } from '@/lib/security/media'
import Image from 'next/image'

interface CatPhoto {
  id: string
  path_card: string
  path_full: string
  sort_order: number
}

interface Cat {
  id: string
  owner_id: string
  name: string
  sex: string
  birth_est: string
  region: string
  city: string | null
  description: string
  health_notes: string | null
  neutered: boolean | null
  vaccinations: number
  is_special: boolean
  special_needs: string | null
  fee_amount: number | null
  good_with_cats: boolean | null
  good_with_dogs: boolean | null
  status: string
  created_at: string
  cat_photos?: CatPhoto[]
  owner?: {
    full_name: string
    phone: string | null
  } | null
}

interface CatQueueItemProps {
  cat: Cat
  isPending: boolean
  onApprove: (id: string) => void
  onRejectTrigger: (id: string) => void
}

export default function CatQueueItem({
  cat,
  isPending,
  onApprove,
  onRejectTrigger
}: CatQueueItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const getRegionLabel = (regionId: string | null) => {
    return REGIONS.find(r => r.id === regionId as RegionId)?.label || regionId || '—'
  }

  const getSexLabel = (sex: string) => {
    if (sex === 'male') return strings.catalog.genderMale
    if (sex === 'female') return strings.catalog.genderFemale
    return strings.catalog.genderUnknown
  }

  const coverPhoto = cat.cat_photos?.find(p => p.sort_order === 0) || cat.cat_photos?.[0]
  const imageUrl = coverPhoto
    ? getMediaUrl(coverPhoto.path_card)
    : '/hero/hero_c1_poster.jpg'

  return (
    <div className="flex flex-col">
      {/* Summary Row */}
      <button 
        type="button"
        onClick={toggleExpand}
        aria-expanded={isExpanded}
        className="w-full text-start flex items-center justify-between p-4 cursor-pointer hover:bg-paper/10 transition-colors border-0 bg-transparent font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 rounded-sm"
      >
        <div className="flex items-center gap-4 text-start">
          <Image 
            src={imageUrl} 
            alt={cat.name} 
            width={48}
            height={48}
            unoptimized
            className="w-12 h-12 rounded-input object-cover border border-border"
          />
          <div className="flex flex-col gap-0.5">
            <h3 className="text-base font-bold text-ink">{cat.name}</h3>
            <p className="text-xs font-semibold text-ink-soft">
              {getSexLabel(cat.sex)} &middot; {getAgeBucketLabel(cat.birth_est)} &middot; {getRegionLabel(cat.region)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-ink-soft font-mono">
            <bdi>{new Date(cat.created_at).toLocaleDateString('he-IL')}</bdi>
          </span>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-ink-soft" /> : <ChevronDown className="w-5 h-5 text-ink-soft" />}
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="bg-paper/20 p-5 border-t border-border/40 text-start space-y-4 animate-fade-in">
          
          {/* Basic Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="block text-xs text-ink-soft font-semibold mb-1">{strings.admin.cat.sexAge}</span>
              <span className="font-semibold text-ink">{getSexLabel(cat.sex)} ({getAgeBucketLabel(cat.birth_est)})</span>
            </div>
            <div>
              <span className="block text-xs text-ink-soft font-semibold mb-1">{strings.admin.cat.regionCity}</span>
              <span className="font-semibold text-ink">{getRegionLabel(cat.region)} {cat.city ? `(${cat.city})` : ''}</span>
            </div>
            <div>
              <span className="block text-xs text-ink-soft font-semibold mb-1">{strings.admin.cat.fee}</span>
              <span className="font-semibold text-ink">{cat.fee_amount ? `${cat.fee_amount} ₪` : strings.admin.cat.noFee}</span>
            </div>
            <div>
              <span className="block text-xs text-ink-soft font-semibold mb-1">{strings.admin.cat.publisher}</span>
              <span className="font-semibold text-ink">
                {cat.owner?.full_name || '—'} &middot; <span dir="ltr">{cat.owner?.phone || '—'}</span>
              </span>
            </div>
          </div>

          {/* Medical / Behavior */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm pt-2">
            <div>
              <span className="block text-xs text-ink-soft font-semibold mb-1">{strings.admin.cat.medical}</span>
              <span className="font-semibold text-ink">
                {cat.neutered ? strings.common.yes : strings.common.no} &middot; {cat.vaccinations}
              </span>
            </div>
            <div>
              <span className="block text-xs text-ink-soft font-semibold mb-1">{strings.admin.cat.goodWith}</span>
              <span className="font-semibold text-ink">
                {strings.admin.cat.goodWith}: {cat.good_with_cats ? strings.common.yes : strings.common.no} &middot; {cat.good_with_dogs ? strings.common.yes : strings.common.no}
              </span>
            </div>
            <div>
              <span className="block text-xs text-ink-soft font-semibold mb-1">{strings.admin.cat.specialNeeds}</span>
              <span className="font-semibold text-ink text-pine font-bold">
                {cat.is_special ? cat.special_needs || strings.common.yes : strings.common.no}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="text-sm pt-2">
            <span className="block text-xs text-ink-soft font-semibold mb-1">{strings.admin.cat.description}</span>
            <p className="bg-surface p-3 rounded-input border border-border/40 font-medium text-ink leading-relaxed whitespace-pre-line">
              {cat.description}
            </p>
          </div>

          {cat.health_notes && (
            <div className="text-sm pt-1">
              <span className="block text-xs text-ink-soft font-semibold mb-1">{strings.admin.cat.healthNotes}</span>
              <p className="bg-surface p-3 rounded-input border border-border/40 font-medium text-ink leading-relaxed whitespace-pre-line">
                {cat.health_notes}
              </p>
            </div>
          )}

          {/* Gallery Grid */}
          {cat.cat_photos && cat.cat_photos.length > 0 && (
            <div className="pt-2">
              <span className="block text-xs text-ink-soft font-semibold mb-1">
                {strings.admin.cat.gallery.replace('{count}', String(cat.cat_photos.length))}
              </span>
              <div className="flex flex-wrap gap-2">
                {cat.cat_photos.map((photo) => {
                  const photoUrl = getMediaUrl(photo.path_card)
                  return (
                    <a key={photo.id} href={getMediaUrl(photo.path_full)} target="_blank" rel="noreferrer">
                      <Image 
                        src={photoUrl} 
                        alt=""
                        width={64}
                        height={64}
                        unoptimized
                        className="w-16 h-16 object-cover rounded-input border border-border/60 hover:border-pine transition-colors cursor-zoom-in"
                      />
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
            <Button 
              variant="tertiary" 
              className="text-danger hover:bg-danger/10" 
              onClick={() => onRejectTrigger(cat.id)}
              disabled={isPending}
            >
              {strings.admin.cat.rejectBtn}
            </Button>
            <Button 
              variant="primary" 
              onClick={() => onApprove(cat.id)}
              disabled={isPending}
            >
              {isPending ? strings.admin.cat.approving : strings.admin.cat.approveBtn}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
export type { Cat }
