import { describe, expect, it } from 'vitest'
import {
  areMediaReferencesForCat,
  getMediaUrl,
  getStoredVideoPaths,
  isPhotoReferenceForCat,
  isStoredMediaPath,
  isVideoReferenceForCat
} from './media'

const catId = '11111111-1111-4111-8111-111111111111'
const mediaId = '22222222-2222-4222-8222-222222222222'

describe('media security helpers', () => {
  it('accepts only canonical stored media paths', () => {
    expect(isStoredMediaPath(`${catId}/${mediaId}-card.webp`)).toBe(true)
    expect(isStoredMediaPath(`${catId}/${mediaId}-video.mp4`)).toBe(true)
    expect(isStoredMediaPath(`${catId}/../../secret`)).toBe(false)
    expect(isStoredMediaPath(`${catId}/${mediaId}-image.svg`)).toBe(false)
  })

  it('requires matching card and full variants in the same cat folder', () => {
    expect(isPhotoReferenceForCat({
      path_card: `${catId}/${mediaId}-card.webp`,
      path_full: `${catId}/${mediaId}-full.webp`,
      sort_order: 0
    }, catId)).toBe(true)

    expect(isPhotoReferenceForCat({
      path_card: `${catId}/${mediaId}-card.webp`,
      path_full: `33333333-3333-4333-8333-333333333333/${mediaId}-full.webp`,
      sort_order: 0
    }, catId)).toBe(false)
  })

  it('supports a single video file or a transcoded video base name', () => {
    expect(isVideoReferenceForCat(`${catId}/${mediaId}-video.webm`, catId)).toBe(true)
    expect(isVideoReferenceForCat(`${catId}/${mediaId}-video`, catId)).toBe(true)
    expect(isVideoReferenceForCat(`${catId}/${mediaId}-video.svg`, catId)).toBe(false)
  })

  it('rejects duplicate or out-of-folder form references', () => {
    const photo = {
      path_card: `${catId}/${mediaId}-card.webp`,
      path_full: `${catId}/${mediaId}-full.webp`,
      sort_order: 0
    }
    expect(areMediaReferencesForCat([photo], null, catId)).toBe(true)
    expect(areMediaReferencesForCat([photo, photo], null, catId)).toBe(false)
  })

  it('expands transcoded video references for cleanup', () => {
    expect(getStoredVideoPaths(`${catId}/${mediaId}-video`)).toEqual([
      `${catId}/${mediaId}-video.webm`,
      `${catId}/${mediaId}-video.mp4`
    ])
  })

  it('encodes media paths before placing them in a URL', () => {
    expect(getMediaUrl(`${catId}/${mediaId}-card.webp`)).toContain('%2F')
  })
})
