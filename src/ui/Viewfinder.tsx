// The draft editor. A transparent textarea sits exactly on top of a mirror
// that renders the same text with the giveaways underlined, so typing feels
// like a normal editor while the highlights stay in place.
//
// A second tab reads the page the way the detective does: everything that
// isn't a clue fades back, and each clue gets a tag saying what it gives
// away, or what the detective actually worked out from it.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ATTRIBUTE_LABEL, TELL_KIND_LABEL } from '../types'
import { HEAT_LABEL, type Heat, type HeatTell } from './heat'

export type DraftView = 'write' | 'detective'

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
  view?: DraftView
  onView?: (v: DraftView) => void
  /** A clue picked in the detective's view. */
  onPickTell?: (t: HeatTell) => void
}

const HEATS: Heat[] = ['hottest', 'hot', 'warm', 'cool']

export function Viewfinder({ draft, onChange, tells, focus, warmKey, footer, readOnly, linked, onSubmit, view = 'write', onView, onPickTell }: Props) {
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

  const reading = useMemo(() => (view === 'detective' ? detectiveView(draft, tells, onPickTell) : null), [view, draft, tells, onPickTell])

  useEffect(() => {
    if (focusedIndex < 0) return
    const el = mirrorRef.current?.querySelector(`[data-index="${focusedIndex}"]`)
    el?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [focusedIndex, focus?.nonce])

  const counts = HEATS.map((h) => tells.filter((t) => t.heat === h).length)

  return (
    <section className={`vf vf-${view}`} aria-label="Your draft">
      {onView ? (
        <div className="vf-tabs" role="group" aria-label="How to show the draft">
          <button type="button" aria-pressed={view === 'write'} onClick={() => onView('write')}>
            Write
          </button>
          <button type="button" aria-pressed={view === 'detective'} onClick={() => onView('detective')} disabled={!draft.trim()}>
            Read it like the detective
          </button>
        </div>
      ) : null}
      <div className="vf-frame">
        {reading ? (
          <div className="vf-xray" aria-label="Your draft as the detective reads it">
            <p className="xr-stat">{reading.stat}</p>
            <div className="xr-text">{reading.nodes}</div>
          </div>
        ) : null}
        <div className="vf-stack" hidden={reading != null}>
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

/** The page as the detective reads it: clues tagged, everything else faded. */
function detectiveView(draft: string, tells: HeatTell[], onPick?: (t: HeatTell) => void) {
  const nodes: ReactNode[] = []
  let at = 0
  let clueWords = 0
  tells.forEach((t, i) => {
    if (t.start > at) nodes.push(<span key={`d${i}`} className="xr-dim">{draft.slice(at, t.start)}</span>)
    const text = draft.slice(t.start, t.end)
    clueWords += words(text)
    const tag = t.attrs.length ? `gave away: ${t.attrs.map((a) => ATTRIBUTE_LABEL[a].toLowerCase()).join(', ')}` : TELL_KIND_LABEL[t.kind]
    nodes.push(
      <span key={`m${i}`} className={`xr-clue heat-${t.heat}`}>
        {/* A span, not a button, so a long clue can wrap across lines. */}
        <mark
          className={`heat heat-${t.heat}`}
          role="button"
          tabIndex={0}
          onClick={() => onPick?.(t)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onPick?.(t)
            }
          }}
          aria-label={`${text}: ${tag}. Find it in the draft.`}
        >
          {text}
        </mark>
        <span className="xr-tag" aria-hidden="true">
          {tag}
        </span>
      </span>,
    )
    at = t.end
  })
  nodes.push(<span key="end" className="xr-dim">{draft.slice(at)}</span>)
  const total = words(draft)
  const pct = total ? Math.round((clueWords / total) * 100) : 0
  const stat = tells.length
    ? `${tells.length} ${tells.length === 1 ? 'clue' : 'clues'} in ${clueWords} of your ${total} words (${pct}%). That’s all the detective needs.`
    : 'No clues marked yet. The detective still reads every word, so send it to be sure.'
  return { nodes, stat }
}

function words(s: string) {
  return (s.match(/\S+/g) ?? []).length
}
