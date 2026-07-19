import type { DefaultValues } from 'react-hook-form'
import { CatInput } from '@/lib/schemas/cat'
import { strings } from '@/lib/strings'
import { PhotoItem, InitialCatInput } from './types'

/** Maps an existing cat row (edit mode) to wizard form default values. */
export function buildCatDefaultValues(initialCat?: InitialCatInput): DefaultValues<CatInput> {
  let defaultPhotos: PhotoItem[] = []
  let defaultAgeYears: number | undefined = undefined
  let defaultAgeMonths: number | undefined = undefined

  if (initialCat) {
    if (initialCat.cat_photos) {
      defaultPhotos = initialCat.cat_photos.map((p) => ({
        path_card: p.path_card,
        path_full: p.path_full,
        sort_order: p.sort_order
      }))
    }
    if (initialCat.birth_est && initialCat.birth_est !== '2099-01-01') {
      const birthDate = new Date(initialCat.birth_est)
      const today = new Date()
      const totalMonths =
        (today.getFullYear() - birthDate.getFullYear()) * 12 +
        (today.getMonth() - birthDate.getMonth())
      defaultAgeYears = Math.max(0, Math.floor(totalMonths / 12))
      defaultAgeMonths = Math.max(0, totalMonths % 12)
    }
  }

  return {
    name: initialCat?.name === strings.publish.draftNameSentinel ? '' : (initialCat?.name || ''),
    sex: initialCat?.sex || 'male',
    ageYears: defaultAgeYears,
    ageMonths: defaultAgeMonths,
    vaccinations: initialCat?.vaccinations ?? 0,
    neutered: initialCat?.neutered || false,
    health_notes: initialCat?.health_notes || '',
    is_special: initialCat?.is_special || false,
    special_needs: initialCat?.special_needs || '',
    good_with_cats: initialCat?.good_with_cats || false,
    good_with_dogs: initialCat?.good_with_dogs || false,
    fee_required: !!initialCat?.fee_amount,
    fee_amount: initialCat?.fee_amount || null,
    description:
      initialCat?.description === strings.publish.draftDescSentinel
        ? ''
        : (initialCat?.description || ''),
    region: (initialCat?.region || 'center') as CatInput['region'],
    city: initialCat?.city === strings.publish.draftCitySentinel ? '' : (initialCat?.city || ''),
    photos: defaultPhotos,
    video_path: initialCat?.video_path || null
  }
}
