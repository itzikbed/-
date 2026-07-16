'use client'

import React, { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import DecisionDialog from '@/components/admin/DecisionDialog'
import { approveAdoptionRequestAction, rejectAdoptionRequestAction } from './request-actions'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { FLOOR_TYPES, FloorTypeId } from '@/lib/constants'
import { strings } from '@/lib/strings'

import { Request } from './types'

interface RequestQueueProps {
  requests: Request[]
}

export default function RequestQueue({ requests }: RequestQueueProps) {
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
      const res = await approveAdoptionRequestAction(id)
      if (!res.ok) {
        setErrorMsg(res.formError || strings.admin.request.approveError)
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
      const res = await rejectAdoptionRequestAction(targetId, reason)
      if (!res.ok) {
        setErrorMsg(res.formError || strings.admin.request.rejectError)
      } else {
        setExpandedId(null)
      }
    })
  }

  const getFloorLabel = (floorId: string | null) => {
    return FLOOR_TYPES.find(f => f.id === floorId as FloorTypeId)?.label || floorId || '—'
  }

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div role="alert" className="p-3 bg-danger/10 text-danger rounded-input text-sm font-semibold text-start">
          {errorMsg}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="bg-surface border border-border rounded-card p-8 text-center text-ink-soft font-semibold">
          {strings.admin.request.empty}
        </div>
      ) : (
        <div className="divide-y divide-border/60 bg-surface rounded-card border border-border shadow-resting overflow-hidden">
          {requests.map((req) => {
            const isExpanded = expandedId === req.id
            const adopter = req.adopter
            const catName = req.cats?.name || strings.common.defaultCatName
            const q = getQuestionnaire(adopter)

            return (
              <div key={req.id} className="flex flex-col">
                {/* Summary Row */}
                <button 
                  type="button"
                  onClick={() => toggleExpand(req.id)}
                  aria-expanded={isExpanded}
                  className="w-full text-start flex items-center justify-between p-4 cursor-pointer hover:bg-paper/10 transition-colors border-0 bg-transparent font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 rounded-sm"
                >
                  <div className="flex flex-col gap-1 text-start">
                    <h3 className="text-base font-bold text-ink">
                      {strings.admin.request.title
                        .replace('{adopter}', adopter?.full_name || '')
                        .replace('{catName}', catName)}
                    </h3>
                    <p className="text-xs font-semibold text-ink-soft">
                      {strings.admin.request.submittedAt} &middot; <bdi>{new Date(req.created_at).toLocaleDateString('he-IL')}</bdi>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-ink-soft" /> : <ChevronDown className="w-5 h-5 text-ink-soft" />}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="bg-paper/20 p-5 border-t border-border/40 text-start space-y-4 animate-fade-in">
                    
                    {/* Message Box */}
                    <div className="text-sm">
                      <span className="block text-xs text-ink-soft font-semibold mb-1">{strings.admin.request.message}</span>
                      <p className="bg-surface p-3 rounded-input border border-border/40 font-medium text-ink leading-relaxed whitespace-pre-line">
                        {req.message}
                      </p>
                    </div>

                    {/* Questionnaire definition list */}
                    {q ? (
                      <div className="pt-2">
                        <span className="block text-xs text-ink-soft font-semibold mb-2">{strings.admin.request.questionnaire}</span>
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 bg-surface p-4 rounded-card border border-border/40 text-sm">
                          <div>
                            <dt className="text-xs text-ink-soft font-semibold">{strings.admin.request.ageCity}</dt>
                            <dd className="mt-0.5 font-bold text-ink">
                              {q.age ? `${q.age} ${strings.admin.publisher.years}` : '—'} &middot; {q.city || '—'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-ink-soft font-semibold">{strings.admin.request.floorWindow}</dt>
                            <dd className="mt-0.5 font-bold text-ink">
                              {getFloorLabel(q.floor_type)} &middot; {strings.admin.request.screens}: {q.has_window_screens ? strings.common.yes : strings.common.no}
                            </dd>
                          </div>
                          <div className="md:col-span-2">
                            <dt className="text-xs text-ink-soft font-semibold">{strings.admin.request.household}</dt>
                            <dd className="mt-0.5 font-medium text-ink">{q.household_desc || '—'}</dd>
                          </div>
                          <div className="md:col-span-2">
                            <dt className="text-xs text-ink-soft font-semibold">{strings.admin.request.otherPets}</dt>
                            <dd className="mt-0.5 font-medium text-ink">
                              {q.has_other_pets ? q.other_pets_desc || strings.common.yes : strings.common.no}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-ink-soft font-semibold">{strings.admin.request.experience}</dt>
                            <dd className="mt-0.5 font-bold text-ink">
                              {q.has_cat_experience ? strings.common.yes : strings.common.no}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-ink-soft font-semibold">{strings.admin.request.vet}</dt>
                            <dd className="mt-0.5 font-medium text-ink">{q.vet_clinic || '—'}</dd>
                          </div>
                          <div className="md:col-span-2">
                            <dt className="text-xs text-ink-soft font-semibold">{strings.admin.request.reason}</dt>
                            <dd className="mt-0.5 font-medium text-ink">{q.adoption_reason || '—'}</dd>
                          </div>
                          <div className="md:col-span-2">
                            <dt className="text-xs text-ink-soft font-semibold">{strings.admin.request.surrender}</dt>
                            <dd className="mt-0.5 font-medium text-ink">{q.surrender_circumstances || '—'}</dd>
                          </div>
                        </dl>
                      </div>
                    ) : (
                      <p className="text-xs text-danger font-semibold">{strings.admin.request.incompleteQuestionnaire}</p>
                    )}

                    <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
                      <Button 
                        variant="tertiary" 
                        className="text-danger hover:bg-danger/10" 
                        onClick={() => setRejectingId(req.id)}
                        disabled={isPending}
                      >
                        {strings.admin.request.rejectBtn}
                      </Button>
                      <Button 
                        variant="primary" 
                        onClick={() => handleApprove(req.id)}
                        disabled={isPending}
                      >
                        {isPending ? strings.admin.request.approving : strings.admin.request.approveBtn}
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
        title={strings.admin.request.dialogTitle}
        label={strings.admin.request.dialogLabel}
        placeholder={strings.admin.request.dialogPlaceholder}
        confirmLabel={strings.admin.request.rejectBtn}
      />
    </div>
  )
}

function getQuestionnaire(adopter: Request['adopter']) {
  if (!adopter) return null
  const ap = adopter.adopter_profiles
  if (Array.isArray(ap)) return ap[0] || null
  return ap || null
}
