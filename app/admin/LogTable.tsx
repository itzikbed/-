'use client'

import React from 'react'
import { strings } from '@/lib/strings'

interface LogRow {
  id: string
  actor_id: string
  entity_type: string
  entity_id: string
  action: string
  reason: string | null
  created_at: string
  actor?: {
    full_name: string
  } | null
}

interface LogTableProps {
  logs: LogRow[]
}

export default function LogTable({ logs }: LogTableProps) {
  const getActionLabel = (action: string) => {
    switch (action) {
      case 'approve':
        return strings.admin.logs.approve
      case 'reject':
        return strings.admin.logs.reject
      default:
        return action
    }
  }

  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case 'publisher':
        return strings.admin.logs.publisher
      case 'cat':
        return strings.admin.logs.cat
      case 'request':
        return strings.admin.logs.request
      default:
        return type
    }
  }

  return (
    <div className="bg-surface rounded-card border border-border shadow-resting overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-start border-collapse font-sans text-sm">
          <thead>
            <tr className="bg-paper border-b border-border/80 text-ink font-semibold">
              <th className="p-4 text-start">{strings.admin.logs.date}</th>
              <th className="p-4 text-start">{strings.admin.logs.actor}</th>
              <th className="p-4 text-start">{strings.admin.logs.entityType}</th>
              <th className="p-4 text-start">{strings.admin.logs.action}</th>
              <th className="p-4 text-start">{strings.admin.logs.entityId}</th>
              <th className="p-4 text-start">{strings.admin.logs.details}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-ink-soft">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center font-medium">
                  {strings.admin.logs.empty}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-paper/20">
                  <td className="p-4 whitespace-nowrap">
                    <bdi>{new Date(log.created_at).toLocaleString('he-IL')}</bdi>
                  </td>
                  <td className="p-4 font-semibold text-ink">
                    {log.actor?.full_name || '—'}
                  </td>
                  <td className="p-4">{getEntityTypeLabel(log.entity_type)}</td>
                  <td className="p-4 font-semibold">
                    <span className={log.action === 'approve' ? 'text-success' : 'text-danger'}>
                      {getActionLabel(log.action)}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-xs">
                    <span dir="ltr">{log.entity_id}</span>
                  </td>
                  <td className="p-4 max-w-xs truncate" title={log.reason || ''}>
                    {log.reason || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
export type { LogRow }
