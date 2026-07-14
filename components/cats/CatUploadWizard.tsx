'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { catSchema, CatInput } from '@/lib/schemas/cat'
import { upsertCatAction } from '@/app/publish/actions'
import { strings } from '@/lib/strings'
import { Mascot } from '@/components/mascot/Mascot'
import { UploadStep1 } from './UploadStep1'
import { UploadStep2 } from './UploadStep2'
import { UploadStep3 } from './UploadStep3'
import { UploadStep4 } from './UploadStep4'
import Link from 'next/link'

interface CatUploadWizardProps {
  initialCat?: any // If editing
}

export function CatUploadWizard({ initialCat }: CatUploadWizardProps) {
  const [step, setStep] = useState(1)
  const [catId, setCatId] = useState<string | null>(initialCat?.id || null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [wizardError, setWizardError] = useState<string | null>(null)
  const [isFinished, setIsFinished] = useState(false)
  const [isDraftFinished, setIsDraftFinished] = useState(false)

  // Parse photos and initial age for editing
  let defaultPhotos: any[] = []
  let defaultAgeYears = 0
  let defaultAgeMonths = 0

  if (initialCat) {
    if (initialCat.cat_photos) {
      defaultPhotos = initialCat.cat_photos.map((p: any) => ({
        path_card: p.path_card,
        path_full: p.path_full,
        sort_order: p.sort_order
      }))
    }
    // Compute age back from birth_est
    const birthDate = new Date(initialCat.birth_est)
    const today = new Date()
    const totalMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth())
    defaultAgeYears = Math.max(0, Math.floor(totalMonths / 12))
    defaultAgeMonths = Math.max(0, totalMonths % 12)
  }

  const {
    register,
    handleSubmit,
    trigger,
    watch,
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
      region: initialCat?.region || 'center',
      city: initialCat?.city || '',
      photos: defaultPhotos,
      video_path: initialCat?.video_path || null
    }
  })

  const photos = watch('photos') || []
  const videoPath = watch('video_path')

  const handleNextStep = async () => {
    let fieldsToValidate: any[] = []
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

    // Clear conditional fields on transition
    if (step === 2 && !watch('is_special')) {
      setValue('special_needs', '')
    }
    if (step === 3 && !watch('fee_required')) {
      setValue('fee_amount', null)
    }

    if (step === 3) {
      // Before entering step 4, we MUST persist the cat in the database as a draft to satisfy RLS for storage uploads
      setIsSubmitting(true)
      const values = getValues()
      try {
        const res = await upsertCatAction(values, catId || undefined, true)
        if (res.ok && res.data) {
          setCatId(res.data.catId)
          setValue('photos', defaultPhotos) // ensure photos initialized
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
    // Clear conditional fields on save
    if (!watch('is_special')) setValue('special_needs', '')
    if (!watch('fee_required')) setValue('fee_amount', null)

    setIsSubmitting(true)
    setWizardError(null)
    const values = getValues()
    try {
      const res = await upsertCatAction(values, catId || undefined, true)
      if (res.ok && res.data) {
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
    return (
      <div className="bg-surface border border-border rounded-card p-8 md:p-12 shadow-resting text-center space-y-6 animate-scaleIn">
        <Mascot pose="celebrating" width={140} height={140} />
        <h2 className="text-3xl font-display font-extrabold text-ink">
          {isFinished ? strings.publish.successNewTitle : 'הטיוטה נשמרה!'}
        </h2>
        <p className="text-base font-semibold text-ink-soft leading-relaxed max-w-sm mx-auto">
          {isFinished ? strings.publish.successNewDesc : 'המודעה נשמרה כטיוטה וניתן להמשיך לערוך אותה מתי שתרצו.'}
        </p>
        <div className="pt-4">
          <Link
            href="/publish/my-cats"
            className="inline-flex items-center justify-center font-bold px-6 py-3 bg-marmalade text-ink hover:bg-marmalade-dp rounded-btn shadow-resting transition-all active:scale-98 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
          >
            {strings.publish.myCats}
          </Link>
        </div>
      </div>
    )
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
          videoPath={videoPath}
          setVideoPath={(path) => setValue('video_path', path)}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
        />
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-border/40 gap-3">
        {step > 1 ? (
          <button
            type="button"
            disabled={isProcessing || isSubmitting}
            onClick={() => setStep(prev => prev - 1)}
            className="px-5 py-3 border border-border text-ink hover:bg-marmalade-sf disabled:opacity-50 text-base font-bold rounded-btn transition-all focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
          >
            {strings.questionnaire.prevBtn}
          </button>
        ) : (
          <div />
        )}

        <div className="flex gap-2.5">
          <button
            type="button"
            disabled={isProcessing || isSubmitting}
            onClick={handleSaveDraft}
            className="px-5 py-3 border border-border text-pine hover:bg-pine-soft disabled:opacity-50 text-base font-bold rounded-btn transition-all focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
          >
            {strings.publish.saveDraft}
          </button>

          {step < 4 ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleNextStep}
              className="px-5 py-3 bg-marmalade text-ink hover:bg-marmalade-dp disabled:opacity-50 text-base font-bold rounded-btn shadow-resting transition-all active:scale-98 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
            >
              {isSubmitting ? strings.common.loading : strings.questionnaire.nextBtn}
            </button>
          ) : (
            <button
              type="button"
              disabled={isProcessing || isSubmitting}
              onClick={handleFinalSubmit}
              className="px-6 py-3 bg-marmalade text-ink hover:bg-marmalade-dp disabled:opacity-50 text-base font-bold rounded-btn shadow-resting transition-all active:scale-98 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
            >
              {isSubmitting ? strings.common.loading : strings.publish.submitPending}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
