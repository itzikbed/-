'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { strings } from '@/lib/strings'
import { getMediaUrl } from '@/lib/security/media'
import { REGIONS, RegionId } from '@/lib/constants'
import { getAgeBucketLabel } from '@/lib/utils/filters'
import { Edit, Trash2, Heart, Award } from 'lucide-react'

export interface CatPhoto {
  path_card: string
  sort_order: number
}

export interface Cat {
  id: string
  name: string
  sex: string
  birth_est: string
  region: string
  city: string | null
  status: string
  reject_reason: string | null
  published_at: string | null
  cat_photos?: CatPhoto[]
}

interface MyCatCardProps {
  cat: Cat
  loadingId: string | null
  handleMarkAdopted: (catId: string) => Promise<void>
  handleDelete: (catId: string, name: string) => Promise<void>
  handleArchive: (catId: string, name: string) => Promise<void>
}

export function MyCatCard({
  cat,
  loadingId,
  handleMarkAdopted,
  handleDelete,
  handleArchive
}: MyCatCardProps) {
  const coverPhoto = cat.cat_photos?.find(p => p.sort_order === 0) || cat.cat_photos?.[0]
  const ageLabel = getAgeBucketLabel(cat.birth_est)
  const sexLabel =
    cat.sex === 'male'
      ? strings.catalog.genderMale
      : cat.sex === 'female'
      ? strings.catalog.genderFemale
      : strings.catalog.genderUnknown

  const regionObj = REGIONS.find(r => r.id === cat.region as RegionId)
  const regionLabel = regionObj ? regionObj.label : cat.region

  const isActionDisabled = loadingId === cat.id
  return (
    <div
      className="bg-surface border border-border rounded-card p-4 md:p-5 shadow-resting flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:shadow-hover transition-all duration-200"
    >
      {/* Photo & Details info */}
      <div className="flex gap-4 items-center">
        <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-input overflow-hidden bg-pine-soft/40 border border-border flex-shrink-0">
          {coverPhoto ? (
            <Image
              src={getMediaUrl(coverPhoto.path_card)}
              alt={cat.name}
              fill
              sizes="96px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-pine">
              <Award className="w-8 h-8 opacity-40" />
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-xl font-display font-extrabold text-ink leading-none">
               {cat.name}
            </h4>
            <Badge variant={cat.status as 'adopted' | 'pending' | 'published' | 'rejected' | 'draft' | 'archived'}>
              {strings.badges[cat.status as keyof typeof strings.badges] || cat.status}
            </Badge>
          </div>

          <p className="text-sm font-semibold text-ink-soft">
            {sexLabel} &middot; {ageLabel} &middot; {regionLabel}
          </p>

          {cat.status === 'rejected' && cat.reject_reason && (
            <div className="text-xs bg-danger/5 text-danger border border-danger/10 px-3 py-1.5 rounded-input font-semibold max-w-md">
              <strong>{strings.publish.rejectReasonLabel}</strong>
              {cat.reject_reason}
            </div>
          )}
        </div>
      </div>

      {/* Actions panel */}
      <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-border/50">
        {cat.status === 'published' && (
          <button
            onClick={() => handleMarkAdopted(cat.id)}
            disabled={isActionDisabled}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-pine text-white hover:bg-pine-soft hover:text-pine disabled:opacity-50 text-sm font-bold rounded-btn shadow-resting transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
          >
            <Heart className="w-4 h-4 fill-current" />
            {strings.publish.markAdopted}
          </button>
        )}

        <Link
          href={`/publish/edit/${cat.id}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-border text-ink hover:bg-marmalade-sf text-sm font-bold rounded-btn transition-all focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
        >
          <Edit className="w-4 h-4 text-ink-soft" />
          {strings.common.edit}
        </Link>

        {cat.published_at === null ? (
          <button
            onClick={() => handleDelete(cat.id, cat.name)}
            disabled={isActionDisabled}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-danger/10 text-danger hover:bg-danger hover:text-white disabled:opacity-50 text-sm font-bold rounded-btn transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
          >
            <Trash2 className="w-4 h-4" />
            {strings.common.delete}
          </button>
        ) : (
          cat.status !== 'archived' && (
            <button
              onClick={() => handleArchive(cat.id, cat.name)}
              disabled={isActionDisabled}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-danger/10 text-danger hover:bg-danger hover:text-white disabled:opacity-50 text-sm font-bold rounded-btn transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
            >
              <Trash2 className="w-4 h-4" />
              {strings.publish.archiveBtn}
            </button>
          )
        )}
      </div>
    </div>
  )
}
