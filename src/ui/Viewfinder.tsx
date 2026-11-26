// The draft editor. A transparent textarea sits exactly on top of a mirror
// that renders the same text with the giveaways underlined, so typing feels
// like a normal editor while the highlights stay in place.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { HEAT_LABEL, type Heat, type HeatTell } from './heat'

interface Props {
  draft: string
  onChange: (text: string) => void
  tells: HeatTell[]
  /** Span to point at, e.g. after clicking a giveaway or a piece of evidence. */
  focus: { start: number; end: number; nonce: number } | null
  /** Bumped when a whole new draft is loaded, to replay the highlight fade-in. */
  warmKey: number
  footer: ReactNode
  readOnly?: boolean
  /** A fact being pointed at in the detective's file. */
  linked?: string | null
  /** Cmd/Ctrl+Enter. */
  onSubmit?: () => void
}

const HEATS: Heat[] = ['hottest', 'hot', 'warm', 'cool']

export function Viewfinder({ draft, onChange, tells, focus, warmKey, footer, readOnly, linked, onSubmit }: Props) {
  const mirrorRef = useRef<HTMLDivElement>(null)
  // Highlights fade in once when a whole new draft arrives, not while typing.
  const [warmed, setWarmed] = useState(-1)
  const warming = warmed !== warmKey
  useEffect(() => {
    const t = setTimeout(() => setWarmed(warmKey), 900)
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
        <div className="vf-stack">
          <div ref={mirrorRef} key={warmKey} className={warming ? 'vf-mirror vf-warming' : 'vf-mirror'} aria-hidden="true">
            {segments}
          </div>
          <textarea
            className="vf-input"
            value={draft}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (onSubmit && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                onSubmit()
              }
            }}
            placeholder="Paste or write the post you want to publish anonymously."
            spellCheck={false}
            readOnly={readOnly}
            aria-label="Your draft post"
            aria-keyshortcuts="Control+Enter Meta+Enter"
          />
        </div>
      </div>
      <div className="vf-bar">
        {tells.length ? (
          <div className="vf-legend" aria-label="Giveaways by strength">
            {HEATS.map((h, i) =>
              counts[i] ? (
                <span key={h} className="vf-legend-item">
                  <span className={`swatch swatch-${h}`} aria-hidden="true" />
                  {HEAT_LABEL[h]}
                  <b>{counts[i]}</b>
                </span>
              ) : null,
            )}
          </div>
        ) : null}
        <div className="vf-status">{footer}</div>
      </div>
    </section>
  )
}
