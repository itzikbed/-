'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { processImageFile } from '@/lib/utils/image-processing'
import { strings } from '@/lib/strings'
import { Image as ImageIcon, Film, X, ArrowUp, ArrowDown, UploadCloud, RefreshCw } from 'lucide-react'
import Image from 'next/image'

interface PhotoItem {
  id?: string // local key for rendering
  path_card: string
  path_full: string
  sort_order: number
  localUrl?: string // preview
}

interface UploadStep4Props {
  catId: string
  photos: PhotoItem[]
  setPhotos: (photos: PhotoItem[]) => void
  videoPath: string | null
  setVideoPath: (path: string | null) => void
  isProcessing: boolean
  setIsProcessing: (loading: boolean) => void
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

  // Revoke local object URLs on unmount
  useEffect(() => {
    return () => {
      photos.forEach((p) => {
        if (p.localUrl && p.localUrl.startsWith('blob:')) {
          URL.revokeObjectURL(p.localUrl)
        }
      })
    }
  }, [photos])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadError(null)
    const newFiles = Array.from(files)

    // Validate max 6 photos total
    if (photos.length + newFiles.length > 6) {
      setUploadError('ניתן להעלות עד 6 תמונות לכל היותר.')
      return
    }

    setIsProcessing(true)
    setTotalFiles(newFiles.length)

