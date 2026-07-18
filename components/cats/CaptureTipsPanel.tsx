'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Film, Focus, Layers, Sun } from 'lucide-react'
import { strings } from '@/lib/strings'

const STORAGE_KEY = 'capture-tips-open'

const TIPS = [
  { icon: Sun, text: strings.publish.captureTipsLight },
  { icon: Focus, text: strings.publish.captureTipsDistance },
  { icon: Layers, text: strings.publish.captureTipsBackground },
  { icon: Film, text: strings.publish.captureTipsVideo }
]

// SSR markup is stable (collapsed); the stored preference is applied after
// mount so only first-time visitors see the panel expand on its own.
export function CaptureTipsPanel() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === null) {
        setOpen(true)
        window.localStorage.setItem(STORAGE_KEY, '1')
      } else {
        setOpen(stored === '1')
      }
    } catch {
      setOpen(true)
    }
  }, [])

  const toggle = () => {
    setOpen((prev) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, prev ? '0' : '1')
      } catch {
        // Private-mode storage failures only lose the persisted preference
      }
      return !prev
    })
  }

  return (
    <div className="bg-pine-soft/50 border border-pine/15 rounded-input">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="capture-tips-list"
        className="w-full min-h-11 flex items-center justify-between gap-2 px-4 py-3 text-sm font-bold text-pine cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine rounded-input"
      >
        <span>{strings.publish.captureTipsToggle}</span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      <ul id="capture-tips-list" hidden={!open} className="px-4 pb-4 space-y-2.5">
        {TIPS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-2.5 text-sm text-ink leading-relaxed">
            <Icon className="w-4 h-4 mt-0.5 shrink-0 text-pine" aria-hidden="true" />
            <span className="font-semibold">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
