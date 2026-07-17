'use client'

import React, { useState } from 'react'
import PublisherQueue from './PublisherQueue'
import CatQueue from './CatQueue'
import RequestQueue from './RequestQueue'
import SupportQueue from './SupportQueue'
import LogTable from './LogTable'
import { AdminPromoteCard } from '@/components/admin/AdminPromoteCard'
import { strings } from '@/lib/strings'
import type { AdminSupportConversation } from '@/lib/support/chat'

interface AdminDashboardClientProps {
  pendingPublishers: React.ComponentPropsWithoutRef<typeof PublisherQueue>['publishers']
  pendingCats: React.ComponentPropsWithoutRef<typeof CatQueue>['cats']
  pendingRequests: React.ComponentPropsWithoutRef<typeof RequestQueue>['requests']
  supportConversations: AdminSupportConversation[]
  supportUnreadMap: Record<string, number>
  adminId: string
  logs: React.ComponentPropsWithoutRef<typeof LogTable>['logs']
  entityNames: React.ComponentPropsWithoutRef<typeof LogTable>['entityNames']
  success?: string
}

type TabType = 'publishers' | 'cats' | 'requests' | 'support' | 'logs' | 'management'

export default function AdminDashboardClient({
  pendingPublishers,
  pendingCats,
  pendingRequests,
  supportConversations,
  supportUnreadMap,
  adminId,
  logs,
  entityNames,
  success
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('publishers')
  const [supportUnread, setSupportUnread] = useState(() =>
    Object.values(supportUnreadMap).reduce((sum, n) => sum + n, 0)
  )

  const tabItems = [
    { id: 'publishers' as TabType, label: strings.admin.tabs.publishers, count: pendingPublishers.length },
    { id: 'cats' as TabType, label: strings.admin.tabs.cats, count: pendingCats.length },
    { id: 'requests' as TabType, label: strings.admin.tabs.requests, count: pendingRequests.length },
    { id: 'support' as TabType, label: strings.supportChat.adminTab, count: supportUnread },
    { id: 'logs' as TabType, label: strings.admin.tabs.logs, count: null },
    { id: 'management' as TabType, label: strings.admin.tabs.management, count: null }
  ]

  return (
    <div className="space-y-6">
      {success === 'archived' && (
        <div className="bg-pine-soft border border-pine/20 text-pine rounded-card p-4 text-base font-semibold text-center select-none" role="alert">
          {strings.admin.archiveCatSuccess}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-border/80 overflow-x-auto no-scrollbar scroll-smooth">
        {tabItems.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-4 font-sans font-semibold text-sm border-b-2 transition-all duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-none ${
                isActive
                  ? 'border-pine text-pine font-bold bg-pine-soft/20'
                  : 'border-transparent text-ink-soft hover:text-ink hover:bg-paper/5'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full ${
                  isActive ? 'bg-pine text-white' : 'bg-border text-ink-soft'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Active Tab Panel */}
      <div className="animate-fade-in">
        {activeTab === 'publishers' && <PublisherQueue publishers={pendingPublishers} />}
        {activeTab === 'cats' && <CatQueue cats={pendingCats} />}
        {activeTab === 'requests' && <RequestQueue requests={pendingRequests} />}
        {activeTab === 'support' && (
          <SupportQueue
            initialConversations={supportConversations}
            initialUnreadMap={supportUnreadMap}
            adminId={adminId}
            onUnreadTotalChange={setSupportUnread}
          />
        )}
        {activeTab === 'logs' && <LogTable logs={logs} entityNames={entityNames} />}
        {activeTab === 'management' && <AdminPromoteCard />}
      </div>
    </div>
  )
}