    // Process files sequentially
    for (let i = 0; i < newFiles.length; i++) {
      setCurrentFileIndex(i + 1)
      const file = newFiles[i]

      // Check max size 12MB
      if (file.size > 12 * 1024 * 1024) {
        setUploadError(`הקובץ ${file.name} חורג מהגודל המרבי של 12MB.`);
        continue
      }

      try {
        const localUrl = URL.createObjectURL(file)
        const { cardBlob, fullBlob } = await processImageFile(file)

        const uuid = crypto.randomUUID()
        const cardPath = `${catId}/${uuid}-card.webp`
        const fullPath = `${catId}/${uuid}-full.webp`

        // Upload card variant
        const { error: cardErr } = await supabase.storage
          .from('cat-photos')
          .upload(cardPath, cardBlob, { contentType: 'image/webp' })

        if (cardErr) throw new Error('שגיאה בהעלאת תמונת כרטיס: ' + cardErr.message)

        // Upload full variant
        const { error: fullErr } = await supabase.storage
          .from('cat-photos')
          .upload(fullPath, fullBlob, { contentType: 'image/webp' })

        if (fullErr) throw new Error('שגיאה בהעלאת תמונה מלאה: ' + fullErr.message)

        const newPhoto: PhotoItem = {
          path_card: cardPath,
          path_full: fullPath,
          sort_order: photos.length + i,
          localUrl
        }

        setPhotos((prev) => [...prev, newPhoto])
      } catch (err: any) {
        setUploadError('אירעה שגיאה בעיבוד או העלאת התמונות: ' + err.message)
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

    // Check size limit: 25MB
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('סרטון לא יכול לעלות על 25MB.')
      setVideoLoading(false)
      return
    }

    try {
      // Check duration limit: 15s using temporary video player
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
        setUploadError('משך הסרטון המרבי הוא 15 שניות.')
        setVideoLoading(false)
        return
      }

      const uuid = crypto.randomUUID()
      const ext = file.name.split('.').pop() || 'mp4'
      const videoPath = `${catId}/${uuid}-video.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('cat-photos')
        .upload(videoPath, file, { contentType: file.type })

      if (uploadErr) throw new Error('העלאת סרטון נכשלה: ' + uploadErr.message)

      setVideoPath(videoPath)
    } catch (err: any) {
      setUploadError('שגיאה בהעלאת הסרטון: ' + err.message)
    } finally {
      setVideoLoading(false)
    }
  }

  const handleRemovePhoto = async (index: number, pathCard: string, pathFull: string) => {
    if (isProcessing) return
    setErrorClean()
    try {
      // Remove from storage
      await supabase.storage.from('cat-photos').remove([pathCard, pathFull])
      setPhotos((prev) => {
        const filtered = prev.filter((_, i) => i !== index)
        // Recalculate sort order
        return filtered.map((p, idx) => ({ ...p, sort_order: idx }))
      })
    } catch {
      setUploadError('שגיאה במחיקת התמונה מהשרת.')
    }
  }

  const handleRemoveVideo = async () => {
    if (!videoPath) return
    setErrorClean()
    setVideoLoading(true)
    try {
      await supabase.storage.from('cat-photos').remove([videoPath])
      setVideoPath(null)
    } catch {
      setUploadError('שגיאה במחיקת הסרטון מהשרת.')
    } finally {
      setVideoLoading(false)
    }
  }

  const movePhoto = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= photos.length) return

    const updated = [...photos]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp

    // Update sort orders
    const resort = updated.map((p, idx) => ({ ...p, sort_order: idx }))
    setPhotos(resort)
  }

  const setErrorClean = () => setUploadError(null)

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-display font-extrabold text-ink">
        {strings.publish.wizardStep.replace('{step}', '4').replace('{total}', '4')} — תמונות וסרטון
      </h3>

      {uploadError && (
        <div className="bg-danger/10 border border-danger/20 text-danger rounded-input p-3.5 text-sm font-semibold" role="alert">
          {uploadError}
        </div>
      )}

      {/* Sequential Image Processing Status */}
      {isProcessing && (
        <div className="bg-marmalade-sf/40 border border-marmalade/30 rounded-input p-4 text-center space-y-2">
          <RefreshCw className="w-6 h-6 text-warning animate-spin mx-auto" />
          <p className="text-sm font-bold text-ink">
            מעבד תמונה {currentFileIndex} מתוך {totalFiles}...
          </p>
          <span className="text-xs text-ink-soft block">מבצע כיווץ והסרת נתוני מיקום (GPS) לשמירה על פרטיות</span>
        </div>
      )}

      {/* Image Upload Area */}
      <div className="space-y-3">
        <span className="block text-sm font-bold text-ink">{strings.publish.photos}</span>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {/* Photos Cards */}
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
                  ראשי
                </span>
              )}
              {/* Overlay controls */}
              <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => movePhoto(idx, 'up')}
                    className="p-1 bg-surface rounded-full text-ink hover:text-pine cursor-pointer"
                  >
                    <ArrowRightIcon className="w-3.5 h-3.5 rotate-90" />
                  </button>
                )}
                {idx < photos.length - 1 && (
                  <button
                    type="button"
                    onClick={() => movePhoto(idx, 'down')}
                    className="p-1 bg-surface rounded-full text-ink hover:text-pine cursor-pointer"
                  >
                    <ArrowRightIcon className="w-3.5 h-3.5 -rotate-90" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(idx, p.path_card, p.path_full)}
                  className="p-1 bg-danger text-white rounded-full hover:bg-danger-dp cursor-pointer"
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
              <span className="text-[10px] font-semibold text-ink-soft mt-1">הוסף תמונה</span>
            </label>
          )}
        </div>
        <p className="text-xs text-ink-soft font-semibold mt-1">
          {strings.publish.photosCoaching}
        </p>
      </div>

      {/* Video Upload Area */}
      <div className="space-y-3 border-t border-border/40 pt-4">
        <span className="block text-sm font-bold text-ink">{strings.publish.video}</span>
        
        {videoLoading ? (
          <div className="bg-surface border border-border rounded-input p-6 text-center space-y-2">
            <RefreshCw className="w-6 h-6 text-warning animate-spin mx-auto" />
            <p className="text-sm font-bold text-ink">מעלה סרטון...</p>
          </div>
        ) : videoPath ? (
          <div className="relative border border-border rounded-input p-3 bg-surface flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-pine" />
              <span className="text-sm font-semibold text-ink">סרטון הועלה בהצלחה</span>
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
            <span className="text-sm font-bold text-ink mt-2">לחצו להעלאת סרטון קצר</span>
            <span className="text-xs text-ink-soft font-semibold mt-1">
              {strings.publish.videoCoaching}
            </span>
          </label>
        )}
      </div>
    </div>
  )
}

function ArrowRightIcon({ className, ...props }: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="m18 15-6-6-6 6" />
    </svg>
  )
}
