import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { areMediaReferencesForCat, type MediaPhotoReference } from './media'

const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const MAX_VIDEO_BYTES = 25 * 1024 * 1024
const ALLOWED_VIDEO_MIME = new Set(['video/mp4', 'video/webm', 'video/quicktime'])

// Full server-side media validation before persisting cat_photos/video_path:
// (1) path format + ownership (areMediaReferencesForCat), then
// (2) the referenced objects actually exist in storage with an allowed stored
//     type/size. Client checks in UploadStep4 can be bypassed, so both run on
//     the server. Uses list() metadata only (no byte download) to stay free-tier.
export async function validateCatMedia(
  supabase: SupabaseClient<Database>,
  photos: MediaPhotoReference[],
  videoPath: string | null | undefined,
  catId: string
): Promise<boolean> {
  if (!areMediaReferencesForCat(photos, videoPath, catId)) return false
  return verifyStoredMedia(supabase, catId, photos, videoPath)
}

async function verifyStoredMedia(
  supabase: SupabaseClient<Database>,
  catId: string,
  photos: { path_card: string; path_full: string }[],
  videoPath: string | null | undefined
): Promise<boolean> {
  if (photos.length === 0 && !videoPath) return true

  const { data: objects, error } = await supabase.storage
    .from('cat-photos')
    .list(catId, { limit: 100 })
  if (error || !objects) return false

  const meta = new Map<string, { size: number | null; mimetype: string | null }>()
  for (const obj of objects) {
    const m = obj.metadata as { size?: number; mimetype?: string } | null
    meta.set(obj.name, {
      size: typeof m?.size === 'number' ? m.size : null,
      mimetype: typeof m?.mimetype === 'string' ? m.mimetype.toLowerCase() : null
    })
  }

  const prefix = `${catId}/`
  const checkImage = (fullPath: string): boolean => {
    if (!fullPath.startsWith(prefix)) return false
    const info = meta.get(fullPath.slice(prefix.length))
    if (!info) return false // must exist in storage
    if (info.mimetype !== null && info.mimetype !== 'image/webp') return false
    if (info.size !== null && (info.size < 1 || info.size > MAX_IMAGE_BYTES)) return false
    return true
  }

  for (const p of photos) {
    if (!checkImage(p.path_card) || !checkImage(p.path_full)) return false
  }

  if (videoPath) {
    if (!videoPath.startsWith(prefix)) return false
    const info = meta.get(videoPath.slice(prefix.length))
    if (!info) return false
    if (info.mimetype !== null && !ALLOWED_VIDEO_MIME.has(info.mimetype)) return false
    if (info.size !== null && (info.size < 1 || info.size > MAX_VIDEO_BYTES)) return false
  }

  return true
}
