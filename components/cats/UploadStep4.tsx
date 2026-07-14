'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { processImageFile } from '@/lib/utils/image-processing'
import { strings } from '@/lib/strings'
import { Film, X, UploadCloud, RefreshCw } from 'lucide-react'
import { PhotoUploadGrid } from './PhotoUploadGrid'

interface PhotoItem {
  id?: string
  path_card: string
  path_full: string
  sort_order: number
  localUrl?: string
}

interface UploadStep4Props {
  catId: string; photos: PhotoItem[]; setPhotos: (photos: PhotoItem[]) => void
  videoPath: string | null; setVideoPath: (path: string | null) => void
  isProcessing: boolean; setIsProcessing: (loading: boolean) => void
}

export function UploadStep4({
  catId,
  photos,
  setPhotos,
  videoPath,
  setVideoPath,
  isProcessing,
  setIsProcessing
}: UploadStep4Props) {
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [currentFileIndex, setCurrentFileIndex] = useState<number | null>(null)
  const [totalFiles, setTotalFiles] = useState<number>(0)
  const [videoLoading, setVideoLoading] = useState(false)

  const supabase = createClient()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'

  useEffect(() => () => {
    photos.forEach((p) => p.localUrl?.startsWith('blob:') && URL.revokeObjectURL(p.localUrl))
  }, [photos])

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

      if (file.size > 12 * 1024 * 1024) {
        setUploadError(strings.publish.maxSizePhoto.replace('{name}', file.name))
        continue
      }

      try {
        const localUrl = URL.createObjectURL(file)
        const { cardBlob, fullBlob } = await processImageFile(file)

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

        if (fullErr) throw new Error(fullErr.message)

        const newPhoto: PhotoItem = {
          path_card: cardPath,
          path_full: fullPath,
          sort_order: updatedPhotos.length,
          localUrl
        }

        updatedPhotos.push(newPhoto)
        setPhotos([...updatedPhotos])
      } catch (err) {
        let message = err instanceof Error ? err.message : String(err)
        if (message === 'image_decode_failed') {
          message = strings.publish.invalidImage
        }
        setUploadError(`${strings.publish.uploadError}${message}`)
        break
      }
    }

    setIsProcessing(false)
    setCurrentFileIndex(null)
    setTotalFiles(0)
  }

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setVideoLoading(true)

    if (file.size > 25 * 1024 * 1024) {
      setUploadError(strings.publish.videoSizeLimit)
      setVideoLoading(false)
      return
    }

    try {
      const tempVideo = document.createElement('video')
      tempVideo.preload = 'metadata'
      tempVideo.src = URL.createObjectURL(file)

      const duration = await new Promise<number>((resolve) => {
        tempVideo.onloadedmetadata = () => {
          URL.revokeObjectURL(tempVideo.src)
          resolve(tempVideo.duration)
        }
      })

      if (duration > 15) {
        setUploadError(strings.publish.videoDurationLimit)
        setVideoLoading(false)
        return
      }

      const videoPath = `${catId}/${crypto.randomUUID()}-video.${file.name.split('.').pop() || 'mp4'}`

      const { error: uploadErr } = await supabase.storage
        .from('cat-photos')
        .upload(videoPath, file, { contentType: file.type })

      if (uploadErr) throw new Error(uploadErr.message)

      setVideoPath(videoPath)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setUploadError(`${strings.publish.videoUploadError}${message}`)
    } finally {
      setVideoLoading(false)
    }
  }

  const handleRemovePhoto = async (index: number, pathCard: string, pathFull: string) => {
    if (isProcessing) return
    setUploadError(null)
    try {
      await supabase.storage.from('cat-photos').remove([pathCard, pathFull])
      const nextPhotos = photos.filter((_, i) => i !== index).map((p, idx) => ({ ...p, sort_order: idx }))
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
      await supabase.storage.from('cat-photos').remove([videoPath])
      setVideoPath(null)
    } catch {
      setUploadError(strings.publish.videoDeleteError)
    } finally {
      setVideoLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-display font-extrabold text-ink">
        {strings.publish.wizardStep.replace('{step}', '4').replace('{total}', '4')} — {strings.publish.wizardStep4Title}
      </h3>

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
        supabaseUrl={supabaseUrl}
      />

      {/* Video Upload Area */}
      <div className="space-y-3 border-t border-border/40 pt-4">
        <span className="block text-sm font-bold text-ink">{strings.publish.video}</span>
        
        {videoLoading ? (
          <div className="bg-surface border border-border rounded-input p-6 text-center space-y-2">
            <RefreshCw className="w-6 h-6 text-warning animate-spin mx-auto" />
            <p className="text-sm font-bold text-ink">{strings.publish.videoUploading}</p>
          </div>
        ) : videoPath ? (
          <div className="relative border border-border rounded-input p-3 bg-surface flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-pine" />
              <span className="text-sm font-semibold text-ink">{strings.publish.videoSuccess}</span>
            </div>
            <button
              type="button"
              onClick={handleRemoveVideo}
              className="text-danger hover:underline text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
              {strings.common.delete}
            </button>
          </div>
        ) : (
          <label className="border-2 border-dashed border-border hover:border-pine rounded-input p-6 flex flex-col items-center justify-center cursor-pointer bg-surface/50 hover:bg-surface transition-all">
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleVideoChange}
              className="hidden"
            />
            <UploadCloud className="w-8 h-8 text-ink-soft" />
            <span className="text-sm font-bold text-ink mt-2">{strings.publish.videoUploadBtn}</span>
            <span className="text-xs text-ink-soft font-semibold mt-1">
              {strings.publish.videoCoaching}
            </span>
          </label>
        )}
      </div>
    </div>
  )
}
