'use client'

import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { strings } from '@/lib/strings'
import { CatInput } from '@/lib/schemas/cat'
import { SegmentedField } from '@/components/ui/Segmented'

interface UploadStep1Props {
  register: UseFormRegister<CatInput>
  errors: FieldErrors<CatInput>
}

export function UploadStep1({ register, errors }: UploadStep1Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-display font-extrabold text-ink mb-4">
        {strings.publish.wizardStep1Title}
      </h3>

      {/* Name */}
      <div>
        <label className="block text-sm font-bold text-ink mb-1.5" htmlFor="name">
          {strings.publish.catName}
        </label>
        <input
          {...register('name')}
          id="name"
          className="w-full bg-surface border border-border rounded-input px-4 py-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
        />
        {errors.name && (
          <p className="text-xs text-danger font-semibold mt-1" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Sex */}
      <fieldset>
        <legend className="block text-sm font-bold text-ink mb-1.5">
          {strings.publish.catSex}
        </legend>
        <SegmentedField
          registration={register('sex')}
          options={[
            { value: 'male', label: strings.catalog.genderMale },
            { value: 'female', label: strings.catalog.genderFemale },
            { value: 'unknown', label: strings.catalog.genderUnknown }
          ]}
        />
        {errors.sex && (
          <p className="text-xs text-danger font-semibold mt-1" role="alert">
            {errors.sex.message}
          </p>
        )}
      </fieldset>

      {/* Age */}
      <div>
        <span className="block text-sm font-bold text-ink mb-1.5">{strings.publish.catAgeLabel}</span>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="sr-only" htmlFor="ageYears">{strings.publish.catAgeYears}</label>
            <input
              type="number"
              placeholder={strings.publish.catAgeYears}
              {...register('ageYears', { valueAsNumber: true })}
              id="ageYears"
              min="0"
              max="25"
              className="w-full bg-surface border border-border rounded-input px-4 py-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
            />
            <span className="text-xs text-ink-soft font-semibold block mt-1">{strings.publish.catAgeYears}</span>
            {errors.ageYears && (
              <p className="text-xs text-danger font-semibold mt-1" role="alert">
                {errors.ageYears.message}
              </p>
            )}
          </div>
          <div>
            <label className="sr-only" htmlFor="ageMonths">{strings.publish.catAgeMonths}</label>
            <input
              type="number"
              placeholder={strings.publish.catAgeMonths}
              {...register('ageMonths', { valueAsNumber: true })}
              id="ageMonths"
              min="0"
              max="11"
              className="w-full bg-surface border border-border rounded-input px-4 py-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
            />
            <span className="text-xs text-ink-soft font-semibold block mt-1">{strings.publish.catAgeMonths}</span>
            {errors.ageMonths && (
              <p className="text-xs text-danger font-semibold mt-1" role="alert">
                {errors.ageMonths.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
