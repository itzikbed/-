'use client'

import React, { useState } from 'react'
import { withdrawAdoptionRequestAction } from './actions'
import { Button } from '@/components/ui/Button'

export const WithdrawButton = ({ requestId }: { requestId: string }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleWithdraw = async () => {
    if (!confirm('האם אתה בטוח שברצונך למשוך את בקשת האימוץ?')) return
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await withdrawAdoptionRequestAction(requestId)
      if (!res.ok) {
        setError(res.formError || 'שגיאה בביטול הבקשה')
      }
    } catch {
      setError('אירעה שגיאה')
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
        משוך בקשה
      </Button>
      {error && <span className='text-xs text-danger font-semibold'>{error}</span>}
    </div>
  )
}