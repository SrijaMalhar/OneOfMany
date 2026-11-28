// The cloud side's controls: what will cross the line, the own-draft
// confirmation, and the button that sends the detective.

import { useEffect, useState } from 'react'
import type { Fact } from '../engine/grade'
import { CyclopsEye, Nobody } from '../landing/art'
import { ArrowUpRightIcon, InfoIcon, LockIcon } from './icons'
import { Dossier } from './Report'

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
  detective: 'Reading your post',
  history: 'Reading it with your earlier posts',
  grading: 'Checking guesses on this device',
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

export function Detective({ state, words, vaultFacts, earlierPosts, confirmed, sample, onConfirm, onSend, blocker, hasRuns, blankFacts }: Props) {
  const running = state.status === 'running'
  return (
    <section className="section" aria-labelledby="detective-title">
      <div className="intro">
        <h2 id="detective-title" className="title">
          Send a detective after it
        </h2>
        <p className="lede">
          A Gemini model in the cloud reads only your post, the way a stranger would, and tries to work out who wrote it. It
          never sees your vault, so it has to earn every guess.
        </p>
      </div>

      <dl className="crossing">
        <div className="crossing-out">
          <ArrowUpRightIcon />
          <dt>Sent to the cloud</dt>
          <dd>
            Your post, {words} {words === 1 ? 'word' : 'words'}
            {earlierPosts ? `, and ${earlierPosts} earlier ${earlierPosts === 1 ? 'post' : 'posts'}` : ''}
          </dd>
        </div>
        <div className="crossing-kept">
          <LockIcon />
          <dt>Stays on this device</dt>
          <dd>
            Your vault, {vaultFacts} {vaultFacts === 1 ? 'fact' : 'facts'}
          </dd>
        </div>
      </dl>

      {sample ? (
        <p className="confirm is-sample">
          <InfoIcon />
          This is a sample story about a fictional person, so there’s nobody real to identify.
        </p>
      ) : (
        <label className="confirm">
          <input type="checkbox" checked={confirmed} onChange={(e) => onConfirm(e.target.checked)} />
          <span>This is my own draft, and I’m checking it before I post it.</span>
        </label>
      )}

      <div className="send">
        <button
          type="button"
          className="btn btn-gold btn-lg btn-block"
          onClick={onSend}
          disabled={running || !confirmed || Boolean(blocker)}
          aria-busy={running || undefined}
        >
          {running ? (
            <Elapsed since={state.startedAt} label={PHASE_TEXT[state.phase]} />
          ) : (
            <>
              {hasRuns ? 'Send the detective again' : 'Send the detective'}
              <span className="kbd-group" aria-hidden="true">
                <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd>
                <kbd>↵</kbd>
              </span>
            </>
          )}
        </button>
        {blocker && !running ? <p className="send-hint">{blocker}</p> : null}
        {!blocker && !confirmed && !running ? <p className="send-hint">Tick the box above to continue.</p> : null}
      </div>

      {running ? (
        <div className="cy-watch" aria-hidden="true">
          <span className="cy-watch-eye">
            <CyclopsEye />
          </span>
          <span>The Cyclops is reading your words. It never sees your vault.</span>
        </div>
      ) : null}

      {state.status === 'error' ? (
        <p className="callout callout-bad" role="alert">
          {state.error}
        </p>
      ) : null}

      {!hasRuns ? (
        <div className="section" aria-label="The detective’s file, still empty">
          <div className="section-head">
            <h3 className="section-title">The detective’s file on you</h3>
            <span className="small muted">{running ? 'Investigating' : 'Empty'}</span>
          </div>
          <p className="section-sub">
            {vaultFacts
              ? 'Each line is a fact about you. Send the detective to see which ones it can work out from your words alone.'
              : 'Fill in your vault on the left, so your device can check which guesses are right.'}
          </p>
          <div className={`peek${running ? ' is-hiding' : ''}`}>
            <Nobody className="peek-nobody" look={{ x: -0.7, y: -0.9 }} />
            <Dossier facts={blankFacts} blank running={running} />
          </div>
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
