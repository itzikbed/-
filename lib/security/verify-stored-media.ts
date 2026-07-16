import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { areMediaReferencesForCat, type MediaPhotoReference } from './media'
import { getServiceRoleKey } from '@/lib/supabase/server'

const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const MAX_VIDEO_BYTES = 25 * 1024 * 1024
const ALLOWED_VIDEO_MIME = new Set(['video/mp4', 'video/webm', 'video/quicktime'])

// Full server-side media validation before persisting cat_photos/video_path:
// (1) path format + ownership (areMediaReferencesForCat), then
// (2) the referenced objects actually exist in storage with an allowed stored type/size.
// (3) magic byte ranged checks (first 32 bytes) to prevent extension spoofing.
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

  const meta = new Map<string, { size: number; mimetype: string }>()
  for (const obj of objects) {
    const m = obj.metadata as { size?: number; mimetype?: string } | null
    if (m && typeof m.size === 'number' && typeof m.mimetype === 'string') {
      meta.set(obj.name, {
        size: m.size,
        mimetype: m.mimetype.toLowerCase()
      })
    }
  }

  const prefix = `${catId}/`
  const checkImage = async (fullPath: string): Promise<boolean> => {
    if (!fullPath.startsWith(prefix)) return false
    const filename = fullPath.slice(prefix.length)
    const info = meta.get(filename)
    if (!info) return false // must exist in storage
    if (info.mimetype !== 'image/webp') return false
    if (info.size < 1 || info.size > MAX_IMAGE_BYTES) return false

    // Ranged signature validation
    return await verifyMagicBytes(fullPath, 'webp')
  }

  for (const p of photos) {
    if (!(await checkImage(p.path_card)) || !(await checkImage(p.path_full))) {
      return false
    }
  }

  if (videoPath) {
    if (!videoPath.startsWith(prefix)) return false
    const filename = videoPath.slice(prefix.length)
    const info = meta.get(filename)
    if (!info) return false
    if (!ALLOWED_VIDEO_MIME.has(info.mimetype)) return false
    if (info.size < 1 || info.size > MAX_VIDEO_BYTES) return false

    // Determine expected type for magic bytes
    let expectedType: 'mp4' | 'webm' | 'quicktime' = 'mp4'
    if (info.mimetype === 'video/webm') expectedType = 'webm'
    else if (info.mimetype === 'video/quicktime') expectedType = 'quicktime'

    return await verifyMagicBytes(videoPath, expectedType)
  }

  return true
}

async function verifyMagicBytes(
  path: string,
  expectedType: 'webp' | 'mp4' | 'webm' | 'quicktime'
): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = getServiceRoleKey()
    
    // Construct authenticated REST endpoint for Supabase Storage download
    const url = `${supabaseUrl}/storage/v1/object/authenticated/cat-photos/${path}`

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${key}`,
        'Range': 'bytes=0-31'
      }
    })

    if (!res.ok) {
      console.error(`[MAGIC BYTES] Fetch failed for ${path}:`, res.status, res.statusText)
      return false
    }

    const buffer = await res.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    if (bytes.length < 12) return false

    // WebP magic bytes: 'RIFF' (0-3) and 'WEBP' (8-11)
    if (expectedType === 'webp') {
      const isRiff = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
      const isWebp = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
      return isRiff && isWebp
    }

    // WebM magic bytes: EBML header (1A 45 DF A3)
    if (expectedType === 'webm') {
      return bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3
    }

    // MP4/QuickTime magic bytes: 'ftyp' at bytes 4-7
    if (expectedType === 'mp4' || expectedType === 'quicktime') {
      const isFtyp = bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70
      return isFtyp
    }

    return false
  } catch (err) {
    console.error(`[MAGIC BYTES EXCEPTION] failed for ${path}:`, err)
    return false
  }
}
