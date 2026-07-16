'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mascot } from '@/components/mascot/Mascot'
import { strings } from '@/lib/strings'
import { deleteCatAction, markAsAdoptedAction, archiveCatAction } from '@/app/publish/cat-status-actions'
import { MyCatCard, Cat } from './MyCatCard'

interface MyCatsListProps {
  initialCats: Cat[]
}

export function MyCatsList({ initialCats }: MyCatsListProps) {
  const [cats, setCats] = useState<Cat[]>(initialCats)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleMarkAdopted = async (catId: string) => {
    if (!confirm(strings.publish.markAdoptedConfirm)) return
    setError(null)
    setLoadingId(catId)
    try {
      const res = await markAsAdoptedAction(catId)
      if (res.ok) {
        setCats(prev =>
          prev.map(c =>
            c.id === catId
              ? { ...c, status: 'adopted' }
              : c
          )
        )
      } else {
        setError(res.formError || strings.common.errorOccurred)
      }
    } catch {
      setError(strings.common.errorOccurred)
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (catId: string, name: string) => {
    const confirmMsg = strings.publish.deleteConfirm.replace('{name}', name)
    if (!confirm(confirmMsg)) return
    setError(null)
    setLoadingId(catId)
    try {
      const res = await deleteCatAction(catId)
      if (res.ok) {
        setCats(prev => prev.filter(c => c.id !== catId))
      } else {
        setError(res.formError || strings.common.errorOccurred)
      }
    } catch {
      setError(strings.common.errorOccurred)
    } finally {
      setLoadingId(null)
    }
  }

  const handleArchive = async (catId: string, name: string) => {
    const confirmMsg = strings.publish.archiveConfirm.replace('{name}', name) + '\n\n' + strings.publish.archiveConfirmDesc
    if (!confirm(confirmMsg)) return
    setError(null)
    setLoadingId(catId)
    try {
      const res = await archiveCatAction(catId)
      if (res.ok) {
        setCats(prev =>
          prev.map(c =>
            c.id === catId
              ? { ...c, status: 'archived' }
              : c
          )
        )
      } else {
        setError(res.formError || strings.common.errorOccurred)
      }
    } catch {
      setError(strings.common.errorOccurred)
    } finally {
      setLoadingId(null)
    }
  }

  if (cats.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-card p-12 text-center space-y-6">
        <Mascot pose="sleeping" width={140} height={100} animateOnScroll />
        <h3 className="text-xl font-display font-extrabold text-ink">
          {strings.publish.noCats}
        </h3>
        <p className="text-sm text-ink-soft max-w-sm mx-auto font-semibold">
          {strings.publish.myCatsDashboardDesc}
        </p>
        <div className="pt-2">
          <Link
            href="/publish/new"
            className="inline-flex items-center justify-center font-bold px-6 py-3 bg-marmalade text-ink hover:bg-marmalade-dp rounded-btn shadow-resting transition-all active:scale-98 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pine focus:ring-offset-2"
          >
            {strings.publish.addCatBtn}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger rounded-input p-4 text-sm font-semibold" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {cats.map((cat) => (
          <MyCatCard
            key={cat.id}
            cat={cat}
            loadingId={loadingId}
            handleMarkAdopted={handleMarkAdopted}
            handleDelete={handleDelete}
            handleArchive={handleArchive}
          />
        ))}
      </div>
    </div>
  )
}
