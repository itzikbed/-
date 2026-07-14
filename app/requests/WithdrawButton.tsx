'use client'

import React, { useState } from 'react'
import { withdrawAdoptionRequestAction } from './actions'
import { Button } from '@/components/ui/Button'
import { strings } from '@/lib/strings'

export const WithdrawButton = ({ requestId }: { requestId: string }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleWithdraw = async () => {
    if (!confirm(strings.requests.withdrawGeneralConfirm)) return
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await withdrawAdoptionRequestAction(requestId)
      if (!res.ok) {
        setError(res.formError || strings.requests.withdrawError)
      }
    } catch {
      setError(strings.common.errorOccurred)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='flex flex-col gap-1 items-end'>
      <Button
        variant='tertiary'
        className='text-danger hover:bg-danger/5 font-bold min-h-[40px] py-1 px-4 text-sm'
        loading={isSubmitting}
        disabled={isSubmitting}
        onClick={handleWithdraw}
      >
        {strings.requests.withdrawBtn}
      </Button>
      {error && <span className='text-xs text-danger font-semibold'>{error}</span>}
    </div>
  )
}