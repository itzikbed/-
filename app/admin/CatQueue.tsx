'use client'

import React, { useState, useTransition } from 'react'
import DecisionDialog from '@/components/admin/DecisionDialog'
import { approveCatAction, rejectCatAction } from './cat-actions'
import { strings } from '@/lib/strings'
import CatQueueItem, { Cat } from './CatQueueItem'

interface CatQueueProps {
  cats: Cat[]
}

export default function CatQueue({ cats }: CatQueueProps) {
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleApprove = (id: string) => {
    setErrorMsg(null)
    startTransition(async () => {
      const res = await approveCatAction(id)
      if (!res.ok) {
        setErrorMsg(res.formError || strings.admin.cat.approveError)
      }
    })
  }

  const handleRejectConfirm = (reason: string) => {
    if (!rejectingId) return
    setErrorMsg(null)
    const targetId = rejectingId
    setRejectingId(null)

    startTransition(async () => {
      const res = await rejectCatAction(targetId, reason)
      if (!res.ok) {
        setErrorMsg(res.formError || strings.admin.cat.rejectError)
      }
    })
  }

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div role="alert" className="p-3 bg-danger/10 text-danger rounded-input text-sm font-semibold text-start">
          {errorMsg}
        </div>
      )}

      {cats.length === 0 ? (
        <div className="bg-surface border border-border rounded-card p-8 text-center text-ink-soft font-semibold">
          {strings.admin.cat.empty}
        </div>
      ) : (
        <div className="divide-y divide-border/60 bg-surface rounded-card border border-border shadow-resting overflow-hidden">
          {cats.map((cat) => (
            <CatQueueItem
              key={cat.id}
              cat={cat}
              isPending={isPending}
              onApprove={handleApprove}
              onRejectTrigger={(id) => setRejectingId(id)}
            />
          ))}
        </div>
      )}

      <DecisionDialog
        isOpen={rejectingId !== null}
        onClose={() => setRejectingId(null)}
        onConfirm={handleRejectConfirm}
        title={strings.admin.cat.dialogTitle}
        label={strings.admin.cat.dialogLabel}
        placeholder={strings.admin.cat.dialogPlaceholder}
        confirmLabel={strings.admin.cat.rejectBtn}
      />
    </div>
  )
}
export type { Cat }
