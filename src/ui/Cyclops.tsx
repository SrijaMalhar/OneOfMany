// The detective, drawn as what it is: a cloud with one eye. It watches the
// cursor while it waits, scans while it reads your post, locks on when it
// finds you, and gets drowsy when it can't.

import { useEffect, useRef } from 'react'

export type CyclopsState = 'idle' | 'scanning' | 'found' | 'unsure' | 'lost' | 'asleep'

const TEXT: Record<CyclopsState, string> = {
  idle: 'The detective is waiting',
  scanning: 'The detective is reading your post',
  found: 'The detective found you',
  unsure: 'The detective narrowed you down',
  lost: 'The detective lost you',
  asleep: 'The detective is asleep',
}

export function Cyclops({ state, size = 150 }: { state: CyclopsState; size?: number }) {
  const ref = useRef<SVGSVGElement>(null)

  // While idle, the pupil follows the cursor. Written straight to CSS
  // variables so it never re-renders React.
  useEffect(() => {
    const el = ref.current
    if (!el || state !== 'idle' || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const dx = e.clientX - (r.left + r.width / 2)
        const dy = e.clientY - (r.top + r.height * 0.57)
        const d = Math.hypot(dx, dy) || 1
        const k = Math.min(1, d / 400)
        el.style.setProperty('--px', `${((dx / d) * 8 * k).toFixed(2)}px`)
        el.style.setProperty('--py', `${((dy / d) * 5 * k).toFixed(2)}px`)
      })
    }
    addEventListener('pointermove', move)
    return () => {
      removeEventListener('pointermove', move)
      cancelAnimationFrame(frame)
      el.style.removeProperty('--px')
      el.style.removeProperty('--py')
    }
  }, [state])

  return (
    <svg ref={ref} className={`cyclops cyclops-${state}`} viewBox="0 0 120 88" width={size} height={(size * 88) / 120} role="img" aria-label={TEXT[state]}>
      <defs>
        <clipPath id="cyclops-eye">
          <ellipse cx="60" cy="50" rx="21" ry="17" />
        </clipPath>
      </defs>
      <g className="cyclops-cloud">
        <circle cx="28" cy="54" r="18" />
        <circle cx="42" cy="34" r="20" />
        <circle cx="64" cy="26" r="22" />
        <circle cx="86" cy="36" r="19" />
        <circle cx="96" cy="56" r="16" />
        <rect x="22" y="44" width="80" height="28" rx="14" />
      </g>
      <ellipse cx="60" cy="50" rx="21" ry="17" fill="#fff" />
      <g clipPath="url(#cyclops-eye)">
        <g className="cyclops-ball">
          <circle className="cyclops-iris" cx="60" cy="51" r="11.5" />
          <circle className="cyclops-pupil" cx="60" cy="51" r="5.2" />
          <circle cx="64" cy="47" r="2.4" fill="#fff" />
        </g>
        <g className="cyclops-lid">
          <rect x="30" y="-40" width="60" height="72" />
          <path d="M37 32Q60 26 83 32" />
        </g>
      </g>
      <ellipse cx="60" cy="50" rx="21" ry="17" fill="none" stroke="var(--ink)" strokeWidth="2.4" />
      {state === 'lost' ? (
        <text className="cyclops-mark" x="92" y="18">
          ?
        </text>
      ) : null}
      {state === 'asleep' ? (
        <text className="cyclops-mark small" x="90" y="20">
          z z
        </text>
      ) : null}
    </svg>
  )
}
