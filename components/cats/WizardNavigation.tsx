'use client'

import React from 'react'
import { strings } from '@/lib/strings'

interface WizardNavigationProps {
  step: number
  isProcessing: boolean
  isSubmitting: boolean
  onPrev: () => void
  onSaveDraft: () => void
  onNext: () => void
  onFinalSubmit: () => void
}

export function WizardNavigation({
  step,
  isProcessing,
  isSubmitting,
  onPrev,
  onSaveDraft,
  onNext,
  onFinalSubmit
}: WizardNavigationProps) {
  return (
    <div className="flex justify-between items-center pt-6 border-t border-border/40 gap-3">
      {step > 1 ? (
        <button
          type="button"
          disabled={isProcessing || isSubmitting}
          onClick={onPrev}
          className="px-5 py-3 border border-border text-ink hover:bg-marmalade-sf disabled:opacity-50 text-base font-bold rounded-btn transition-all focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
        >
          {strings.questionnaire.back}
        </button>
      ) : (
        <div />
      )}

      <div className="flex gap-2.5">
        <button
          type="button"
          disabled={isProcessing || isSubmitting}
          onClick={onSaveDraft}
          className="px-5 py-3 border border-border text-pine hover:bg-pine-soft disabled:opacity-50 text-base font-bold rounded-btn transition-all focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
        >
          {strings.publish.saveDraft}
        </button>

        {step < 4 ? (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onNext}
            className="px-5 py-3 bg-marmalade text-ink hover:bg-marmalade-dp disabled:opacity-50 text-base font-bold rounded-btn shadow-resting transition-all active:scale-98 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
          >
            {isSubmitting ? strings.common.loading : strings.questionnaire.next}
          </button>
        ) : (
          <button
            type="button"
            disabled={isProcessing || isSubmitting}
            onClick={onFinalSubmit}
            className="px-6 py-3 bg-marmalade text-ink hover:bg-marmalade-dp disabled:opacity-50 text-base font-bold rounded-btn shadow-resting transition-all active:scale-98 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
          >
            {isSubmitting ? strings.common.loading : strings.publish.submitPending}
          </button>
        )}
      </div>
    </div>
  )
}
