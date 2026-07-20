'use client'

import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'

type TurnstileAction = 'login' | 'signup' | 'password_reset'

type TurnstileRenderOptions = {
  sitekey: string
  action: TurnstileAction
  language: string
  size: 'flexible'
  'response-field': false
  callback: (token: string) => void
  'expired-callback': () => void
  'timeout-callback': () => void
  'error-callback': () => boolean
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string
      remove: (widgetId: string) => void
    }
  }
}

type TurnstileWidgetProps = {
  siteKey: string
  action: TurnstileAction
  label: string
  errorMessage: string
  onTokenChange: (token: string | undefined) => void
}

const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

export function TurnstileWidget({
  siteKey,
  action,
  label,
  errorMessage,
  onTokenChange,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scriptReady, setScriptReady] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!scriptReady || !containerRef.current || !window.turnstile) return

    const turnstile = window.turnstile
    const widgetId = turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action,
      language: 'he',
      size: 'flexible',
      'response-field': false,
      callback: (token) => {
        setHasError(false)
        onTokenChange(token)
      },
      'expired-callback': () => onTokenChange(undefined),
      'timeout-callback': () => onTokenChange(undefined),
      'error-callback': () => {
        setHasError(true)
        onTokenChange(undefined)
        return true
      },
    })

    return () => {
      turnstile.remove(widgetId)
    }
  }, [action, onTokenChange, scriptReady, siteKey])

  return (
    <div role="group" aria-label={label} className="w-full min-h-[65px]">
      <Script
        src={TURNSTILE_SCRIPT_URL}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => {
          setHasError(true)
          onTokenChange(undefined)
        }}
      />
      <div ref={containerRef} />
      {hasError && (
        <p role="alert" className="mt-2 text-sm font-semibold text-danger">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
