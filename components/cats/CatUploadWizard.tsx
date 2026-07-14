'use client'

import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { catSchema, CatInput } from '@/lib/schemas/cat'
import { upsertCatAction } from '@/app/publish/cat-actions'
import { strings } from '@/lib/strings'
import { UploadStep1 } from './UploadStep1'
import { UploadStep2 } from './UploadStep2'
import { UploadStep3 } from './UploadStep3'
import { UploadStep4 } from './UploadStep4'
import { UploadSuccessState } from './UploadSuccessState'
import { WizardNavigation } from './WizardNavigation'

interface PhotoItem {
  id?: string
  path_card: string
  path_full: string
  sort_order: number
  localUrl?: string
}

interface InitialCatInput {
  id: string
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

interface CatUploadWizardProps {
  initialCat?: InitialCatInput
}

export function CatUploadWizard({ initialCat }: CatUploadWizardProps) {
  const [step, setStep] = useState(1)
  const [catId, setCatId] = useState<string | null>(initialCat?.id || null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [wizardError, setWizardError] = useState<string | null>(null)
  const [isFinished, setIsFinished] = useState(false)
  const [isDraftFinished, setIsDraftFinished] = useState(false)

  let defaultPhotos: PhotoItem[] = []
  let defaultAgeYears = 0
  let defaultAgeMonths = 0

  if (initialCat) {
    if (initialCat.cat_photos) {
      defaultPhotos = initialCat.cat_photos.map((p) => ({
        path_card: p.path_card,
        path_full: p.path_full,
        sort_order: p.sort_order
      }))
    }
    const birthDate = new Date(initialCat.birth_est)
    const today = new Date()
    const totalMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth())
    defaultAgeYears = Math.max(0, Math.floor(totalMonths / 12))
    defaultAgeMonths = Math.max(0, totalMonths % 12)
  }

  const {
    register,
    trigger,
    watch,
    control,
    setValue,
    getValues,
    formState: { errors }
  } = useForm<CatInput>({
    resolver: zodResolver(catSchema),
    defaultValues: {
      name: initialCat?.name || '',
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
      description: initialCat?.description || '',
      region: (initialCat?.region || 'center') as 'north' | 'south' | 'center' | 'jerusalem' | 'yosh',
      city: initialCat?.city || '',
      photos: defaultPhotos,
      video_path: initialCat?.video_path || null
    }
  })

  const photos = useWatch({ control, name: 'photos' }) || []
  const videoPath = useWatch({ control, name: 'video_path' })

  const handleNextStep = async () => {
    let fieldsToValidate: Array<keyof CatInput> = []
    if (step === 1) {
      fieldsToValidate = ['name', 'sex', 'ageYears', 'ageMonths']
    } else if (step === 2) {
      fieldsToValidate = ['vaccinations', 'neutered', 'health_notes', 'is_special', 'special_needs']
    } else if (step === 3) {
      fieldsToValidate = ['good_with_cats', 'good_with_dogs', 'fee_required', 'fee_amount', 'description', 'region', 'city']
    }

    const isValid = await trigger(fieldsToValidate)
    if (!isValid) return

    setWizardError(null)

    if (step === 2 && !getValues('is_special')) setValue('special_needs', '')
    if (step === 3 && !getValues('fee_required')) setValue('fee_amount', null)

    if (step === 3) {
      setIsSubmitting(true)
      const values = getValues()
      try {
        const res = await upsertCatAction(values, catId || undefined, true)
        if (res.ok) {
          setCatId(res.data.catId)
          setValue('photos', defaultPhotos)
          setStep(4)
        } else {
          setWizardError(res.formError || strings.common.errorOccurred)
        }
      } catch {
        setWizardError(strings.common.errorOccurred)
      } finally {
        setIsSubmitting(false)
      }
    } else {
      setStep(prev => prev + 1)
    }
  }

  const handleSaveDraft = async () => {
    if (!getValues('is_special')) setValue('special_needs', '')
    if (!getValues('fee_required')) setValue('fee_amount', null)

    setIsSubmitting(true)
    setWizardError(null)
    const values = getValues()
    try {
      const res = await upsertCatAction(values, catId || undefined, true)
      if (res.ok) {
        setCatId(res.data.catId)
        setIsDraftFinished(true)
      } else {
        setWizardError(res.formError || strings.common.errorOccurred)
      }
    } catch {
      setWizardError(strings.common.errorOccurred)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinalSubmit = async () => {
    const isValid = await trigger()
    if (!isValid) return

    setIsSubmitting(true)
    setWizardError(null)
    const values = getValues()
    try {
      const res = await upsertCatAction(values, catId || undefined, false)
      if (res.ok) {
        setIsFinished(true)
      } else {
        setWizardError(res.formError || strings.common.errorOccurred)
      }
    } catch {
      setWizardError(strings.common.errorOccurred)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isFinished || isDraftFinished) {
    return <UploadSuccessState isFinished={isFinished} />
  }

  return (
    <div className="bg-surface border border-border rounded-card p-6 md:p-8 shadow-resting space-y-6">
      {wizardError && (
        <div className="bg-danger/10 border border-danger/20 text-danger rounded-input p-3 text-sm font-semibold" role="alert">
          {wizardError}
        </div>
      )}

      {step === 1 && <UploadStep1 register={register} errors={errors} />}
      {step === 2 && <UploadStep2 register={register} errors={errors} watch={watch} />}
      {step === 3 && <UploadStep3 register={register} errors={errors} watch={watch} />}
      {step === 4 && catId && (
        <UploadStep4
          catId={catId}
          photos={photos}
          setPhotos={(newPhotos) => setValue('photos', newPhotos, { shouldValidate: true })}
          videoPath={videoPath || null}
          setVideoPath={(path) => setValue('video_path', path || null)}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
        />
      )}

      <WizardNavigation
        step={step}
        isProcessing={isProcessing}
        isSubmitting={isSubmitting}
        onPrev={() => setStep(prev => prev - 1)}
        onSaveDraft={handleSaveDraft}
        onNext={handleNextStep}
        onFinalSubmit={handleFinalSubmit}
      />
    </div>
  )
}
