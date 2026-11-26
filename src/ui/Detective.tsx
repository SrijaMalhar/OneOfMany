// The cloud side's controls: what will cross the line, the own-draft
// confirmation, and the button that sends the detective.

import { useEffect, useState } from 'react'
import type { Fact } from '../engine/grade'
import { FactTiles } from './Report'

export type DetectiveState =
  | { status: 'idle' }
  | { status: 'running'; startedAt: number; phase: 'detective' | 'history' | 'grading' }
  | { status: 'error'; error: string }

interface Props {
  state: DetectiveState
  words: number
  vaultFacts: number
  earlierPosts: number
  confirmed: boolean
  /** A sample story has a fictional author, so there is nobody real to identify. */
  sample: boolean
  onConfirm: (v: boolean) => void
  onSend: () => void
  blocker: string | null
  hasRuns: boolean
  blankFacts: Fact[]
}

const PHASE_TEXT = {
  detective: 'The detective is reading your post',
  history: 'Now reading it with your earlier posts',
  grading: 'Checking the guesses on this device',
}

export function Detective({ state, words, vaultFacts, earlierPosts, confirmed, sample, onConfirm, onSend, blocker, hasRuns, blankFacts }: Props) {
  const running = state.status === 'running'
  return (
    <section className="detective" aria-labelledby="detective-title">
      <h2 id="detective-title" className="cloud-h2">
        The detective
      </h2>
      <p className="cloud-lede">
        A Gemini model reads only your post, the way a stranger would, and tries to work out who wrote it. It never sees your
        vault, so it has to earn every guess.
      </p>

      <dl className="crossing">
        <div>
          <dt>Crosses the line</dt>
          <dd>
            Your post, {words} {words === 1 ? 'word' : 'words'}
            {earlierPosts ? `, plus ${earlierPosts} earlier ${earlierPosts === 1 ? 'post' : 'posts'}` : ''}
          </dd>
        </div>
        <div>
          <dt>Stays on your device</dt>
          <dd>
            Your vault, {vaultFacts} {vaultFacts === 1 ? 'fact' : 'facts'}
          </dd>
        </div>
      </dl>

      {sample ? (
        <p className="confirm is-sample">This is a sample story about a fictional person, so there’s nobody real to identify.</p>
      ) : (
        <label className="confirm">
          <input type="checkbox" checked={confirmed} onChange={(e) => onConfirm(e.target.checked)} />
          <span>This is my own draft, and I’m checking it before I post it.</span>
        </label>
      )}

      <div className="send-row">
        <button type="button" className="send-btn" onClick={onSend} disabled={running || !confirmed || Boolean(blocker)}>
          {running ? <Elapsed since={state.startedAt} label={PHASE_TEXT[state.phase]} /> : hasRuns ? 'Send the detective again' : 'Send the detective'}
        </button>
        {blocker && !running ? <p className="send-hint">{blocker}</p> : null}
        {!blocker && !confirmed && !running ? <p className="send-hint">Tick the box above to continue.</p> : null}
      </div>

      {state.status === 'error' ? (
        <p className="error" role="alert">
          {state.error}
        </p>
      ) : null}

      {!hasRuns ? (
        <div className="blank-file" aria-label="The detective’s file, still empty">
          <h3 className="cloud-h3">The detective’s file on you</h3>
          <p className="muted">
            {vaultFacts
              ? 'Empty for now. Send the detective to see which of these it can work out from your words alone.'
              : 'Empty for now. Fill in your vault on the left, so your device can check which guesses are right.'}
          </p>
          <FactTiles facts={blankFacts} blank />
        </div>
      ) : null}
    </section>
  )
}

function Elapsed({ since, label }: { since: number; label: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="elapsed">
      <span className="spinner" aria-hidden="true" />
      {label}
      <span className="elapsed-s">{Math.floor((now - since) / 1000)} s</span>
    </span>
  )
}
