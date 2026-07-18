'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { processImageFile } from '@/lib/utils/image-processing'
import { processEditedImage } from '@/lib/utils/edited-image'
import { CropAreaPixels, Rotation } from '@/lib/utils/crop-math'
import { getAllowedVideoExtension } from '@/lib/security/media'
import { strings } from '@/lib/strings'
import { PhotoItem } from './types'

interface UseCatMediaUploadArgs {
  catId: string
  photos: PhotoItem[]
  setPhotos: (photos: PhotoItem[]) => void
  videoPath: string | null
  setVideoPath: (path: string | null) => void
  isProcessing: boolean
  setIsProcessing: (value: boolean) => void
}

// localUrl previews point at the small card blobs (~50KB each, 6 max), so they
// are kept alive for the whole wizard session instead of being revoked on every
// photos-state change — revoking shared blob URLs broke previews after reorder
// and after step back-and-forth. They are revoked only on remove/replace.
export function useCatMediaUpload({
  catId,
  photos,
  setPhotos,
  videoPath,
  setVideoPath,
  isProcessing,
  setIsProcessing
}: UseCatMediaUploadArgs) {
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [currentFileIndex, setCurrentFileIndex] = useState<number | null>(null)
  const [totalFiles, setTotalFiles] = useState<number>(0)
  const [videoLoading, setVideoLoading] = useState(false)

  const supabase = createClient()

  const uploadVariantPair = async (
    cardBlob: Blob,
    fullBlob: Blob
  ): Promise<{ cardPath: string; fullPath: string }> => {
    const uuid = crypto.randomUUID()
    const cardPath = `${catId}/${uuid}-card.webp`
    const fullPath = `${catId}/${uuid}-full.webp`

    const { error: cardErr } = await supabase.storage
      .from('cat-photos')
      .upload(cardPath, cardBlob, { contentType: 'image/webp' })
    if (cardErr) throw new Error(cardErr.message)

    const { error: fullErr } = await supabase.storage
      .from('cat-photos')
      .upload(fullPath, fullBlob, { contentType: 'image/webp' })
    if (fullErr) {
      await supabase.storage.from('cat-photos').remove([cardPath])
      throw new Error(fullErr.message)
    }

    return { cardPath, fullPath }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadError(null)
    const newFiles = Array.from(files)

    if (photos.length + newFiles.length > 6) {
      setUploadError(strings.publish.maxPhotosLimit)
      return
    }

    setIsProcessing(true)
    setTotalFiles(newFiles.length)
    const updatedPhotos = [...photos]

    for (let i = 0; i < newFiles.length; i++) {
      setCurrentFileIndex(i + 1)
      const file = newFiles[i]

      if (file.size === 0 || file.size > 12 * 1024 * 1024) {
        setUploadError(strings.publish.maxSizePhoto.replace('{name}', file.name))
        continue
      }

      try {
        const { cardBlob, fullBlob } = await processImageFile(file)
        const { cardPath, fullPath } = await uploadVariantPair(cardBlob, fullBlob)

        updatedPhotos.push({
          path_card: cardPath,
          path_full: fullPath,
          sort_order: updatedPhotos.length,
          localUrl: URL.createObjectURL(cardBlob)
        })
        setPhotos([...updatedPhotos])
      } catch (err) {
        const isDecodeError = err instanceof Error && err.message === 'image_decode_failed'
        setUploadError(isDecodeError ? strings.publish.invalidImage : strings.publish.uploadError)
        break
      }
    }

    setIsProcessing(false)
    setCurrentFileIndex(null)
    setTotalFiles(0)
  }

  const applyPhotoEdit = async (
    index: number,
    sourceBlob: Blob,
    cropArea: CropAreaPixels,
    rotation: Rotation
  ): Promise<boolean> => {
    const photo = photos[index]
    if (!photo) return false

    try {
      const { cardBlob, fullBlob } = await processEditedImage(sourceBlob, cropArea, rotation)
      const { cardPath, fullPath } = await uploadVariantPair(cardBlob, fullBlob)

      if (photo.localUrl) {
        // Uploaded this session — no cat_photos row references the old pair yet.
        // Photos loaded from the DB keep their old objects until submit rewrites
        // the rows; scripts/cleanup-orphan-media.mjs sweeps the leftovers.
        await supabase.storage.from('cat-photos').remove([photo.path_card, photo.path_full])
        URL.revokeObjectURL(photo.localUrl)
      }

      setPhotos(
        photos.map((p, i) =>
          i === index
            ? {
                path_card: cardPath,
                path_full: fullPath,
                sort_order: p.sort_order,
                localUrl: URL.createObjectURL(cardBlob)
              }
            : p
        )
      )
      return true
    } catch {
      return false
    }
  }

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setVideoLoading(true)

    const extension = getAllowedVideoExtension(file.type)
    if (!extension || file.size === 0 || file.size > 25 * 1024 * 1024) {
      setUploadError(strings.publish.videoSizeLimit)
      setVideoLoading(false)
      return
    }

    try {
      const tempVideo = document.createElement('video')
      tempVideo.preload = 'metadata'
      tempVideo.src = URL.createObjectURL(file)

      const duration = await new Promise<number>((resolve, reject) => {
        tempVideo.onloadedmetadata = () => {
          URL.revokeObjectURL(tempVideo.src)
          resolve(tempVideo.duration)
        }
        tempVideo.onerror = () => {
          URL.revokeObjectURL(tempVideo.src)
          reject(new Error('invalid_video'))
        }
      })

      if (!Number.isFinite(duration) || duration <= 0 || duration > 15) {
        setUploadError(strings.publish.videoDurationLimit)
        setVideoLoading(false)
        return
      }

      const newVideoPath = `${catId}/${crypto.randomUUID()}-video.${extension}`

      const { error: uploadErr } = await supabase.storage
        .from('cat-photos')
        .upload(newVideoPath, file, { contentType: file.type })

      if (uploadErr) throw new Error(uploadErr.message)

      setVideoPath(newVideoPath)
    } catch {
      setUploadError(strings.publish.videoUploadError)
    } finally {
      setVideoLoading(false)
    }
  }

  const handleRemovePhoto = async (index: number, pathCard: string, pathFull: string) => {
    if (isProcessing) return
    setUploadError(null)
    try {
      const { error } = await supabase.storage.from('cat-photos').remove([pathCard, pathFull])
      if (error) throw new Error('photo_delete_failed')
      const removed = photos[index]
      if (removed?.localUrl) URL.revokeObjectURL(removed.localUrl)
      const nextPhotos = photos
        .filter((_, i) => i !== index)
        .map((p, idx) => ({ ...p, sort_order: idx }))
      setPhotos(nextPhotos)
    } catch {
      setUploadError(strings.publish.photoDeleteError)
    }
  }

  const handleRemoveVideo = async () => {
    if (!videoPath) return
    setUploadError(null)
    setVideoLoading(true)
    try {
      const { error } = await supabase.storage.from('cat-photos').remove([videoPath])
      if (error) throw new Error('video_delete_failed')
      setVideoPath(null)
    } catch {
      setUploadError(strings.publish.videoDeleteError)
    } finally {
      setVideoLoading(false)
    }
  }

  return {
    uploadError,
    currentFileIndex,
    totalFiles,
    videoLoading,
    handleImageChange,
    handleVideoChange,
    handleRemovePhoto,
    handleRemoveVideo,
    applyPhotoEdit
  }
}
