'use client'

import { Image as ImageIcon, X, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { strings } from '@/lib/strings'

interface PhotoItem {
  id?: string
  path_card: string
  path_full: string
  sort_order: number
  localUrl?: string
}

interface PhotoUploadGridProps {
  photos: PhotoItem[]
  setPhotos: (photos: PhotoItem[]) => void
  isProcessing: boolean
  currentFileIndex: number | null
  totalFiles: number
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  handleRemovePhoto: (index: number, pathCard: string, pathFull: string) => Promise<void>
  supabaseUrl: string
}

export function PhotoUploadGrid({
  photos,
  setPhotos,
  isProcessing,
  currentFileIndex,
  totalFiles,
  handleImageChange,
  handleRemovePhoto,
  supabaseUrl
}: PhotoUploadGridProps) {
  const movePhoto = (index: number, direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= photos.length) return

    const updated = [...photos]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp

    const resort = updated.map((p, idx) => ({ ...p, sort_order: idx }))
    setPhotos(resort)
  }

  return (
    <div className="space-y-4">
      {/* Sequential Image Processing Status */}
      {isProcessing && (
        <div className="bg-marmalade-sf/40 border border-marmalade/30 rounded-input p-4 text-center space-y-2">
          <RefreshCw className="w-6 h-6 text-warning animate-spin mx-auto" />
          <p className="text-sm font-bold text-ink">
            {strings.publish.processingImage} {currentFileIndex} {strings.publish.outOf} {totalFiles}...
          </p>
          <span className="text-xs text-ink-soft block">{strings.publish.processingCoaching}</span>
        </div>
      )}

      {/* Image Upload Area */}
      <div className="space-y-3">
        <span className="block text-sm font-bold text-ink">{strings.publish.photos}</span>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {photos.map((p, idx) => (
            <div key={idx} className="relative aspect-square bg-surface border border-border rounded-input overflow-hidden group">
              <Image
                src={p.localUrl || `${supabaseUrl}/storage/v1/object/public/cat-photos/${p.path_card}`}
                alt="Cat preview"
                fill
                sizes="80px"
                className="object-cover"
                unoptimized
              />
              {idx === 0 && (
                <span className="absolute top-1 start-1 text-[10px] font-bold bg-pine text-white px-1.5 py-0.5 rounded-full select-none">
                  {strings.publish.coverLabel}
                </span>
              )}
              {/* Overlay controls */}
              <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => movePhoto(idx, 'prev')}
                    className="p-1 bg-surface rounded-full text-ink hover:text-pine cursor-pointer"
                    title={strings.publish.movePrev}
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {idx < photos.length - 1 && (
                  <button
                    type="button"
                    onClick={() => movePhoto(idx, 'next')}
                    className="p-1 bg-surface rounded-full text-ink hover:text-pine cursor-pointer"
                    title={strings.publish.moveNext}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(idx, p.path_card, p.path_full)}
                  className="p-1 bg-danger text-white rounded-full hover:bg-danger-dp cursor-pointer"
                  title={strings.common.delete}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add Photo slot */}
          {photos.length < 6 && (
            <label className="relative aspect-square border-2 border-dashed border-border hover:border-pine rounded-input flex flex-col items-center justify-center cursor-pointer bg-surface/50 hover:bg-surface transition-all">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/heic"
                disabled={isProcessing}
                onChange={handleImageChange}
                className="hidden"
              />
              <ImageIcon className="w-6 h-6 text-ink-soft/80" />
              <span className="text-[10px] font-semibold text-ink-soft mt-1">{strings.publish.addPhotoLabel}</span>
            </label>
          )}
        </div>
        <p className="text-xs text-ink-soft font-semibold mt-1">
          {strings.publish.photosCoaching}
        </p>
      </div>
    </div>
  )
}
