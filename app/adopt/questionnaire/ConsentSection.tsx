'use client'

import React from 'react'
import Link from 'next/link'
import { strings } from '@/lib/strings'
import { Checkbox } from '@/components/ui/Checkbox'

interface ConsentSectionProps {
  checked: boolean
  error: string | null
  disabled: boolean
  onChange: (checked: boolean) => void
}

export default function ConsentSection({ checked, error, disabled, onChange }: ConsentSectionProps) {
  return (
    <div className="space-y-3 pt-2 border-t border-border">
      <p className="text-xs text-ink-soft leading-relaxed">
        {strings.questionnaire.privacyNotice}
        <Link href="/privacy" target="_blank" className="text-pine font-semibold hover:underline">
          {strings.questionnaire.privacyNoticeLink}
        </Link>
        .
      </p>
      <Checkbox
        label={<span className="text-sm">{strings.questionnaire.consentLabel}</span>}
        checked={checked}
        disabled={disabled}
        error={error || undefined}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  )
}
