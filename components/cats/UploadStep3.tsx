'use client'

import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form'
import { strings } from '@/lib/strings'
import { REGIONS } from '@/lib/constants'

interface UploadStep3Props {
  register: UseFormRegister<any>
  errors: FieldErrors<any>
  watch: UseFormWatch<any>
}

export function UploadStep3({ register, errors, watch }: UploadStep3Props) {
  const feeRequired = watch('fee_required')

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-display font-extrabold text-ink mb-4">
        {strings.publish.wizardStep.replace('{step}', '3').replace('{total}', '4')} — אופי והתאמה
      </h3>

      {/* Good with cats */}
      <div className="flex items-center gap-3 py-1">
        <input
          type="checkbox"
          {...register('good_with_cats')}
          id="good_with_cats"
          className="w-5 h-5 accent-pine rounded border-border focus:ring-2 focus:ring-pine focus:ring-offset-2"
        />
        <label className="text-sm font-bold text-ink cursor-pointer select-none" htmlFor="good_with_cats">
          {strings.publish.goodWithCats}
        </label>
      </div>

      {/* Good with dogs */}
      <div className="flex items-center gap-3 py-1">
        <input
          type="checkbox"
          {...register('good_with_dogs')}
          id="good_with_dogs"
          className="w-5 h-5 accent-pine rounded border-border focus:ring-2 focus:ring-pine focus:ring-offset-2"
        />
        <label className="text-sm font-bold text-ink cursor-pointer select-none" htmlFor="good_with_dogs">
          {strings.publish.goodWithDogs}
        </label>
      </div>

      {/* Fee Required */}
      <div className="flex items-center gap-3 py-2 border-t border-border/40 pt-4">
        <input
          type="checkbox"
          {...register('fee_required')}
          id="fee_required"
          className="w-5 h-5 accent-pine rounded border-border focus:ring-2 focus:ring-pine focus:ring-offset-2"
        />
        <label className="text-sm font-bold text-ink cursor-pointer select-none" htmlFor="fee_required">
          {strings.publish.feeRequired}
        </label>
      </div>

      {/* Fee Amount (Conditional) */}
      {feeRequired && (
        <div className="bg-marmalade-sf/40 border border-marmalade/20 rounded-input p-4 space-y-2 animate-fadeIn">
          <label className="block text-sm font-bold text-ink" htmlFor="fee_amount">
            {strings.publish.feeAmount}
          </label>
          <input
            type="number"
            {...register('fee_amount', { valueAsNumber: true })}
            id="fee_amount"
            min="1"
            className="w-full bg-surface border border-border rounded-input px-4 py-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
          />
          {errors.fee_amount && (
            <p className="text-xs text-danger font-semibold mt-1" role="alert">
              {errors.fee_amount.message as string}
            </p>
          )}
        </div>
      )}

      {/* Description */}
      <div className="border-t border-border/40 pt-4">
        <label className="block text-sm font-bold text-ink mb-1.5" htmlFor="description">
          {strings.publish.description}
        </label>
        <textarea
          {...register('description')}
          id="description"
          rows={4}
          className="w-full bg-surface border border-border rounded-input px-4 py-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
          placeholder="ספרו על האופי שלו, הרגלים, למה הוא מחפש בית..."
        />
        {errors.description && (
          <p className="text-xs text-danger font-semibold mt-1" role="alert">
            {errors.description.message as string}
          </p>
        )}
      </div>

      {/* Location */}
      <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-4">
        <div>
          <label className="block text-sm font-bold text-ink mb-1.5" htmlFor="region">
            {strings.publish.region}
          </label>
          <select
            {...register('region')}
            id="region"
            className="w-full bg-surface border border-border rounded-input px-4 py-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
          >
            {REGIONS.map((region) => (
              <option key={region.id} value={region.id}>
                {region.label}
              </option>
            ))}
          </select>
          {errors.region && (
            <p className="text-xs text-danger font-semibold mt-1" role="alert">
              {errors.region.message as string}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-ink mb-1.5" htmlFor="city">
            {strings.publish.city}
          </label>
          <input
            {...register('city')}
            id="city"
            className="w-full bg-surface border border-border rounded-input px-4 py-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
          />
          {errors.city && (
            <p className="text-xs text-danger font-semibold mt-1" role="alert">
              {errors.city.message as string}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
