'use client'

import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { catSchema, CatInput } from '@/lib/schemas/cat'
import { upsertCatAction } from '@/app/publish/cat-actions'
import { strings } from '@/lib/strings'
import { UnpublishConsentCard } from './UnpublishConsentCard'
import { UploadStep1 } from './UploadStep1'
import { UploadStep2 } from './UploadStep2'
import { UploadStep3 } from './UploadStep3'
import { UploadStep4 } from './UploadStep4'
import { UploadSuccessState } from './UploadSuccessState'
import { WizardNavigation } from './WizardNavigation'
import { WizardSteps } from '@/components/ui/WizardSteps'
import { SavedNote } from '@/components/ui/SavedNote'
import { buildCatDefaultValues } from './cat-wizard-defaults'
import { InitialCatInput } from './types'

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
  // Any save of a published listing flips it to pending (moderation rule, §11).
  // The flip is real and immediate, so it must be confirmed before the first
  // save — not discovered after the listing already left the catalog.
  const [pendingUnpublish, setPendingUnpublish] = useState<'next' | 'draft' | null>(null)
  const [unpublishConfirmed, setUnpublishConfirmed] = useState(false)
  // Honest save indicator: flips on only after a successful server upsert
  const [draftSaved, setDraftSaved] = useState(initialCat ? true : false)
  const needsUnpublishConsent = initialCat?.status === 'published' && !unpublishConfirmed

  const {
    register,
    trigger,
    watch,
    control,
    setValue,
    getValues,
    setError,
    formState: { errors }
  } = useForm<CatInput>({
    resolver: zodResolver(catSchema),
    defaultValues: buildCatDefaultValues(initialCat)
  })

  const photos = useWatch({ control, name: 'photos' }) || []
  const videoPath = useWatch({ control, name: 'video_path' })
  const catName = useWatch({ control, name: 'name' })

  const handleNextStep = async (skipUnpublishGate = false) => {
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

    if (step === 3 && needsUnpublishConsent && !skipUnpublishGate) {
      setPendingUnpublish('next')
      return
    }

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
          setDraftSaved(true)
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

  const handleSaveDraft = async (skipUnpublishGate = false) => {
    if (needsUnpublishConsent && !skipUnpublishGate) {
      setPendingUnpublish('draft')
      return
    }
    if (!getValues('is_special')) setValue('special_needs', '')
    if (!getValues('fee_required')) setValue('fee_amount', null)

    setIsSubmitting(true)
    setWizardError(null)
    const values = getValues()
    try {
      const res = await upsertCatAction(values, catId || undefined, true)
      if (res.ok) {
        setCatId(res.data.catId)
        setDraftSaved(true)
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
        if (res.fieldErrors) {
          Object.entries(res.fieldErrors).forEach(([field, messages]) => {
            setError(field as keyof CatInput, { message: messages?.[0] })
          })
        }
        setWizardError(res.formError || strings.publish.validationError)
      }
    } catch {
      setWizardError(strings.common.errorOccurred)
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmUnpublish = () => {
    const action = pendingUnpublish
    setUnpublishConfirmed(true)
    setPendingUnpublish(null)
    if (action === 'next') void handleNextStep(true)
    else if (action === 'draft') void handleSaveDraft(true)
  }

  if (isFinished || isDraftFinished) {
    return <UploadSuccessState isFinished={isFinished} />
  }

  return (
    <div className="bg-surface border border-border rounded-card p-6 md:p-8 shadow-resting space-y-6">
      <WizardSteps
        steps={strings.publish.stepNames}
        current={step}
        counterLabel={strings.common.stepOf
          .replace('{step}', String(step))
          .replace('{total}', String(strings.publish.stepNames.length))}
      />

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
          catName={catName}
          photos={photos}
          setPhotos={(newPhotos) => setValue('photos', newPhotos, { shouldValidate: true })}
          videoPath={videoPath || null}
          setVideoPath={(path) => setValue('video_path', path || null)}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
        />
      )}

      {pendingUnpublish && (
        <UnpublishConsentCard onConfirm={confirmUnpublish} onCancel={() => setPendingUnpublish(null)} />
      )}

      {draftSaved && !isSubmitting && <SavedNote label={strings.publish.draftSavedNow} />}

      <WizardNavigation
        step={step}
        isProcessing={isProcessing}
        isSubmitting={isSubmitting}
        onPrev={() => setStep(prev => prev - 1)}
        onSaveDraft={() => handleSaveDraft()}
        onNext={() => handleNextStep()}
        onFinalSubmit={handleFinalSubmit}
      />
    </div>
  )
}
