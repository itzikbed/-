'use client'

import React, { useState } from 'react'
import { promoteToAdminAction } from '@/app/admin/admin-actions'
import { strings } from '@/lib/strings'

export function AdminPromoteCard() {
  const [email, setEmail] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)
    if (!confirming) {
      setConfirming(true)
      return
    }
    setLoading(true)
    const res = await promoteToAdminAction(email)
    setLoading(false)
    setConfirming(false)
    if (res.ok) {
      setResult({ ok: true, text: strings.admin.promote.success.replace('{email}', email.trim()) })
      setEmail('')
    } else {
      setResult({ ok: false, text: res.formError || strings.common.errorOccurred })
    }
  }

  return (
    <div className="max-w-xl bg-surface border border-border rounded-card p-6 md:p-8 shadow-resting space-y-4">
      <h2 className="text-xl font-display font-bold text-ink">{strings.admin.promote.title}</h2>
      <p className="text-base text-ink-soft leading-relaxed">{strings.admin.promote.desc}</p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="promote-email" className="font-sans font-semibold text-sm text-ink-soft block">
            {strings.admin.promote.emailLabel}
          </label>
          <input
            id="promote-email"
            type="email"
            dir="ltr"
            required
            value={email}
            onChange={(e) => { setEmail(e.target.value); setConfirming(false) }}
            placeholder={strings.admin.promote.emailPlaceholder}
            className="w-full min-h-[48px] px-4 rounded-btn border border-border bg-paper text-ink text-base focus:outline-none focus:ring-2 focus:ring-pine"
          />
        </div>

        {confirming && (
          <p className="text-sm text-danger font-semibold leading-relaxed" role="alert">
            {strings.admin.promote.confirmNote}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || email.trim().length === 0}
            className={`inline-flex items-center justify-center font-sans font-bold rounded-btn min-h-[48px] px-6 text-base transition-all duration-150 active:scale-98 shadow-resting cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              confirming
                ? 'bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger'
                : 'bg-pine text-white hover:bg-pine/90 focus-visible:ring-pine'
            }`}
          >
            {loading
              ? strings.common.loading
              : confirming
                ? strings.admin.promote.confirmBtn
                : strings.admin.promote.submit}
          </button>
          {confirming && !loading && (
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="inline-flex items-center justify-center font-sans font-semibold rounded-btn min-h-[48px] px-6 text-base text-ink-soft hover:text-ink hover:bg-paper transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
            >
              {strings.admin.promote.cancel}
            </button>
          )}
        </div>
      </form>

      {result && (
        <p
          role="alert"
          className={`text-base font-semibold rounded-card p-4 ${
            result.ok ? 'bg-pine-soft text-pine' : 'bg-danger/10 text-danger'
          }`}
        >
          {result.text}
        </p>
      )}
    </div>
  )
}
