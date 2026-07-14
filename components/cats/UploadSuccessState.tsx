'use client'

import React from 'react'
import Link from 'next/link'
import { Mascot } from '@/components/mascot/Mascot'
import { strings } from '@/lib/strings'

interface UploadSuccessStateProps {
  isFinished: boolean
  myCatsUrl?: string
}

export function UploadSuccessState({ isFinished, myCatsUrl = '/publish/my-cats' }: UploadSuccessStateProps) {
  return (
    <div className="bg-surface border border-border rounded-card p-8 md:p-12 shadow-resting text-center space-y-6 animate-scaleIn">
      <Mascot pose="celebrating" width={140} height={140} />
      <h2 className="text-3xl font-display font-extrabold text-ink">
        {isFinished ? strings.publish.successNewTitle : strings.publish.draftSaved}
      </h2>
      <p className="text-base font-semibold text-ink-soft leading-relaxed max-w-sm mx-auto">
        {isFinished ? strings.publish.successNewDesc : strings.publish.draftSavedDesc}
      </p>
      <div className="pt-4">
        <Link
          href={myCatsUrl}
          className="inline-flex items-center justify-center font-bold px-6 py-3 bg-marmalade text-ink hover:bg-marmalade-dp rounded-btn shadow-resting transition-all active:scale-98 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
        >
          {strings.publish.myCats}
        </Link>
      </div>
    </div>
  )
}
