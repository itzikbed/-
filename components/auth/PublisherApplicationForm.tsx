'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { publisherApplicationSchema, PublisherApplicationInput } from '@/lib/schemas/publisher'
import { applyAsPublisherAction } from '@/app/publish/publisher-actions'
import { strings } from '@/lib/strings'
import { REGIONS, PUBLISHER_TYPES } from '@/lib/constants'
import { Checkbox } from '@/components/ui/Checkbox'

interface PublisherApplicationFormProps {
  initialData: {
    fullName: string
    phone: string
  }
}

export function PublisherApplicationForm({ initialData }: PublisherApplicationFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PublisherApplicationInput>({
    resolver: zodResolver(publisherApplicationSchema),
    defaultValues: {
      fullName: initialData.fullName || '',
      phone: initialData.phone || '',
      age: undefined,
      publisherType: 'private',
      region: undefined,
      city: '',
      consent: false
    }
  })

  const onSubmit = async (data: PublisherApplicationInput) => {
    setError(null)
    setIsSubmitting(true)

    try {
      const res = await applyAsPublisherAction(data)
      if (!res.ok) {
        if (res.formError) {
          setError(res.formError)
        } else if (res.fieldErrors) {
          setError(strings.common.errorOccurred)
        }
      } else {
        window.location.reload()
      }
    } catch {
      setError(strings.common.errorOccurred)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <h2 className="text-2xl font-display font-extrabold text-ink mb-2">
        {strings.publish.applyTitle}
      </h2>
      <p className="text-sm font-semibold text-ink-soft leading-relaxed">
        {strings.publish.applyDesc}
      </p>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger rounded-input p-3 text-sm font-semibold" role="alert">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-bold text-ink mb-1.5" htmlFor="fullName">
            {strings.publish.fullName}
          </label>
          <input
            {...register('fullName')}
            id="fullName"
            className="w-full bg-surface border border-border rounded-input px-4 py-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
          />
          {errors.fullName && (
            <p className="text-xs text-danger font-semibold mt-1" role="alert">
              {errors.fullName.message}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-bold text-ink mb-1.5" htmlFor="phone">
            {strings.publish.phone}
          </label>
          <input
            {...register('phone')}
            id="phone"
            dir="ltr"
            className="w-full bg-surface border border-border rounded-input px-4 py-3 text-base text-ink text-start focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
            placeholder={strings.auth.phonePlaceholder}
          />
          {errors.phone && (
            <p className="text-xs text-danger font-semibold mt-1" role="alert">
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Age */}
        <div>
          <label className="block text-sm font-bold text-ink mb-1.5" htmlFor="age">
            {strings.publish.age}
          </label>
          <input
            type="number"
            {...register('age', { valueAsNumber: true })}
            id="age"
            className="w-full bg-surface border border-border rounded-input px-4 py-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
          />
          {errors.age && (
            <p className="text-xs text-danger font-semibold mt-1" role="alert">
              {errors.age.message}
            </p>
          )}
        </div>

        {/* Publisher Type */}
        <div>
          <label className="block text-sm font-bold text-ink mb-1.5" htmlFor="publisherType">
            {strings.publish.publisherType}
          </label>
          <select
            {...register('publisherType')}
            id="publisherType"
            className="w-full bg-surface border border-border rounded-input px-4 py-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
          >
            {PUBLISHER_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.publisherType && (
            <p className="text-xs text-danger font-semibold mt-1" role="alert">
              {errors.publisherType.message}
            </p>
          )}
        </div>

        {/* Region */}
        <div>
          <label className="block text-sm font-bold text-ink mb-1.5" htmlFor="region">
            {strings.publish.region}
          </label>
          <select
            {...register('region')}
            id="region"
            className="w-full bg-surface border border-border rounded-input px-4 py-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
          >
            <option value="">{strings.publish.applySelectRegion}</option>
            {REGIONS.map((region) => (
              <option key={region.id} value={region.id}>
                {region.label}
              </option>
            ))}
          </select>
          {errors.region && (
            <p className="text-xs text-danger font-semibold mt-1" role="alert">
              {errors.region.message}
            </p>
          )}
        </div>

        {/* City */}
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
              {errors.city.message}
            </p>
          )}
        </div>
      </div>

      <div className="pt-1">
        <Checkbox
          label={
            <span className="text-sm">
              {strings.auth.consentPrefix}
              <Link href="/terms" target="_blank" className="text-pine font-semibold hover:underline">
                {strings.auth.consentTerms}
              </Link>
              {strings.auth.consentAnd}
              <Link href="/privacy" target="_blank" className="text-pine font-semibold hover:underline">
                {strings.auth.consentPrivacy}
              </Link>
            </span>
          }
          error={errors.consent?.message}
          disabled={isSubmitting}
          {...register('consent')}
        />
        <p className="text-xs text-ink-soft leading-relaxed mt-2">
          {strings.auth.privacyNotice}
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full mt-6 bg-marmalade text-ink hover:bg-marmalade-dp disabled:opacity-50 font-bold px-5 py-3 rounded-btn shadow-resting transition-all active:scale-98 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
      >
        {isSubmitting ? strings.common.loading : strings.publish.applySubmit}
      </button>
    </form>
  )
}
