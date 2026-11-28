// The suspect pool, pinned to the top of the case file. The Cyclops's eye
// hangs over a flock of thirty, and every giveaway crosses some of them out
// in red pencil, live, as you type. Once the detective has run, the pool
// follows what it actually worked out instead.
//
// The eye has moods: it looks across at your notebook while you type, reads
// back and forth while the detective works, fixes on Nobody when only one
// sheep is left, and gets drowsy when there's nothing to find.

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { Exposure } from '../engine/grade'
import { CyclopsEye, FlockSheep, Nobody } from '../landing/art'
import { leavingOrder, NOBODY_AT, POOL, poolVerdict, suspectPool } from './flock'
import type { HeatTell } from './heat'
import { SheepDefs } from './Sheep'

type Mood = 'idle' | 'watching' | 'reading' | 'found' | 'drowsy'

interface Props {
  draft: string
  tells: HeatTell[]
  /** The latest run's exposure, while the draft still matches it. */
  current: Exposure | null
  running: boolean
}

export function SuspectPool({ draft, tells, current, running }: Props) {
  const pool = suspectPool(draft, tells, current)
  const verdict = poolVerdict(pool)
  const order = useMemo(() => leavingOrder(), [])

  // "Typing" lasts a moment after each change to the draft.
  const [typing, setTyping] = useState(false)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setTyping(true)
    const t = setTimeout(() => setTyping(false), 1400)
    return () => clearTimeout(t)
  }, [draft])

  // Nobody flinches each time the pool gets smaller.
  const [flinch, setFlinch] = useState(false)
  const prev = useRef(pool.left)
  useEffect(() => {
    const before = prev.current
    prev.current = pool.left
    if (pool.left >= before) return
    setFlinch(true)
    const t = setTimeout(() => setFlinch(false), 380)
    return () => clearTimeout(t)
  }, [pool.left])

  const found = pool.left === 1
  const mood: Mood = running
    ? 'reading'
    : typing
      ? 'watching'
      : found
        ? 'found'
        : pool.basis !== 'empty' && pool.left >= POOL * 0.8
          ? 'drowsy'
          : 'idle'

  const source =
    pool.basis === 'detective'
      ? `From the detective’s file: ${pool.clues} ${pool.clues === 1 ? 'fact' : 'facts'} worked out`
      : pool.basis === 'giveaways'
        ? `Live, from ${pool.clues} ${pool.clues === 1 ? 'giveaway' : 'giveaways'} on this device`
        : 'Waiting for a draft'

  return (
    <section
      className={`pool mood-${mood}${found ? ' is-found' : ''}`}
      style={{ ['--n' as string]: pool.left / POOL } as CSSProperties}
      aria-labelledby="pool-title"
    >
      <SheepDefs />
      <header className="pool-head">
        <h2 id="pool-title" className="pool-title">
          Suspect pool
        </h2>
        <span className="pool-source" data-tip="A picture of the idea, not a head count: each detail keeps only part of the flock." data-tip-align="end">
          {source}
        </span>
      </header>

      <div className="pool-stage">
        <div className="pool-eye" aria-hidden="true">
          <CyclopsEye />
        </div>
        <div className="pool-beam" aria-hidden="true" />
        <div className="pool-flock" role="img" aria-label={`${pool.left} of ${POOL} sheep could still have written this post.`}>
          {order.map((rank, i) => {
            const you = i === NOBODY_AT
            const out = !you && rank >= pool.left - 1
            return (
              <span key={i} className={`pool-sheep${out ? ' is-out' : ''}${you ? ' is-you' : ''}${you && flinch ? ' is-flinch' : ''}`}>
                {you ? <Nobody look={{ x: -0.2, y: found ? 0.9 : running ? -1 : -0.6 }} /> : <FlockSheep />}
                {out ? (
                  <svg className="pool-x" viewBox="0 0 40 40" aria-hidden="true">
                    <path pathLength={1} d="M9 10C17 17 24 25 32 31" />
                    <path pathLength={1} d="M31 9C24 17 16 24 8 32" />
                  </svg>
                ) : null}
              </span>
            )
          })}
        </div>
      </div>

      <footer className="pool-foot" aria-live="polite">
        <p className="pool-count">
          {pool.left}
          <span> of {POOL}</span>
        </p>
        <div>
          <p className="pool-head-line">{verdict.head}</p>
          <p className="pool-body">{verdict.body}</p>
        </div>
      </footer>
    </section>
  )
}
