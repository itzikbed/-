'use client'

import React, { useId, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { strings } from '@/lib/strings'

interface SupportComposerProps {
  onSend: (body: string) => Promise<boolean>
  sending: boolean
  placeholder: string
}

// Message input shared by the user widget and the admin conversation view.
// Enter sends, Shift+Enter inserts a newline; the textarea grows up to ~4 rows.
export function SupportComposer({ onSend, sending, placeholder }: SupportComposerProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputId = useId()

  const submit = async () => {
    const body = value.trim()
    if (!body || sending) return
    const ok = await onSend(body)
    if (ok) {
      setValue('')
      const el = textareaRef.current
      if (el) {
        el.style.height = 'auto'
        el.focus()
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void submit()
    }
  }

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
      className="border-t border-border bg-surface p-3"
    >
      <div className="flex items-end gap-2">
        <label htmlFor={inputId} className="sr-only">
          {strings.supportChat.inputLabel}
        </label>
        <textarea
          id={inputId}
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={placeholder}
          maxLength={2000}
          rows={1}
          className="flex-1 resize-none overflow-y-auto min-h-[44px] max-h-28 px-3.5 py-2.5 text-sm bg-paper border border-border rounded-[12px] text-ink placeholder:text-ink-soft/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
        />
        <button
          type="submit"
          aria-label={strings.supportChat.sendBtn}
          disabled={sending || !value.trim()}
          className="shrink-0 w-11 h-11 rounded-full bg-marmalade text-ink hover:bg-marmalade-dp shadow-resting flex items-center justify-center cursor-pointer transition-all disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
        >
          {sending ? (
            <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <Send className="w-5 h-5 rtl:-scale-x-100" aria-hidden="true" />
          )}
        </button>
      </div>
      <p className="text-[11px] text-ink-soft mt-1.5 select-none text-start">
        {strings.supportChat.sendHint}
      </p>
    </form>
  )
}
