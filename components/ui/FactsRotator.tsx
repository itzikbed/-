'use client'

import React from 'react'
import {
  Cat,
  HandHeart,
  HeartPulse,
  House,
  Pause,
  Play,
  Sprout,
  Stethoscope,
  Target,
} from 'lucide-react'

const FACT_ICONS = [Cat, Sprout, HeartPulse, House, Stethoscope, Target, HandHeart]
const ROTATE_MS = 7000

export interface Fact {
  figure: string
  title: string
  text: string
}

export interface FactsRotatorLabels {
  region: string
  pause: string
  play: string
  goTo: string
}

interface FactsRotatorProps {
  facts: Fact[]
  labels: FactsRotatorLabels
}

const controlClass =
  'inline-flex items-center justify-center min-w-11 min-h-11 rounded-btn text-pine ' +
  'hover:bg-surface-solid focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-pine cursor-pointer'

/**
 * The "numbers and facts" band on the about page: one fact at a time, replaced
 * on a timer. The facts share a single grid cell, so the block is as tall as
 * the longest one and nothing jumps when they change.
 *
 * Two rules govern the motion. It stops whenever the pointer or the keyboard is
 * inside the block, and the pause control is always present (WCAG 2.2.2). Under
 * `prefers-reduced-motion` the timer never starts, the controls are gone and CSS
 * unfolds the stack into a plain list, so every fact is readable at once.
 */
export function FactsRotator({ facts, labels }: FactsRotatorProps) {
  const [index, setIndex] = React.useState(0)
  const [paused, setPaused] = React.useState(false)
  const [held, setHeld] = React.useState(false)
  const [still, setStill] = React.useState(false)

  React.useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setStill(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  const rotating = !still && facts.length > 1

  React.useEffect(() => {
    if (!rotating || paused || held) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % facts.length)
    }, ROTATE_MS)
    return () => window.clearInterval(timer)
  }, [rotating, paused, held, facts.length])

  return (
    <div
      className="mt-8"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      <ul
        className="facts-stack facts-wash"
        aria-label={labels.region}
        aria-live={rotating && !paused ? 'off' : 'polite'}
      >
        {facts.map((fact, position) => {
          const Icon = FACT_ICONS[position % FACT_ICONS.length]
          const active = position === index
          return (
            <li
              key={fact.title}
              className="facts-slide px-4 py-9 md:py-11 text-center"
              data-active={active ? 'true' : undefined}
              aria-hidden={rotating && !active ? true : undefined}
            >
              <span className="inline-flex p-3 rounded-full bg-surface-solid text-pine shadow-resting">
                <Icon className="w-6 h-6" aria-hidden="true" />
              </span>
              <p className="mt-4 font-display font-extrabold text-4xl md:text-5xl text-pine leading-tight">
                {fact.figure}
              </p>
              <h3 className="mt-2 font-display font-bold text-xl md:text-2xl text-ink leading-snug">
                {fact.title}
              </h3>
              <p className="mt-3 mx-auto max-w-xl text-base text-ink-soft leading-relaxed">
                {fact.text}
              </p>
            </li>
          )
        })}
      </ul>

      {rotating && (
        <div className="facts-controls mt-2 flex flex-wrap items-center justify-center">
          <button
            type="button"
            onClick={() => setPaused((current) => !current)}
            aria-label={paused ? labels.play : labels.pause}
            className={controlClass}
          >
            {paused ? (
              <Play className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Pause className="w-4 h-4" aria-hidden="true" />
            )}
          </button>

          {/* The dots stay one unbroken row: on a 320px screen the pause
              control wraps above them instead of orphaning a single dot. */}
          <div className="flex items-center justify-center">
            {facts.map((fact, position) => (
              <button
                key={fact.title}
                type="button"
                onClick={() => {
                  setIndex(position)
                  setPaused(true)
                }}
                aria-label={labels.goTo.replace('{index}', String(position + 1))}
                aria-current={position === index ? 'true' : undefined}
                className={`facts-dot ${controlClass}`}
              >
                <span aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
