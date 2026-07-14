'use client'

import React, { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import DecisionDialog from '@/components/admin/DecisionDialog'
import { approvePublisherAction, rejectPublisherAction } from './publisher-actions'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { REGIONS, RegionId, PUBLISHER_TYPES, PublisherTypeId } from '@/lib/constants'
import { strings } from '@/lib/strings'

interface PublisherProfile {
  id: string
  full_name: string
  phone: string | null
  age: number | null
  region: string | null
  city: string | null
  publisher_type: string | null
  publisher_status: string
  created_at: string
}

interface PublisherQueueProps {
  publishers: PublisherProfile[]
}

export default function PublisherQueue({ publishers }: PublisherQueueProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleApprove = (id: string) => {
    setErrorMsg(null)
    startTransition(async () => {
      const res = await approvePublisherAction(id)
      if (!res.ok) {
        setErrorMsg(res.formError || strings.admin.publisher.approveError)
      } else {
        setExpandedId(null)
      }
    })
  }

  const handleRejectConfirm = (reason: string) => {
    if (!rejectingId) return
    setErrorMsg(null)
    const targetId = rejectingId
    setRejectingId(null)
    
    startTransition(async () => {
      const res = await rejectPublisherAction(targetId, reason)
      if (!res.ok) {
        setErrorMsg(res.formError || strings.admin.publisher.rejectError)
      } else {
        setExpandedId(null)
      }
    })
  }

  const getRegionLabel = (regionId: string | null) => {
    return REGIONS.find(r => r.id === regionId as RegionId)?.label || regionId || '—'
  }

  const getTypeLabel = (typeId: string | null) => {
    return PUBLISHER_TYPES.find(t => t.id === typeId as PublisherTypeId)?.label || typeId || '—'
  }

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div role="alert" className="p-3 bg-danger/10 text-danger rounded-input text-sm font-semibold text-start">
          {errorMsg}
        </div>
      )}

      {publishers.length === 0 ? (
        <div className="bg-surface border border-border rounded-card p-8 text-center text-ink-soft font-semibold">
          {strings.admin.publisher.empty}
        </div>
      ) : (
        <div className="divide-y divide-border/60 bg-surface rounded-card border border-border shadow-resting overflow-hidden">
          {publishers.map((pub) => {
            const isExpanded = expandedId === pub.id
            return (
              <div key={pub.id} className="flex flex-col">
                {/* Summary Row */}
                <div 
                  onClick={() => toggleExpand(pub.id)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-paper/10 transition-colors"
                >
                  <div className="flex flex-col gap-1 text-start">
                    <h3 className="text-base font-bold text-ink">{pub.full_name}</h3>
                    <p className="text-xs font-semibold text-ink-soft">
                      {getTypeLabel(pub.publisher_type)} &middot; {getRegionLabel(pub.region)} &middot; {pub.city || '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-ink-soft">
                      <bdi>{new Date(pub.created_at).toLocaleDateString('he-IL')}</bdi>
                    </span>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-ink-soft" /> : <ChevronDown className="w-5 h-5 text-ink-soft" />}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="bg-paper/20 p-5 border-t border-border/40 text-start space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="block text-xs text-ink-soft font-semibold mb-1">{strings.admin.publisher.age}</span>
                        <span className="font-semibold text-ink">{pub.age ? `${pub.age} ${strings.admin.publisher.years}` : '—'}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-ink-soft font-semibold mb-1">{strings.admin.publisher.phone}</span>
                        <span className="font-semibold text-ink select-all">
                          <span dir="ltr">{pub.phone || '—'}</span>
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-ink-soft font-semibold mb-1">{strings.admin.publisher.type}</span>
                        <span className="font-semibold text-ink">{getTypeLabel(pub.publisher_type)}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-ink-soft font-semibold mb-1">{strings.admin.publisher.region}</span>
                        <span className="font-semibold text-ink">{getRegionLabel(pub.region)} {pub.city ? `(${pub.city})` : ''}</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
                      <Button 
                        variant="tertiary" 
                        className="text-danger hover:bg-danger/10" 
                        onClick={() => setRejectingId(pub.id)}
                        disabled={isPending}
                      >
                        {strings.admin.publisher.rejectBtn}
                      </Button>
                      <Button 
                        variant="primary" 
                        onClick={() => handleApprove(pub.id)}
                        disabled={isPending}
                      >
                        {isPending ? strings.admin.publisher.approving : strings.admin.publisher.approveBtn}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <DecisionDialog
        isOpen={rejectingId !== null}
        onClose={() => setRejectingId(null)}
        onConfirm={handleRejectConfirm}
        title={strings.admin.publisher.dialogTitle}
        label={strings.admin.publisher.dialogLabel}
        placeholder={strings.admin.publisher.dialogPlaceholder}
        confirmLabel={strings.admin.publisher.rejectBtn}
      />
    </div>
  )
}
