'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { adoptionRequestSchema, AdoptionRequestInput } from '@/lib/schemas/request'
import { submitAdoptionRequestAction } from '@/app/requests/actions'
import { Mascot } from '@/components/mascot/Mascot'
import { Button } from '@/components/ui/Button'
import { ChevronRight, Heart } from 'lucide-react'
import { strings } from '@/lib/strings'
import Link from 'next/link'

interface AdoptionRequestFormProps {
  catId: string
  catName: string
  region: string
  city: string
}

export const AdoptionRequestForm: React.FC<AdoptionRequestFormProps> = ({
  catId,
  catName,
  region,
  city
}) => {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<AdoptionRequestInput>({
    resolver: zodResolver(adoptionRequestSchema),
    defaultValues: {
      catId,
      message: ''
    }
  })

  const messageValue = watch('message') || ''

  const onSubmit = async (data: AdoptionRequestInput) => {
    setServerError(null)
    try {
      const res = await submitAdoptionRequestAction(data)
      if (res.ok) {
        setIsSuccess(true)
        setTimeout(() => {
          router.push('/cats/' + catId)
        }, 3500)
      } else {
        setServerError(res.formError || strings.requests.requestSubmitError)
      }
    } catch {
      setServerError(strings.requests.serverConnectionError)
    }
  }

  if (isSuccess) {
    return (
      <div className='bg-surface border border-border rounded-card p-8 md:p-10 shadow-resting text-center space-y-6'>
        <Mascot pose='celebrating' className='mx-auto animate-bounce' width={100} height={120} />
        <h2 className='text-2xl md:text-3xl font-display font-extrabold text-pine'>
          {strings.requests.requestSentTitle}
        </h2>
        <p className='text-ink-soft font-semibold max-w-sm mx-auto leading-relaxed'>
          {strings.requests.requestSentDesc.replace('{name}', catName)}
        </p>
        <div className='pt-4 flex flex-col gap-3'>
          <Link
            href={'/cats/' + catId}
            className='w-full inline-flex items-center justify-center font-sans font-bold rounded-btn min-h-[48px] px-6 text-base bg-marmalade text-ink hover:bg-marmalade-dp transition-all duration-150 shadow-resting hover:-translate-y-0.5'
          >
            {strings.requests.backToCatPage}
          </Link>
          <Link
            href='/requests'
            className='w-full inline-flex items-center justify-center font-sans font-semibold rounded-btn min-h-[48px] px-6 text-base bg-transparent text-pine hover:bg-pine-soft transition-all duration-150'
          >
            {strings.requests.viewMyRequests}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <Link
        href={'/cats/' + catId}
        className='inline-flex items-center gap-1 text-sm font-bold text-pine hover:underline'
      >
        <ChevronRight className='w-4 h-4' />
        {strings.requests.backToCatOf.replace('{name}', catName)}
      </Link>

      <div className='bg-surface border border-border rounded-card p-6 md:p-8 shadow-resting space-y-6'>
        <div className='border-b border-border/60 pb-4'>
          <h1 className='text-2xl font-display font-extrabold text-ink flex items-center gap-2'>
            <Heart className='w-6 h-6 text-marmalade-dp fill-marmalade' />
            {strings.requests.requestFor.replace('{name}', catName)}
          </h1>
          <p className='text-sm font-semibold text-ink-soft mt-1'>
            {region} {city ? '(' + city + ')' : ''}
          </p>
        </div>

        {messageValue.length === 0 && (
          <div className='flex justify-center -mb-8 relative z-10 select-none pointer-events-none'>
            <Mascot pose='peek' width={110} height={70} />
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
          {serverError && (
            <div role='alert' className='p-4 bg-danger/10 text-danger text-sm font-semibold rounded-input'>
              {serverError}
            </div>
          )}

          <input type='hidden' {...register('catId')} />

          <div className='flex flex-col gap-2'>
            <label className='font-sans font-bold text-base text-ink flex items-center justify-between'>
              <span>{strings.requests.tellUsWhy.replace('{name}', catName)}</span>
              <span className='text-danger text-xs font-semibold select-none'>{strings.questionnaire.requiredSuffix}</span>
            </label>
            <p className='text-xs font-semibold text-ink-soft'>
              {strings.requests.explainWhyAdopt.replace('{name}', catName)}
            </p>
            <textarea
              {...register('message')}
              className={'w-full bg-surface border rounded-input px-4 py-3 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 transition-all duration-150 min-h-[140px] resize-y ' + (errors.message ? 'border-danger' : 'border-border')}
              placeholder={strings.requests.min10CharsPlaceholder}
            />
            {errors.message && (
              <span role='alert' className='font-sans text-sm text-danger mt-0.5'>
                {errors.message.message}
              </span>
            )}
          </div>

          <Button
            type='submit'
            className='w-full font-bold'
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {strings.requests.submitRequest}
          </Button>
        </form>
      </div>
    </div>
  )
}
