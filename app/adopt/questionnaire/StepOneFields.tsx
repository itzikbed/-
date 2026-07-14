import React from 'react'
import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { QuestionnaireInput } from '@/lib/schemas/questionnaire'
import { Input } from '@/components/ui/Input'
import { strings } from '@/lib/strings'

interface StepOneFieldsProps {
  register: UseFormRegister<QuestionnaireInput>
  errors: FieldErrors<QuestionnaireInput>
}

export default function StepOneFields({ register, errors }: StepOneFieldsProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Input
          type="number"
          label={strings.questionnaire.labels.age + strings.questionnaire.requiredSuffix}
          error={errors.age?.message}
          {...register('age', { valueAsNumber: true })}
        />
        <p className="font-sans text-sm text-ink-soft mt-1.5">
          {strings.questionnaire.explanations.age}
        </p>
      </div>

      <div>
        <Input
          type="text"
          label={strings.questionnaire.labels.city + strings.questionnaire.requiredSuffix}
          error={errors.city?.message}
          {...register('city')}
        />
        <p className="font-sans text-sm text-ink-soft mt-1.5">
          {strings.questionnaire.explanations.city}
        </p>
      </div>

      <div>
        <label className="font-sans font-semibold text-sm text-ink-soft select-none block mb-1.5">
          {strings.questionnaire.labels.householdDesc} {strings.questionnaire.requiredSuffix}
        </label>
        <textarea
          className={'w-full bg-surface border rounded-input px-4 py-3 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 transition-all duration-150 min-h-[100px] ' +
            (errors.household_desc ? 'border-danger' : 'border-border')}
          {...register('household_desc')}
        />
        {errors.household_desc?.message && (
          <span role="alert" className="font-sans text-sm text-danger block mt-0.5">
            {errors.household_desc.message}
          </span>
        )}
        <p className="font-sans text-sm text-ink-soft mt-1.5">
          {strings.questionnaire.explanations.householdDesc}
        </p>
      </div>
    </div>
  )
}