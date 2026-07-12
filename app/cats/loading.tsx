import React from 'react'
import { Skeleton } from '@/components/ui/Skeleton'

export default function CatalogLoading() {
  return (
    <div className="flex flex-col flex-grow select-none">
      <div className="app-container py-8 flex flex-col gap-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48 rounded animate-pulse" />
          <Skeleton className="h-5 w-32 rounded animate-pulse" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          {/* Sidebar Skeleton */}
          <div className="hidden md:block md:col-span-1 bg-surface border border-border rounded-card p-6 space-y-6">
            <Skeleton className="h-6 w-1/2 animate-pulse" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-1/3 animate-pulse" />
                  <Skeleton className="h-8 w-full animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Grid Skeleton */}
          <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="bg-surface border border-border rounded-card p-4 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <Skeleton className="aspect-[4/3] w-full rounded-photo animate-pulse" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-1/3 animate-pulse" />
                    <Skeleton className="h-4 w-2/3 animate-pulse" />
                  </div>
                </div>
                <Skeleton className="h-8 w-1/2 rounded-full mt-4 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
