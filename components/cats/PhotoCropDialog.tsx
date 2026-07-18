'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Cropper, { Area } from 'react-easy-crop'
import { RefreshCw, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { strings } from '@/lib/strings'
import { Rotation, rotatedBounds } from '@/lib/utils/crop-math'

type AspectMode = 'original' | 'card' | 'square'

export interface PhotoCropDialogProps {
  pathFull: string
  onClose: () => void
  onApply: (source: Blob, cropArea: Area, rotation: Rotation) => Promise<boolean>
}

const ASPECT_MODES: Array<{ mode: AspectMode; label: string }> = [
  { mode: 'original', label: strings.publish.cropAspectOriginal },
  { mode: 'card', label: strings.publish.cropAspectCard },
  { mode: 'square', label: strings.publish.cropAspectSquare }
]

const controlBtn =
  'min-w-11 min-h-11 inline-flex items-center justify-center rounded-input border border-border bg-surface text-ink hover:text-pine hover:border-pine cursor-pointer disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine'

// The cropper always receives an ALREADY-ROTATED preview (rotation prop 0):
// react-easy-crop computes zoom coverage from the unrotated media size, which
// silently center-crops rotated images. The final encode still runs from the
// original source blob with the accumulated rotation, so the preview's second
// encode never touches the stored result.
export default function PhotoCropDialog({ pathFull, onClose, onApply }: PhotoCropDialogProps) {
  const [sourceBlob, setSourceBlob] = useState<Blob | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [previewSize, setPreviewSize] = useState<{ width: number; height: number } | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState<Rotation>(0)
  const [aspectMode, setAspectMode] = useState<AspectMode>('original')
  const [cropArea, setCropArea] = useState<Area | null>(null)
  const bitmapRef = useRef<ImageBitmap | null>(null)
  const urlRef = useRef<string | null>(null)

  const buildPreview = useCallback((rot: Rotation) => {
    const bitmap = bitmapRef.current
    if (!bitmap) return
    const bounds = rotatedBounds(bitmap.width, bitmap.height, rot)
    const canvas = document.createElement('canvas')
    canvas.width = bounds.width
    canvas.height = bounds.height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setLoadError(true)
      return
    }
    ctx.translate(bounds.width / 2, bounds.height / 2)
    ctx.rotate((rot * Math.PI) / 180)
    ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2)
    canvas.toBlob((blob) => {
      if (!blob) {
        setLoadError(true)
        return
      }
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      urlRef.current = URL.createObjectURL(blob)
      setImageUrl(urlRef.current)
      setPreviewSize(bounds)
    }, 'image/webp', 0.92)
  }, [])

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    supabase.storage
      .from('cat-photos')
      .download(pathFull)
      .then(async ({ data, error }) => {
        if (cancelled) return
        if (error || !data) {
          setLoadError(true)
          return
        }
        try {
          const bitmap = await createImageBitmap(data)
          if (cancelled) {
            bitmap.close()
            return
          }
          bitmapRef.current = bitmap
          setSourceBlob(data)
          buildPreview(0)
        } catch {
          setLoadError(true)
        }
      })
    return () => {
      cancelled = true
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      bitmapRef.current?.close()
      bitmapRef.current = null
    }
  }, [pathFull, buildPreview])

  const aspect =
    aspectMode === 'card'
      ? 4 / 3
      : aspectMode === 'square'
        ? 1
        : previewSize
          ? previewSize.width / previewSize.height
          : 4 / 3

  const rotate = (delta: 90 | 270) => {
    const next = ((rotation + delta) % 360) as Rotation
    setRotation(next)
    setZoom(1)
    setCrop({ x: 0, y: 0 })
    buildPreview(next)
  }
  const zoomBy = (delta: number) => {
    setZoom((prev) => Math.min(3, Math.max(1, Math.round((prev + delta) * 100) / 100)))
  }

  const handleApply = async () => {
    if (!sourceBlob || !cropArea || saving) return
    setSaving(true)
    setSaveError(false)
    const ok = await onApply(sourceBlob, cropArea, rotation)
    setSaving(false)
    if (!ok) setSaveError(true)
  }

  return (
    <Dialog
      isOpen
      onClose={saving ? () => undefined : onClose}
      title={strings.publish.cropDialogTitle}
      actions={
        <>
          <Button type="button" variant="draft" onClick={onClose} disabled={saving}>
            {strings.publish.cropCancel}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleApply}
            disabled={!imageUrl || !cropArea}
            loading={saving}
          >
            {strings.publish.cropApply}
          </Button>
        </>
      }
    >
      {loadError ? (
        <p className="text-sm text-danger font-semibold" role="alert">
          {strings.publish.cropLoadError}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="relative w-full h-72 bg-ink/90 rounded-input overflow-hidden">
            {imageUrl ? (
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_area, areaPixels) => setCropArea(areaPixels)}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/90">
                <RefreshCw className="w-6 h-6 animate-spin" aria-hidden="true" />
                <span className="text-sm font-semibold">{strings.publish.cropLoading}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button type="button" onClick={() => rotate(90)} disabled={!imageUrl || saving} aria-label={strings.publish.rotateRight} title={strings.publish.rotateRight} className={controlBtn}>
              <RotateCw className="w-5 h-5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => rotate(270)} disabled={!imageUrl || saving} aria-label={strings.publish.rotateLeft} title={strings.publish.rotateLeft} className={controlBtn}>
              <RotateCcw className="w-5 h-5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => zoomBy(0.25)} disabled={!imageUrl || saving || zoom >= 3} aria-label={strings.publish.zoomIn} title={strings.publish.zoomIn} className={controlBtn}>
              <ZoomIn className="w-5 h-5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => zoomBy(-0.25)} disabled={!imageUrl || saving || zoom <= 1} aria-label={strings.publish.zoomOut} title={strings.publish.zoomOut} className={controlBtn}>
              <ZoomOut className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label={strings.publish.cropDialogTitle}>
            {ASPECT_MODES.map(({ mode, label }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setAspectMode(mode)}
                disabled={!imageUrl || saving}
                aria-pressed={aspectMode === mode}
                className={`min-h-11 px-4 rounded-btn border text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine ${
                  aspectMode === mode
                    ? 'bg-pine text-white border-pine'
                    : 'bg-surface text-ink border-border hover:border-pine hover:text-pine'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {saveError && (
            <p className="text-sm text-danger font-semibold" role="alert">
              {strings.publish.cropSaveError}
            </p>
          )}
        </div>
      )}
    </Dialog>
  )
}
