export interface AdopterProfile {
  age: number | null
  city: string | null
  household_desc: string | null
  has_other_pets: boolean | null
  other_pets_desc: string | null
  has_cat_experience: boolean | null
  vet_clinic: string | null
  adoption_reason: string | null
  surrender_circumstances: string | null
  floor_type: string | null
  has_window_screens: boolean | null
}

export interface Request {
  id: string
  cat_id: string
  adopter_id: string
  message: string
  status: string
  created_at: string
  cats: {
    id: string
    name: string
    sex: string
  } | null
  adopter?: {
    id: string
    full_name: string
    phone: string | null
    adopter_profiles: AdopterProfile | AdopterProfile[] | null
  } | null
}
