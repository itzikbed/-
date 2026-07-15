const UUID_SOURCE =
  '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}'

const STORED_MEDIA_PATH = new RegExp(
  `^${UUID_SOURCE}/${UUID_SOURCE}-(?:card\\.webp|full\\.webp|video\\.(?:mp4|webm|mov))$`,
  'i'
)

const VIDEO_REFERENCE_PATH = new RegExp(
  `^${UUID_SOURCE}/${UUID_SOURCE}-video(?:\\.(?:mp4|webm|mov))?$`,
  'i'
)

const UUID = new RegExp(`^${UUID_SOURCE}$`, 'i')
const VIDEO_TYPES: Record<string, 'mp4' | 'webm' | 'mov'> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov'
}

export interface MediaPhotoReference {
  path_card: string
  path_full: string
  sort_order: number
}

export function getMediaUrl(path: string): string {
  return `/api/media?path=${encodeURIComponent(path)}`
}

export function isStoredMediaPath(path: string): boolean {
  return path.length <= 180 && STORED_MEDIA_PATH.test(path)
}

export function isUuid(value: string): boolean {
  return UUID.test(value)
}

export function isPhotoReferenceForCat(
  photo: MediaPhotoReference,
  catId: string
): boolean {
  const escapedCatId = catId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const cardPattern = new RegExp(`^${escapedCatId}/(${UUID_SOURCE})-card\\.webp$`, 'i')
  const fullPattern = new RegExp(`^${escapedCatId}/(${UUID_SOURCE})-full\\.webp$`, 'i')
  const cardMatch = cardPattern.exec(photo.path_card)
  const fullMatch = fullPattern.exec(photo.path_full)

  return Boolean(cardMatch && fullMatch && cardMatch[1].toLowerCase() === fullMatch[1].toLowerCase())
}

export function isVideoReferenceForCat(path: string, catId: string): boolean {
  return path.length <= 180 && path.toLowerCase().startsWith(`${catId.toLowerCase()}/`) && VIDEO_REFERENCE_PATH.test(path)
}

export function areMediaReferencesForCat(
  photos: MediaPhotoReference[],
  videoPath: string | null | undefined,
  catId: string
): boolean {
  if (!isUuid(catId) || photos.length > 6) return false

  const sortOrders = new Set(photos.map((photo) => photo.sort_order))
  const paths = new Set(photos.flatMap((photo) => [photo.path_card, photo.path_full]))
  const validSortOrders = photos.every((photo) =>
    Number.isInteger(photo.sort_order) && photo.sort_order >= 0 && photo.sort_order < photos.length
  )

  return validSortOrders
    && sortOrders.size === photos.length
    && paths.size === photos.length * 2
    && photos.every((photo) => isPhotoReferenceForCat(photo, catId))
    && (!videoPath || isVideoReferenceForCat(videoPath, catId))
}

export function getStoredVideoPaths(videoPath: string): string[] {
  if (/\.(?:mp4|webm|mov)$/i.test(videoPath)) return [videoPath]
  return [`${videoPath}.webm`, `${videoPath}.mp4`]
}

export function getAllowedVideoExtension(mimeType: string): 'mp4' | 'webm' | 'mov' | null {
  return VIDEO_TYPES[mimeType] || null
}
