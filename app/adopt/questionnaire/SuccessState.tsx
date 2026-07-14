'use client'

import React from 'react'
import { CelebratingPose } from '@/components/mascot/CelebratingPose'
import { strings } from '@/lib/strings'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function SuccessState() {
  const searchParams = useSearchParams()
  const catId = searchParams.get('cat')

  return (
    <div className="flex flex-col items-center text-center max-w-md mx-auto py-8 px-4">
      {/* Celebrating Mascot */}
      <div className="mb-6 flex justify-center" aria-hidden="true">
        <CelebratingPose width={160} height={180} />
      </div>

      {/* Success Messages */}
      <h1 className="font-display font-extrabold text-3xl text-pine mb-4">
        {strings.questionnaire.successTitle}
      </h1>
      <p className="font-sans text-ink-soft text-base leading-relaxed mb-8">
        {strings.questionnaire.successSubtitle}
      </p>

      {/* Action CTAs */}
      <div className="flex flex-col gap-4 w-full">
        {catId ? (
          <>
            <Link
              href={`/cats/${catId}`}
              className="inline-flex items-center justify-center font-sans font-semibold rounded-btn transition-all duration-150 ease-out active:scale-98 min-h-[48px] px-6 text-base bg-marmalade text-ink hover:bg-marmalade-dp hover:-translate-y-0.5 shadow-resting hover:shadow-hover border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2"
            >
              {strings.questionnaire.ctaDetail}
            </Link>
            <Link
              href="/cats"
              className="inline-flex items-center justify-center font-sans font-semibold rounded-btn transition-all duration-150 ease-out active:scale-98 min-h-[48px] px-6 text-base bg-transparent text-pine hover:bg-pine-soft hover:-translate-y-0.5 border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2"
            >
              {strings.questionnaire.ctaCatalog}
            </Link>
          </>
        ) : (
          <Link
            href="/cats"
            className="inline-flex items-center justify-center font-sans font-semibold rounded-btn transition-all duration-150 ease-out active:scale-98 min-h-[48px] px-6 text-base bg-marmalade text-ink hover:bg-marmalade-dp hover:-translate-y-0.5 shadow-resting hover:shadow-hover border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2"
          >
            {strings.questionnaire.ctaCatalog}
          </Link>
        )}
      </div>
    </div>
  )
}
