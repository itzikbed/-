import React from 'react'
import { Check } from 'lucide-react'
import { PeekPose } from '@/components/mascot/PeekPose'

interface WizardStepsProps {
  /** Ordered step labels, index 0 = step 1 */
  steps: string[]
  /** Current step, 1-based */
  current: number
  /** Visible + accessible counter, e.g. "שלב 2 מתוך 4" */
  counterLabel: string
}

/**
 * Named step indicator for wizards (upload + questionnaire): labeled
 * circles on a progress track, the Peeking Cat marking the current step.
 * Named discrete steps over an anonymous bar — reduces form abandonment.
 */
export function WizardSteps({ steps, current, counterLabel }: WizardStepsProps) {
  return (
    <nav aria-label={counterLabel} className="select-none">
      <p className="text-center text-sm font-sans font-semibold text-ink-soft mb-7">
        {counterLabel}
      </p>
      <ol className="flex items-start w-full">
        {steps.map((label, i) => {
          const stepNo = i + 1
          const isDone = stepNo < current
          const isCurrent = stepNo === current
          return (
            <li
              key={label}
              aria-current={isCurrent ? 'step' : undefined}
              className="flex-1 flex flex-col items-center relative min-w-0"
            >
              {/* Track segment from this circle toward the next step */}
              {i < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className={`absolute top-4 start-1/2 w-full h-0.5 ${
                    isDone ? 'bg-pine' : 'bg-border'
                  }`}
                />
              )}

              <div className="relative z-10">
                {isCurrent && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-ink pointer-events-none">
                    <PeekPose width={36} height={24} />
                  </div>
                )}
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-display font-bold border-2 transition-colors ${
                    isDone
                      ? 'bg-pine border-pine text-white'
                      : isCurrent
                        ? 'bg-marmalade border-marmalade text-ink shadow-resting'
                        : 'bg-surface border-border text-ink-soft'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" aria-hidden="true" /> : stepNo}
                </span>
              </div>

              <span
                className={`mt-2 text-xs font-sans font-semibold text-center leading-tight px-1 ${
                  isCurrent ? 'text-ink' : isDone ? 'text-pine' : 'text-ink-soft'
                }`}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
