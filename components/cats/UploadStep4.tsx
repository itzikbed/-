'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { strings } from '@/lib/strings'
import { Button } from '@/components/ui/Button'
import { unpublishForMediaEditAction } from '@/app/publish/media-edit-actions'
import { CaptureTipsPanel } from './CaptureTipsPanel'
import { PhotoUploadGrid } from './PhotoUploadGrid'
import { VideoUploadSection } from './VideoUploadSection'
import { useCatMediaUpload } from './useCatMediaUpload'
import { PhotoItem } from './types'
import type { CropAreaPixels, Rotation } from '@/lib/utils/crop-math'

// The crop editor (react-easy-crop) is fetched only when a photo edit opens.
const PhotoCropDialog = dynamic(() => import('./PhotoCropDialog'), { ssr: false })

interface UploadStep4Props {
  catId: string
  initialStatus: string | null
  photos: PhotoItem[]
  setPhotos: (photos: PhotoItem[]) => void
  videoPath: string | null
  setVideoPath: (path: string | null) => void
  isProcessing: boolean
  setIsProcessing: (loading: boolean) => void
}

export function UploadStep4({
  catId,
  initialStatus,
  photos,
  setPhotos,
  videoPath,
  setVideoPath,
  isProcessing,
  setIsProcessing
}: UploadStep4Props) {
  const [editIndex, setEditIndex] = useState<number | null>(null)
  // Storage RLS freezes media of published cats for owners (migration 0011);
  // media controls unlock only after an explicit, confirmed unpublish.
  const [mediaUnlocked, setMediaUnlocked] = useState(initialStatus !== 'published')
  const [unlockLoading, setUnlockLoading] = useState(false)
  const [unlockError, setUnlockError] = useState(false)

  const {
    uploadError,
    currentFileIndex,
    totalFiles,
    videoLoading,
    handleImageChange,
    handleVideoChange,
    handleRemovePhoto,
    handleRemoveVideo,
    applyPhotoEdit
  } = useCatMediaUpload({
    catId,
    photos,
    setPhotos,
    videoPath,
    setVideoPath,
    isProcessing,
    setIsProcessing
  })

  const editing = editIndex !== null && photos[editIndex]
    ? { index: editIndex, photo: photos[editIndex] }
    : null

  const handleApplyEdit = async (
    source: Blob,
    cropArea: CropAreaPixels,
    rotation: Rotation
  ): Promise<boolean> => {
    if (!editing) return false
    const ok = await applyPhotoEdit(editing.index, source, cropArea, rotation)
    if (ok) setEditIndex(null)
    return ok
  }

  const handleUnlock = async () => {
    setUnlockLoading(true)
    setUnlockError(false)
    try {
      const res = await unpublishForMediaEditAction(catId)
      if (res.ok) setMediaUnlocked(true)
      else setUnlockError(true)
    } catch {
      setUnlockError(true)
    } finally {
      setUnlockLoading(false)
    }
  }

  const heading = (
    <h3 className="text-xl font-display font-extrabold text-ink">
      {strings.publish.wizardStep.replace('{step}', '4').replace('{total}', '4')} — {strings.publish.wizardStep4Title}
    </h3>
  )

  if (!mediaUnlocked) {
    return (
      <div className="space-y-6">
        {heading}
        <CaptureTipsPanel />
        <div className="bg-marmalade-sf/40 border border-marmalade/30 rounded-input p-4 space-y-3">
          <p className="text-sm font-semibold text-ink">{strings.publish.mediaEditLockedNotice}</p>
          {unlockError && (
            <p className="text-xs text-danger font-semibold" role="alert">
              {strings.publish.mediaEditUnlockError}
            </p>
          )}
          <Button type="button" variant="secondary" onClick={handleUnlock} loading={unlockLoading}>
            {strings.publish.mediaEditUnlockBtn}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {heading}

      <CaptureTipsPanel />

      {uploadError && (
        <div className="bg-danger/10 border border-danger/20 text-danger rounded-input p-3.5 text-sm font-semibold" role="alert">
          {uploadError}
        </div>
      )}

      <PhotoUploadGrid
        photos={photos}
        setPhotos={setPhotos}
        isProcessing={isProcessing}
        currentFileIndex={currentFileIndex}
        totalFiles={totalFiles}
        handleImageChange={handleImageChange}
        handleRemovePhoto={handleRemovePhoto}
        onEditPhoto={setEditIndex}
      />

      <VideoUploadSection
        videoPath={videoPath}
        videoLoading={videoLoading}
        onVideoChange={handleVideoChange}
        onRemoveVideo={handleRemoveVideo}
      />

      {editing && (
        <PhotoCropDialog
          pathFull={editing.photo.path_full}
          onClose={() => setEditIndex(null)}
          onApply={handleApplyEdit}
        />
      )}
    </div>
  )
}
