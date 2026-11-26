// The draft, seen through a thermal camera. A transparent textarea sits
// exactly on top of a mirror that renders the same text with the giveaways
// glowing underneath, so typing feels like a normal editor.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { HEAT_LABEL, type Heat, type HeatTell } from './heat'

interface Props {
  draft: string
  onChange: (text: string) => void
  tells: HeatTell[]
  /** Span to point at, e.g. after clicking a giveaway or a piece of evidence. */
  focus: { start: number; end: number; nonce: number } | null
  /** Bumped when a whole new draft is loaded, to replay the warm-up. */
  warmKey: number
  footer: ReactNode
  readOnly?: boolean
  /** A fact being pointed at in the detective's file. */
  linked?: string | null
}

const HEATS: Heat[] = ['cool', 'warm', 'hot', 'hottest']

export function Viewfinder({ draft, onChange, tells, focus, warmKey, footer, readOnly, linked }: Props) {
  const mirrorRef = useRef<HTMLDivElement>(null)
  // The glows "warm up" once when a whole new draft arrives, not while typing.
  const [warmed, setWarmed] = useState(-1)
  const warming = warmed !== warmKey
  useEffect(() => {
    const t = setTimeout(() => setWarmed(warmKey), 2600)
    return () => clearTimeout(t)
  }, [warmKey])
  const focusedIndex = focus ? tells.findIndex((t) => t.start < focus.end && t.end > focus.start) : -1

  const segments = useMemo(() => {
    const out: ReactNode[] = []
    let at = 0
    tells.forEach((t, i) => {
      if (t.start > at) out.push(draft.slice(at, t.start))
      out.push(
        <mark
          key={`${i}-${t.start}`}
          className={`heat heat-${t.heat}${i === focusedIndex ? ' is-focus' : ''}${linked && t.attrs.includes(linked as never) ? ' is-linked' : ''}`}
          style={{ ['--i' as string]: i }}
          data-index={i}
          data-attrs={t.attrs.length ? t.attrs.join(' ') : undefined}
        >
          {draft.slice(t.start, t.end)}
        </mark>,
      )
      at = t.end
    })
    out.push(draft.slice(at))
    // A trailing newline needs a character after it to take up space.
    out.push('​')
    return out
  }, [draft, tells, focusedIndex, linked])

  useEffect(() => {
    if (focusedIndex < 0) return
    const el = mirrorRef.current?.querySelector(`[data-index="${focusedIndex}"]`)
    el?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [focusedIndex, focus?.nonce])

  const counts = HEATS.map((h) => tells.filter((t) => t.heat === h).length)

  return (
    <section className="vf" aria-label="Your draft">
      <div className="vf-frame">
        <span className="vf-corner tl" aria-hidden="true" />
        <span className="vf-corner tr" aria-hidden="true" />
        <span className="vf-corner bl" aria-hidden="true" />
        <span className="vf-corner br" aria-hidden="true" />
        <div className="vf-stack">
          <div ref={mirrorRef} key={warmKey} className={warming ? 'vf-mirror vf-warming' : 'vf-mirror'} aria-hidden="true">
            {segments}
          </div>
          <textarea
            className="vf-input"
            value={draft}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste or write the post you want to publish anonymously."
            spellCheck={false}
            readOnly={readOnly}
            aria-label="Your draft post"
          />
        </div>
      </div>
      <div className="vf-foot">
        <div className="vf-scale" aria-label="Heat scale">
          {HEATS.map((h, i) => (
            <span key={h} className={`vf-swatch heat-${h}`} title={HEAT_LABEL[h]}>
              <span className="vf-swatch-dot" />
              {HEAT_LABEL[h]}
              <span className="vf-swatch-n">{counts[i]}</span>
            </span>
          ))}
        </div>
        <div className="vf-status">{footer}</div>
      </div>
    </section>
  )
}
