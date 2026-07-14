'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { Mascot } from '@/components/mascot/Mascot'
import { strings } from '@/lib/strings'
import { REGIONS, RegionId } from '@/lib/constants'
import { getAgeBucketLabel } from '@/lib/utils/filters'
import { deleteCatAction, markAsAdoptedAction } from '@/app/publish/cat-actions'
import { Edit, Trash2, Heart, Award } from 'lucide-react'

interface CatPhoto {
  path_card: string
  sort_order: number
}

interface Cat {
  id: string
  name: string
  sex: string
  birth_est: string
  region: string
  city: string | null
  status: string
  reject_reason: string | null
  cat_photos?: CatPhoto[]
}

interface MyCatsListProps {
  initialCats: Cat[]
}

export function MyCatsList({ initialCats }: MyCatsListProps) {
  const [cats, setCats] = useState<Cat[]>(initialCats)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleMarkAdopted = async (catId: string) => {
    if (!confirm(strings.publish.markAdoptedConfirm)) return
    setError(null)
    setLoadingId(catId)
    try {
      const res = await markAsAdoptedAction(catId)
      if (res.ok) {
        setCats(prev =>
          prev.map(c =>
            c.id === catId
              ? { ...c, status: 'adopted' }
              : c
          )
        )
      } else {
        setError(res.formError || strings.common.errorOccurred)
      }
    } catch {
      setError(strings.common.errorOccurred)
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (catId: string, name: string) => {
    const confirmMsg = strings.publish.deleteConfirm.replace('{name}', name)
    if (!confirm(confirmMsg)) return
    setError(null)
    setLoadingId(catId)
    try {
      const res = await deleteCatAction(catId)
      if (res.ok) {
        setCats(prev => prev.filter(c => c.id !== catId))
      } else {
        setError(res.formError || strings.common.errorOccurred)
      }
    } catch {
      setError(strings.common.errorOccurred)
    } finally {
      setLoadingId(null)
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'

  if (cats.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-card p-12 text-center space-y-6">
        <Mascot pose="sleeping" width={140} height={100} animateOnScroll />
        <h3 className="text-xl font-display font-extrabold text-ink">
          {strings.publish.noCats}
        </h3>
        <p className="text-sm text-ink-soft max-w-sm mx-auto font-semibold">
          {strings.publish.myCatsDashboardDesc}
        </p>
        <div className="pt-2">
          <Link
            href="/publish/new"
            className="inline-flex items-center justify-center font-bold px-6 py-3 bg-marmalade text-ink hover:bg-marmalade-dp rounded-btn shadow-resting transition-all active:scale-98 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
          >
            {strings.publish.addCatBtn}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger rounded-input p-4 text-sm font-semibold" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {cats.map((cat) => {
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
              key={cat.id}
              className="bg-surface border border-border rounded-card p-4 md:p-5 shadow-resting flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:shadow-hover transition-all duration-200"
            >
              {/* Photo & Details info */}
              <div className="flex gap-4 items-center">
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-input overflow-hidden bg-pine-soft/40 border border-border flex-shrink-0">
                  {coverPhoto ? (
                    <Image
                      src={`${supabaseUrl}/storage/v1/object/public/cat-photos/${coverPhoto.path_card}`}
                      alt={cat.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                      unoptimized={process.env.NEXT_PUBLIC_TEMPORARY_DISABLE_IMAGE_OPTIMIZATION === 'true'}
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

                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  disabled={isActionDisabled}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-danger/10 text-danger hover:bg-danger hover:text-white disabled:opacity-50 text-sm font-bold rounded-btn transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {strings.common.delete}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
