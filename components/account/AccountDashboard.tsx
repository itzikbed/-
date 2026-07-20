'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { deleteAccountAction } from '@/app/account/actions'
import { strings } from '@/lib/strings'

interface AccountDashboardProps {
  user: {
    id: string
    email?: string
  }
  profile: {
    full_name: string | null
    phone: string | null
    role: string
  }
}

export function AccountDashboard({ user, profile }: AccountDashboardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleDeleteAccount = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await deleteAccountAction()
      if (res.ok) {
        setIsDialogOpen(false)
        router.push('/')
        router.refresh()
      } else {
        setError(res.error || strings.common.errorOccurred)
      }
    } catch {
      setError(strings.common.errorOccurred)
    } finally {
      setLoading(false)
    }
  }

  const roleText = profile.role === 'admin' 
    ? strings.account.adminRole 
    : strings.account.userRole

  return (
    <div className="space-y-8 select-none">
      {/* Profile Info Card */}
      <div className="bg-surface border border-border rounded-card p-6 md:p-8 shadow-resting text-start space-y-6">
        <h2 className="text-xl font-display font-extrabold text-ink border-b border-border/40 pb-3">
          {strings.account.profileHeader}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
          <div>
            <span className="block text-sm font-semibold text-ink-soft mb-1">{strings.account.fullName}</span>
            <span className="font-bold text-ink">{profile.full_name || '—'}</span>
          </div>
          <div>
            <span className="block text-sm font-semibold text-ink-soft mb-1">{strings.account.email}</span>
            <span className="font-bold text-ink ltr inline-block text-start">{user.email || '—'}</span>
          </div>
          <div>
            <span className="block text-sm font-semibold text-ink-soft mb-1">{strings.account.phone}</span>
            <span className="font-bold text-ink"><bdi>{profile.phone || '—'}</bdi></span>
          </div>
          <div>
            <span className="block text-sm font-semibold text-ink-soft mb-1">{strings.account.role}</span>
            <span className="font-bold text-pine">{roleText}</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-surface border border-danger/20 rounded-card p-6 md:p-8 shadow-resting text-start space-y-6">
        <div className="border-b border-danger/10 pb-3">
          <h2 className="text-xl font-display font-extrabold text-danger flex items-center gap-2">
            {strings.account.dangerZone}
          </h2>
        </div>

        <div className="space-y-4">
          <p className="text-base text-ink leading-relaxed font-medium">
            {strings.account.deleteWarning}
          </p>
          <ul className="list-disc list-inside text-sm text-ink-soft space-y-1 font-semibold ps-1">
            <li>{strings.account.bullet1}</li>
            <li>{strings.account.bullet2}</li>
            <li>{strings.account.bullet3}</li>
            <li>{strings.account.bullet4}</li>
          </ul>

          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger rounded-input p-3 text-sm font-semibold" role="alert">
              {error}
            </div>
          )}

          <div className="pt-2">
            <Button
              type="button"
              variant="danger"
              onClick={() => setIsDialogOpen(true)}
              className="font-bold"
            >
              {strings.account.deleteBtn}
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => !loading && setIsDialogOpen(false)}
        title={strings.account.confirmTitle}
        actions={
          <>
            <Button
              type="button"
              variant="draft"
              disabled={loading}
              onClick={() => setIsDialogOpen(false)}
              className="min-h-[40px] px-4 font-semibold"
            >
              {strings.common.cancel}
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={loading}
              onClick={handleDeleteAccount}
              className="min-h-[40px] px-4 font-bold"
            >
              {strings.account.confirmBtn}
            </Button>
          </>
        }
      >
        <p className="text-base text-ink font-semibold leading-relaxed mb-2">
          {strings.account.confirmPrompt}
        </p>
        <p className="text-sm text-ink-soft font-semibold leading-relaxed">
          {strings.account.confirmWarning}
        </p>
      </Dialog>
    </div>
  )
}
