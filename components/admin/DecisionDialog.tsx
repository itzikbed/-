'use client'

import React, { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { strings } from '@/lib/strings'

interface DecisionDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  title: string
  label: string
  placeholder: string
  confirmLabel?: string
}

export default function DecisionDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  label,
  placeholder,
  confirmLabel
}: DecisionDialogProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = () => {
    if (!reason || reason.trim().length < 10) {
      setError(strings.admin.dialog.rejectReasonMin)
      return
    }
    setError('')
    onConfirm(reason)
    setReason('')
  }

  const handleClose = () => {
    setError('')
    setReason('')
    onClose()
  }

  const actions = (
    <div className="flex gap-2 justify-end w-full">
      <Button variant="tertiary" onClick={handleClose}>
        {strings.common.cancel}
      </Button>
      <Button variant="primary" onClick={handleConfirm} disabled={reason.trim().length < 10} className="bg-danger text-white hover:bg-danger/90">
        {confirmLabel || strings.common.save}
      </Button>
    </div>
  )

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title={title} actions={actions}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-ink mb-1 select-none">{label}</label>
          <textarea
            className="w-full min-h-[100px] bg-surface border border-border rounded-input p-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 text-start font-sans"
            placeholder={placeholder}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              if (e.target.value.trim().length >= 10) {
                setError('')
              }
            }}
          />
          {error && <p role="alert" className="text-danger text-xs mt-1 font-semibold">{error}</p>}
        </div>
      </div>
    </Dialog>
  )
}
