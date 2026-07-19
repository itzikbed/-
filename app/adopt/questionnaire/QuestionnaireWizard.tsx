'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { questionnaireSchema, QuestionnaireInput } from '@/lib/schemas/questionnaire'
import { saveQuestionnaireStepAction } from '@/app/adopt/actions'
import { strings } from '@/lib/strings'
import StepOneFields from './StepOneFields'
import StepTwoFields from './StepTwoFields'
import StepThreeFields from './StepThreeFields'
import SuccessState from './SuccessState'
import ConsentSection from './ConsentSection'
import { Button } from '@/components/ui/Button'
import { WizardSteps } from '@/components/ui/WizardSteps'
import { SavedNote } from '@/components/ui/SavedNote'

interface WizardProps {
  defaultValues: Partial<QuestionnaireInput>
  isCompletedInitially: boolean
}

const STEP_FIELDS: Record<number, (keyof QuestionnaireInput)[]> = {
  1: ['age', 'city', 'household_desc'],
  2: ['has_other_pets', 'other_pets_desc', 'has_cat_experience', 'floor_type', 'has_window_screens'],
  3: ['adoption_reason', 'surrender_circumstances', 'vet_clinic'],
}

export default function QuestionnaireWizard({ defaultValues, isCompletedInitially }: WizardProps) {
  const [step, setStep] = useState(1)
  const [isSuccess, setIsSuccess] = useState(isCompletedInitially)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [consentChecked, setConsentChecked] = useState(isCompletedInitially)
  const [consentError, setConsentError] = useState<string | null>(null)
  // Honest indicator: answers are persisted on every successful step save
  const [answersSaved, setAnswersSaved] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const {
    register,
    handleSubmit,
    trigger,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<QuestionnaireInput>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues,
    mode: 'onTouched',
  })

  const watchHasOtherPets = useWatch({ control, name: 'has_other_pets' })

  // Clear conditional pets description when has_other_pets is false
  useEffect(() => {
    if (!watchHasOtherPets) {
      setValue('other_pets_desc', null)
    }
  }, [watchHasOtherPets, setValue])

  // Move focus to step heading for screen readers on step change
  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.focus()
    }
  }, [step, isSuccess])

  if (isSuccess) {
    return (
      <div className="bg-surface rounded-card p-6 md:p-10 shadow-resting border border-border">
        <div className="flex justify-end mb-4">
          <Button
            variant="tertiary"
            onClick={() => {
              setIsSuccess(false)
              setStep(1)
            }}
          >
            {strings.questionnaire.editQuestionnaire}
          </Button>
        </div>
        <SuccessState />
      </div>
    )
  }

  const handleNext = async () => {
    setServerError(null)
    const fieldsToValidate = STEP_FIELDS[step]
    const isValid = await trigger(fieldsToValidate)

    if (!isValid) {
      // Focus first error field automatically handled by react-hook-form
      return
    }

    setIsSaving(true)
    try {
      const values = getValues()
      const res = await saveQuestionnaireStepAction(values, false)
      if (!res.ok) {
        setServerError(res.formError || strings.questionnaire.saveError)
        return
      }
      setAnswersSaved(true)
      setStep(step + 1)
    } catch {
      setServerError(strings.questionnaire.networkError)
    } finally {
      setIsSaving(false)
    }
  }

  const handleBack = () => {
    setServerError(null)
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const onSubmit = async (data: QuestionnaireInput) => {
    if (!consentChecked) {
      setConsentError(strings.questionnaire.consentError)
      return
    }
    setServerError(null)
    setIsSaving(true)
    try {
      const res = await saveQuestionnaireStepAction(data, true)
      if (!res.ok) {
        setServerError(res.formError || strings.questionnaire.finalSaveError)
        return
      }
      setIsSuccess(true)
    } catch {
      setServerError(strings.questionnaire.networkError)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-surface rounded-card p-6 md:p-10 shadow-resting border border-border max-w-2xl mx-auto">
      {/* Step Indicator Header */}
      <div className="mb-8">
        <WizardSteps
          steps={strings.questionnaire.stepNames}
          current={step}
          counterLabel={strings.common.stepOf
            .replace('{step}', String(step))
            .replace('{total}', String(strings.questionnaire.stepNames.length))}
        />
      </div>

      {/* Form Title & Description */}
      <div className="mb-6 text-center">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-display font-bold text-2xl text-pine focus-visible:outline-none mb-2"
        >
          {strings.questionnaire.title}
        </h2>
        <p className="font-sans text-sm text-ink-soft">
          {strings.questionnaire.subtitle}
        </p>
      </div>

      {/* Server Error Alert */}
      {serverError && (
        <div role="alert" className="mb-6 p-4 rounded-input bg-danger/10 border border-danger text-danger font-sans text-sm">
          {serverError}
        </div>
      )}

      {/* Step Contents */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {step === 1 && <StepOneFields register={register} errors={errors} />}
        {step === 2 && (
          <StepTwoFields
            register={register}
            errors={errors}
            control={control}
            watchHasOtherPets={watchHasOtherPets}
          />
        )}
        {step === 3 && <StepThreeFields register={register} errors={errors} />}

        {step === 3 && (
          <ConsentSection
            checked={consentChecked}
            error={consentError}
            disabled={isSaving}
            onChange={(checked) => {
              setConsentChecked(checked)
              if (checked) setConsentError(null)
            }}
          />
        )}

        {answersSaved && !isSaving && <SavedNote label={strings.questionnaire.autoSavedNow} />}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center gap-4 pt-4 border-t border-border">
          <div>
            {step > 1 && (
              <Button
                type="button"
                variant="tertiary"
                onClick={handleBack}
                disabled={isSaving}
              >
                {strings.questionnaire.back}
              </Button>
            )}
          </div>
          
          <div>
            {step < 3 ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleNext}
                loading={isSaving}
              >
                {strings.questionnaire.next}
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                loading={isSaving}
              >
                {strings.questionnaire.submit}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}