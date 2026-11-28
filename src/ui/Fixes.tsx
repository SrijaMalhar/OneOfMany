// Suggested rewrites for the giveaways, shown as a diff you can pick from,
// then a check that the post still says what the author meant.

import type { Fix, MeaningCheck, Source } from '../types'
import { SourceBadge } from './Badges'
import { CloseIcon, CopyIcon } from './icons'

export type FixState =
  | { status: 'loading' }
  | { status: 'ready'; fixes: Fix[]; source: Source }
  | { status: 'applied'; count: number; source: Source }
  | { status: 'error'; error: string }

export type MeaningState = { status: 'loading' } | { status: 'ready'; result: MeaningCheck } | null

interface Props {
  state: FixState
  meaning: MeaningState
  onToggle: (index: number) => void
  onApply: () => void
  onCopy: () => void
  copied: boolean
  onRetest: () => void
  onRetry: () => void
  onClose: () => void
}

export function Fixes({ state, meaning, onToggle, onApply, onCopy, copied, onRetest, onRetry, onClose }: Props) {
  const chosen = state.status === 'ready' ? state.fixes.filter((f) => f.accepted).length : 0
  return (
    <section className="section" aria-labelledby="fixes-title" id="fixes">
      <div className="section-head">
        <h2 id="fixes-title" className="section-title">
          Suggested rewrites
        </h2>
        <span className="actions">
          {state.status === 'ready' || state.status === 'applied' ? <SourceBadge source={state.source} label={rewriteLabel(state.source)} /> : null}
          <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={onClose} aria-label="Close rewrites" data-tip="Close" data-tip-align="end">
            <CloseIcon />
          </button>
        </span>
      </div>

      {state.status === 'loading' ? <p className="note pulse">Writing vaguer versions of each giveaway…</p> : null}

      {state.status === 'error' ? (
        <p className="callout callout-bad" role="alert">
          <span>
            Couldn’t suggest rewrites: {state.error}{' '}
            <button type="button" className="link" onClick={onRetry}>
              Try again
            </button>
          </span>
        </p>
      ) : null}

      {state.status === 'ready' ? (
        state.fixes.length ? (
          <>
            <ul className="list">
              {state.fixes.map((f, i) => (
                <li key={f.original}>
                  <label className={f.accepted ? 'fix is-on' : 'fix'}>
                    <input type="checkbox" checked={f.accepted} onChange={() => onToggle(i)} />
                    <span className="fix-body">
                      <span className="fix-pair">
                        <del className="fix-old">{f.original}</del>
                        <span className="fix-to" aria-label="to">
                          →
                        </span>
                        <ins className={f.replacement ? 'fix-new' : 'fix-new is-removal'}>{f.replacement || 'removed'}</ins>
                      </span>
                      {f.reason ? <span className="fix-why">{f.reason}</span> : null}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="actions">
              <button type="button" className="btn btn-primary" onClick={onApply} disabled={!chosen}>
                Apply {chosen} {chosen === 1 ? 'change' : 'changes'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Not now
              </button>
            </div>
          </>
        ) : (
          <p className="note">Nothing left to rewrite. The detective’s evidence is gone from the draft.</p>
        )
      ) : null}

      {state.status === 'applied' ? (
        <>
          <p className="note">
            Applied {state.count} {state.count === 1 ? 'change' : 'changes'} to your draft.
          </p>
          {meaning ? <Meaning meaning={meaning} /> : null}
          <div className="actions">
            <button type="button" className="btn btn-primary" onClick={onRetest}>
              Send the detective again
            </button>
            <button type="button" className="btn" onClick={onCopy}>
              <CopyIcon />
              {copied ? 'Copied' : 'Copy post'}
            </button>
          </div>
        </>
      ) : null}
    </section>
  )
}

function rewriteLabel(source: Source) {
  return source === 'on_device' ? 'Rewritten on this device' : 'Rewritten in the cloud, without your vault'
}

function Meaning({ meaning }: { meaning: NonNullable<MeaningState> }) {
  if (meaning.status === 'loading') return <p className="note pulse">Checking the rewrite still says what you meant…</p>
  const m = meaning.result
  const level = m.score >= 85 ? 'kept' : m.score >= 65 ? 'mostly' : 'lost'
  return (
    <div className={`panel meaning meaning-${level}`}>
      <div className="meaning-top">
        <span className="meaning-label">Meaning kept</span>
        <span className="meaning-score">{m.score}%</span>
        <SourceBadge source={m.by === 'on_device' ? 'on_device' : 'rule'} label={m.by === 'on_device' ? 'Checked by Gemini Nano' : 'Checked by rules on this device'} />
      </div>
      <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={m.score} aria-label="Meaning kept">
        <span style={{ width: `${m.score}%` }} />
      </div>
      <p className="meaning-verdict">{m.verdict}</p>
      {m.lost.length ? (
        <p className="small muted">
          Possibly lost:{' '}
          {m.lost.map((w) => (
            <span key={w} className="lost-word">
              {w}
            </span>
          ))}
        </p>
      ) : null}
    </div>
  )
}
