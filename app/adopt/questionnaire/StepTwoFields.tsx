import React from 'react'
import { UseFormRegister, FieldErrors, Control, Controller } from 'react-hook-form'
import { QuestionnaireInput } from '@/lib/schemas/questionnaire'
import { Select } from '@/components/ui/Select'
import { BooleanSegmented } from '@/components/ui/Segmented'
import { FLOOR_TYPES } from '@/lib/constants'
import { strings } from '@/lib/strings'

interface StepTwoFieldsProps {
  register: UseFormRegister<QuestionnaireInput>
  errors: FieldErrors<QuestionnaireInput>
  control: Control<QuestionnaireInput>
  watchHasOtherPets: boolean
}

export default function StepTwoFields({ register, errors, control, watchHasOtherPets }: StepTwoFieldsProps) {
  const floorOptions = [
    { value: '', label: strings.questionnaire.selectFloor },
    ...FLOOR_TYPES.map(f => ({ value: f.id, label: f.label }))
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Has Other Pets (Boolean Radio) */}
      <div className="flex flex-col gap-2 text-start">
        <span className="font-sans font-semibold text-sm text-ink-soft select-none block">
          {strings.questionnaire.labels.hasOtherPets} {strings.questionnaire.requiredSuffix}
        </span>
        <Controller
          name="has_other_pets"
          control={control}
          render={({ field }) => (
            <div className="mt-1">
              <BooleanSegmented
                name="has_other_pets"
                value={field.value}
                onChange={field.onChange}
                yesLabel={strings.questionnaire.yes}
                noLabel={strings.questionnaire.no}
              />
            </div>
          )}
        />
        {errors.has_other_pets?.message && (
          <span role="alert" className="font-sans text-sm text-danger mt-0.5">
            {errors.has_other_pets.message}
          </span>
        )}
        <p className="font-sans text-sm text-ink-soft mt-1">
          {strings.questionnaire.explanations.hasOtherPets}
        </p>
      </div>

      {/* Conditional Other Pets Description */}
      {watchHasOtherPets && (
        <div className="flex flex-col gap-1.5 text-start">
          <label className="font-sans font-semibold text-sm text-ink-soft select-none block mb-1.5">
            {strings.questionnaire.labels.otherPetsDesc} {strings.questionnaire.requiredSuffix}
          </label>
          <textarea
            className={'w-full bg-surface border rounded-input px-4 py-3 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 transition-all duration-150 min-h-[80px] ' +
              (errors.other_pets_desc ? 'border-danger' : 'border-border')}
            {...register('other_pets_desc')}
          />
          {errors.other_pets_desc?.message && (
            <span role="alert" className="font-sans text-sm text-danger block mt-0.5">
              {errors.other_pets_desc.message}
            </span>
          )}
          <p className="font-sans text-sm text-ink-soft mt-1">
            {strings.questionnaire.explanations.otherPetsDesc}
          </p>
        </div>
      )}

      {/* Has Cat Experience (Boolean Radio) */}
      <div className="flex flex-col gap-2 text-start">
        <span className="font-sans font-semibold text-sm text-ink-soft select-none block">
          {strings.questionnaire.labels.hasCatExperience} {strings.questionnaire.requiredSuffix}
        </span>
        <Controller
          name="has_cat_experience"
          control={control}
          render={({ field }) => (
            <div className="mt-1">
              <BooleanSegmented
                name="has_cat_experience"
                value={field.value}
                onChange={field.onChange}
                yesLabel={strings.questionnaire.yes}
                noLabel={strings.questionnaire.no}
              />
            </div>
          )}
        />
        {errors.has_cat_experience?.message && (
          <span role="alert" className="font-sans text-sm text-danger mt-0.5">
            {errors.has_cat_experience.message}
          </span>
        )}
        <p className="font-sans text-sm text-ink-soft mt-1">
          {strings.questionnaire.explanations.hasCatExperience}
        </p>
      </div>

      {/* Floor Type Select */}
      <div>
        <Select
          label={strings.questionnaire.labels.floorType + strings.questionnaire.requiredSuffix}
          error={errors.floor_type?.message}
          options={floorOptions}
          {...register('floor_type')}
        />
        <p className="font-sans text-sm text-ink-soft mt-1.5">
          {strings.questionnaire.explanations.floorType}
        </p>
      </div>

      {/* Has Window Screens (Boolean Radio) */}
      <div className="flex flex-col gap-2 text-start">
        <span className="font-sans font-semibold text-sm text-ink-soft select-none block">
          {strings.questionnaire.labels.hasWindowScreens} {strings.questionnaire.requiredSuffix}
        </span>
        <Controller
          name="has_window_screens"
          control={control}
          render={({ field }) => (
            <div className="mt-1">
              <BooleanSegmented
                name="has_window_screens"
                value={field.value}
                onChange={field.onChange}
                yesLabel={strings.questionnaire.yes}
                noLabel={strings.questionnaire.no}
              />
            </div>
          )}
        />
        {errors.has_window_screens?.message && (
          <span role="alert" className="font-sans text-sm text-danger mt-0.5">
            {errors.has_window_screens.message}
          </span>
        )}
        <p className="font-sans text-sm text-ink-soft mt-1">
          {strings.questionnaire.explanations.hasWindowScreens}
        </p>
      </div>
    </div>
  )
}