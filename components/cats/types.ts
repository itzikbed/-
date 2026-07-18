export interface PhotoItem {
  id?: string
  path_card: string
  path_full: string
  sort_order: number
  localUrl?: string
}

export interface InitialCatInput {
  id: string
  status: string
  name: string
  sex: 'male' | 'female' | 'unknown'
  birth_est: string
  vaccinations: number
  neutered: boolean
  health_notes: string | null
  is_special: boolean
  special_needs: string | null
  good_with_cats: boolean | null
  good_with_dogs: boolean | null
  fee_amount: number | null
  description: string
  region: string
  city: string | null
  cat_photos?: Array<{
    path_card: string
    path_full: string
    sort_order: number
  }>
  video_path?: string | null
}
