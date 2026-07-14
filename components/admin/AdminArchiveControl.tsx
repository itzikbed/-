'use client'

import React, { useState } from 'react'
import DecisionDialog from './DecisionDialog'
import { archiveCatAdminAction } from '@/app/admin/cat-actions'
import { strings } from '@/lib/strings'

interface AdminArchiveControlProps {
  catId: string
  catName: string
}

export function AdminArchiveControl({ catId, catName }: AdminArchiveControlProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleArchive = async (reason: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await archiveCatAdminAction(catId, reason)
      if (res.ok) {
        setSuccess(true)
        setIsOpen(false)
        window.location.reload()
      } else {
        setError(res.formError || strings.common.errorOccurred)
      }
    } catch {
      setError(strings.common.errorOccurred)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger rounded-input p-3 text-xs font-semibold" role="alert">
          {error}
        </div>
      )}
      
      {success ? (
        <div className="bg-pine-soft text-pine rounded-input p-3 text-sm font-semibold text-center">
          {strings.admin.archiveCatSuccess}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          disabled={loading}
          className="w-full inline-flex items-center justify-center font-sans font-bold rounded-btn min-h-[48px] px-6 text-base bg-danger/10 text-danger hover:bg-danger hover:text-white disabled:opacity-50 transition-all duration-150 active:scale-98 shadow-resting cursor-pointer focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
        >
          {loading ? strings.admin.cat.approving : strings.admin.archiveCatBtn}
        </button>
      )}

      <DecisionDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleArchive}
        title={strings.admin.archiveCatConfirmTitle}
        label={strings.admin.cat.dialogLabel}
        placeholder={strings.admin.cat.dialogPlaceholder}
        confirmLabel={strings.admin.archiveCatBtn}
      />
    </div>
  )
}
