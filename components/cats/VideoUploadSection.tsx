'use client'

import { Film, X, UploadCloud, RefreshCw } from 'lucide-react'
import { strings } from '@/lib/strings'

interface VideoUploadSectionProps {
  videoPath: string | null
  videoLoading: boolean
  onVideoChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  onRemoveVideo: () => Promise<void>
}

export function VideoUploadSection({
  videoPath,
  videoLoading,
  onVideoChange,
  onRemoveVideo
}: VideoUploadSectionProps) {
  return (
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
            onClick={onRemoveVideo}
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
            onChange={onVideoChange}
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
  )
}
