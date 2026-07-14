import React from 'react'
import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { QuestionnaireInput } from '@/lib/schemas/questionnaire'
import { Input } from '@/components/ui/Input'
import { strings } from '@/lib/strings'

interface StepThreeFieldsProps {
  register: UseFormRegister<QuestionnaireInput>
  errors: FieldErrors<QuestionnaireInput>
}

export default function StepThreeFields({ register, errors }: StepThreeFieldsProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Adoption Reason */}
      <div>
        <label className="font-sans font-semibold text-sm text-ink-soft select-none block mb-1.5">
          {strings.questionnaire.labels.adoptionReason} {strings.questionnaire.requiredSuffix}
        </label>
        <textarea
          className={'w-full bg-surface border rounded-input px-4 py-3 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 transition-all duration-150 min-h-[100px] ' +
            (errors.adoption_reason ? 'border-danger' : 'border-border')}
          {...register('adoption_reason')}
        />
        {errors.adoption_reason?.message && (
          <span role="alert" className="font-sans text-sm text-danger block mt-0.5">
            {errors.adoption_reason.message}
          </span>
        )}
        <p className="font-sans text-sm text-ink-soft mt-1.5">
          {strings.questionnaire.explanations.adoptionReason}
        </p>
      </div>

      {/* Surrender Circumstances */}
      <div>
        <label className="font-sans font-semibold text-sm text-ink-soft select-none block mb-1.5">
          {strings.questionnaire.labels.surrenderCircumstances} {strings.questionnaire.requiredSuffix}
        </label>
        <textarea
          className={'w-full bg-surface border rounded-input px-4 py-3 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 transition-all duration-150 min-h-[100px] ' +
            (errors.surrender_circumstances ? 'border-danger' : 'border-border')}
          {...register('surrender_circumstances')}
        />
        {errors.surrender_circumstances?.message && (
          <span role="alert" className="font-sans text-sm text-danger block mt-0.5">
            {errors.surrender_circumstances.message}
          </span>
        )}
        <p className="font-sans text-sm text-ink-soft mt-1.5">
          {strings.questionnaire.explanations.surrenderCircumstances}
        </p>
      </div>

      {/* Vet Clinic (Optional) */}
      <div>
        <Input
          type="text"
          label={strings.questionnaire.labels.vetClinic}
          error={errors.vet_clinic?.message}
          {...register('vet_clinic')}
        />
        <p className="font-sans text-sm text-ink-soft mt-1.5">
          {strings.questionnaire.explanations.vetClinic}
        </p>
      </div>
    </div>
  )
}