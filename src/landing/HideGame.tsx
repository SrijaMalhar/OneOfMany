// "Can the eye find you?" A playable version of the idea, right on the
// landing page. The rules that run on this device mark every giveaway as you
// type; each one crosses out part of the flock in red pencil, until the
// eye's beam lands on Nobody. Blur a detail and the flock comes back. No AI and no network here:
// the real detective is one click away.

import { type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { blurSpan, replaceSpan } from '../engine/blur'
import { ruleTells } from '../engine/tells'
import { SAMPLES } from '../samples'
import { saveDraft } from '../store'
import { TELL_KIND_LABEL, type Risk, type Tell } from '../types'
import { CyclopsEye, FlockSheep, Nobody } from './art'

const PEN = 40
// How much of the flock each giveaway keeps. A picture of the idea, not a
// population estimate: more details, fewer people they could fit.
const KEEP: Record<Risk, number> = { high: 0.42, medium: 0.62, low: 0.84 }
// Row 3, column 5 of the pen: just right of centre.
const YOU = 20

function standing(tells: Tell[]) {
  const share = tells.reduce((p, t) => p * KEEP[t.risk], 1)
  return Math.max(1, Math.round(PEN * share))
}

function verdict(n: number, tells: number) {
  if (n === 1) return { head: 'Found you.', body: 'Only one sheep fits every detail. Blur what gave you away to slip back in.' }
  if (n < 10) return { head: `${n} sheep left.`, body: 'The eye is closing in. A couple more details and it has you.' }
  if (n < PEN * 0.75) return { head: 'It’s narrowing down.', body: 'Each detail rules some of the flock out.' }
  if (tells === 0) return { head: 'Nothing to go on.', body: 'The rules found no giveaways. You look like the rest of the flock.' }
  return { head: 'Still in the crowd.', body: 'A small clue or two, but you could be almost any of them.' }
}

export function HideGame({ onStart }: { onStart: () => void }) {
  const [sample, setSample] = useState(0)
  const [text, setText] = useState(SAMPLES[0].draft)
  const tells = useMemo(() => ruleTells(text), [text])
  const n = standing(tells)
  const v = verdict(n, tells.length)
  const found = n === 1

  // A fixed order: sheep leave the pen in the same order every time.
  const order = useMemo(() => {
    const rank = Array.from({ length: PEN }, (_, i) => ({ i, r: Math.abs((Math.sin(i * 91.7) * 1000) % 1) }))
      .filter((x) => x.i !== YOU)
      .sort((a, b) => a.r - b.r)
    const pos = new Array<number>(PEN).fill(-1)
    rank.forEach((x, k) => (pos[x.i] = k))
    return pos
  }, [])

  const inputRef = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])

  const pick = (i: number) => {
    setSample(i)
    setText(SAMPLES[i].draft)
  }

  const blur = (t: Tell) => {
    const s = blurSpan(text, t)
    if (s) setText(replaceSpan(text, s.start, s.end, s.replacement))
    else setText(replaceSpan(text, t.start, t.end, ''))
  }

  const blurAll = () => {
    let next = text
    // From the end, so earlier offsets stay valid.
    for (const t of [...ruleTells(next)].sort((a, b) => b.start - a.start)) {
      const s = blurSpan(next, t)
      next = s ? replaceSpan(next, s.start, s.end, s.replacement) : replaceSpan(next, t.start, t.end, '')
    }
    setText(next)
  }

  const send = () => {
    saveDraft(text)
    onStart()
  }

  // Nobody ducks for a moment each time the eye gets closer.
  const [flinch, setFlinch] = useState(false)
  const prev = useRef(n)
  useEffect(() => {
    if (n < prev.current) {
      setFlinch(true)
      const t = setTimeout(() => setFlinch(false), 380)
      prev.current = n
      return () => clearTimeout(t)
    }
    prev.current = n
  }, [n])

  return (
    <div className="hg">
      <div className="hg-card">
        <div className="hg-samples" role="group" aria-label="Sample posts">
          {SAMPLES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={sample === i}
              className={sample === i ? 'is-on' : undefined}
              onClick={() => pick(i)}
            >
              {s.title}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={sample === -1}
            className={sample === -1 ? 'is-on' : undefined}
            onClick={() => {
              setSample(-1)
              setText('')
              requestAnimationFrame(() => inputRef.current?.focus())
            }}
          >
            Write your own
          </button>
        </div>

        <div className="hg-editor">
          <div className="hg-back" aria-hidden="true">
            {segments(text, tells)}
          </div>
          <textarea
            ref={inputRef}
            className="hg-input"
            value={text}
            spellCheck={false}
            aria-label="Your post"
            placeholder="Write what you’d post on Reddit, Glassdoor or a staff forum…"
            onChange={(e) => {
              setText(e.target.value)
              if (sample !== -1 && e.target.value !== SAMPLES[sample].draft) setSample(-1)
            }}
          />
        </div>

        <div className="hg-tells">
          <div className="hg-tells-head">
            <span>
              {tells.length === 0 ? 'No giveaways found' : `${tells.length} ${tells.length === 1 ? 'giveaway' : 'giveaways'}`}
            </span>
            {tells.length > 1 ? (
              <button type="button" className="hg-link" onClick={blurAll}>
                Blur them all
              </button>
            ) : null}
          </div>
          <ul>
            {tells.map((t) => (
              <li key={`${t.start}-${t.text}`} className={`risk-${t.risk}`}>
                <span className="hg-quote">{t.text}</span>
                <span className="hg-kind">{TELL_KIND_LABEL[t.kind]}</span>
                <button type="button" onClick={() => blur(t)} aria-label={`Blur “${t.text}”`}>
                  Blur
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="hg-send">
          <button type="button" className="lp-btn lp-btn-gold" onClick={send} disabled={!text.trim()}>
            Send the real detective
          </button>
          <p>These are quick rules on your device. The real detective is a Gemini model, and it catches much more.</p>
        </div>
      </div>

      <div className={`hg-pen${found ? ' is-found' : ''}`} style={{ ['--n' as string]: n / PEN }}>
        <div className="hg-eye">
          <CyclopsEye />
        </div>
        <div className="hg-beam" aria-hidden="true" />
        <div className="hg-flock" role="img" aria-label={`${n} of ${PEN} sheep could still have written this post.`}>
          {order.map((k, i) => {
            const you = i === YOU
            const out = !you && k >= n - 1
            return (
              <span key={i} className={`hg-sheep${out ? ' is-out' : ''}${you ? ' is-you' : ''}${you && flinch ? ' is-flinch' : ''}`}>
                {you ? <Nobody look={{ x: 0.2, y: found ? 0.8 : -0.9 }} /> : <FlockSheep />}
                {out ? (
                  <svg className="hg-x" viewBox="0 0 40 40" aria-hidden="true">
                    <path pathLength={1} d="M9 10C17 17 24 25 32 31" />
                    <path pathLength={1} d="M31 9C24 17 16 24 8 32" />
                  </svg>
                ) : null}
              </span>
            )
          })}
        </div>
        <div className="hg-verdict" aria-live="polite">
          <p className="display hg-count">
            {n}
            <span> of {PEN}</span>
          </p>
          <div>
            <p className="hg-head">{v.head}</p>
            <p className="hg-body">{v.body}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function segments(text: string, tells: Tell[]) {
  const out: ReactNode[] = []
  let at = 0
  for (const t of [...tells].sort((a, b) => a.start - b.start)) {
    if (t.start < at) continue
    out.push(text.slice(at, t.start))
    out.push(
      <mark key={t.start} className={`risk-${t.risk}`}>
        {text.slice(t.start, t.end)}
      </mark>,
    )
    at = t.end
  }
  out.push(text.slice(at))
  // A trailing newline needs a character after it to take up a line.
  out.push('​')
  return out
}
