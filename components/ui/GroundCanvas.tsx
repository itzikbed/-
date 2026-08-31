'use client'

import React, { useEffect, useRef } from 'react'

// Dust turning in a sunbeam, behind everything. It rides on top of whichever
// page ground is in use and only runs while body carries `has-motes`; it stops
// when the tab is hidden, and never starts at all under prefers-reduced-motion,
// where the page keeps its ground and simply holds still.

const MOTE_COUNT = 52
const WARM = '235, 175, 86'
const PINE = '28, 102, 80'

interface Mote {
  x: number
  y: number
  r: number
  drift: number
  rise: number
  alpha: number
  warm: boolean
  phase: number
}

function seedMotes(width: number, height: number): Mote[] {
  const motes: Mote[] = []
  for (let i = 0; i < MOTE_COUNT; i++) {
    // Deterministic spread rather than random, so the field never clumps and
    // never looks different between two loads of the same page.
    const t = (i + 1) / (MOTE_COUNT + 1)
    motes.push({
      x: ((t * 7919) % 1) * width,
      y: ((t * 6271) % 1) * height,
      r: 1 + ((t * 4211) % 1) * 2.4,
      drift: 3 + ((t * 3307) % 1) * 9,
      rise: 5 + ((t * 2749) % 1) * 11,
      alpha: 0.09 + ((t * 1877) % 1) * 0.13,
      warm: i % 3 !== 0,
      phase: ((t * 5477) % 1) * Math.PI * 2
    })
  }
  return motes
}

export function GroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let motes: Mote[] = []
    let frame = 0
    let width = 0
    let height = 0

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      motes = seedMotes(width, height)
    }

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height)
      const t = time / 1000

      for (const mote of motes) {
        const x = mote.x + Math.sin(t / mote.drift + mote.phase) * 26
        const y = mote.y - ((t * (14 / mote.rise)) % (height + 40)) + 20
        const wrapped = y < -20 ? y + height + 40 : y

        ctx.beginPath()
        ctx.arc(x, wrapped, mote.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${mote.warm ? WARM : PINE}, ${mote.alpha})`
        ctx.fill()
      }

      frame = requestAnimationFrame(draw)
    }

    const shouldRun = () =>
      document.body.classList.contains('has-motes') &&
      !reduced.matches &&
      document.visibilityState === 'visible'

    const stop = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      ctx.clearRect(0, 0, width, height)
    }

    const sync = () => {
      if (shouldRun()) {
        if (!frame) frame = requestAnimationFrame(draw)
      } else {
        stop()
      }
    }

    resize()
    sync()

    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', sync)
    reduced.addEventListener('change', sync)

    const classWatch = new MutationObserver(sync)
    classWatch.observe(document.body, { attributes: true, attributeFilter: ['class'] })

    return () => {
      stop()
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', sync)
      reduced.removeEventListener('change', sync)
      classWatch.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  )
}
