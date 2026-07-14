'use client'

import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form'
import { strings } from '@/lib/strings'

interface UploadStep2Props {
  register: UseFormRegister<any>
  errors: FieldErrors<any>
  watch: UseFormWatch<any>
}

export function UploadStep2({ register, errors, watch }: UploadStep2Props) {
  const isSpecial = watch('is_special')

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-display font-extrabold text-ink mb-4">
        {strings.publish.wizardStep.replace('{step}', '2').replace('{total}', '4')} — בריאות ורפואה
      </h3>

      {/* Vaccinations */}
      <div>
        <label className="block text-sm font-bold text-ink mb-1.5" htmlFor="vaccinations">
          {strings.publish.vaccinations}
        </label>
        <select
          {...register('vaccinations', { valueAsNumber: true })}
          id="vaccinations"
          className="w-full bg-surface border border-border rounded-input px-4 py-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
        >
          <option value="0">0 (לא חוסן)</option>
          <option value="1">1 (חיסון ראשון חלקי)</option>
          <option value="2">2 (חיסון שני)</option>
          <option value="3">3 (חיסון דחף מלא)</option>
        </select>
        {errors.vaccinations && (
          <p className="text-xs text-danger font-semibold mt-1" role="alert">
            {errors.vaccinations.message as string}
          </p>
        )}
      </div>

      {/* Neutered */}
      <div className="flex items-center gap-3 py-2">
        <input
          type="checkbox"
          {...register('neutered')}
          id="neutered"
          className="w-5 h-5 accent-pine rounded border-border focus:ring-2 focus:ring-pine focus:ring-offset-2"
        />
        <label className="text-sm font-bold text-ink cursor-pointer select-none" htmlFor="neutered">
          {strings.publish.neutered}
        </label>
      </div>

      {/* Health Notes */}
      <div>
        <label className="block text-sm font-bold text-ink mb-1.5" htmlFor="health_notes">
          {strings.publish.healthNotes}
        </label>
        <textarea
          {...register('health_notes')}
          id="health_notes"
          rows={3}
          className="w-full bg-surface border border-border rounded-input px-4 py-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
        />
        {errors.health_notes && (
          <p className="text-xs text-danger font-semibold mt-1" role="alert">
            {errors.health_notes.message as string}
          </p>
        )}
      </div>

      {/* Is Special */}
      <div className="flex items-center gap-3 py-2 border-t border-border/40 pt-4">
        <input
          type="checkbox"
          {...register('is_special')}
          id="is_special"
          className="w-5 h-5 accent-pine rounded border-border focus:ring-2 focus:ring-pine focus:ring-offset-2"
        />
        <label className="text-sm font-bold text-ink cursor-pointer select-none" htmlFor="is_special">
          {strings.publish.isSpecial}
        </label>
      </div>

      {/* Special Needs Description (Conditional) */}
      {isSpecial && (
        <div className="bg-marmalade-sf/40 border border-marmalade/20 rounded-input p-4 space-y-2 animate-fadeIn">
          <label className="block text-sm font-bold text-ink" htmlFor="special_needs">
            {strings.publish.specialNeeds}
          </label>
          <textarea
            {...register('special_needs')}
            id="special_needs"
            rows={3}
            className="w-full bg-surface border border-border rounded-input px-4 py-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
            placeholder="עיוורון, שלוש רגליים, מחלה כרונית וכו'..."
          />
          {errors.special_needs && (
            <p className="text-xs text-danger font-semibold mt-1" role="alert">
              {errors.special_needs.message as string}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
