// "Cool it down": suggested rewrites for the giveaways, then a check that the
// post still says what the author meant.

import type { Fix, MeaningCheck, Source } from '../types'
import { SourceBadge } from './Badges'
import { CopyIcon } from './icons'

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
  return (
    <section className="fixes" aria-labelledby="fixes-title" id="fixes">
      <header className="fixes-head">
        <h3 id="fixes-title" className="dev-h3">
          Cool it down
        </h3>
        {state.status === 'ready' || state.status === 'applied' ? <SourceBadge source={state.source} label={rewriteLabel(state.source)} /> : null}
      </header>

      {state.status === 'loading' ? <p className="fixes-note pulse">Writing vaguer versions of each giveaway…</p> : null}

      {state.status === 'error' ? (
        <p className="fixes-note">
          Couldn’t suggest rewrites: {state.error}{' '}
          <button type="button" className="link-btn dev-link" onClick={onRetry}>
            Try again
          </button>
        </p>
      ) : null}

      {state.status === 'ready' ? (
        state.fixes.length ? (
          <>
            <ul className="fix-list">
              {state.fixes.map((f, i) => (
                <li key={f.original}>
                  <label className={f.accepted ? 'fix is-on' : 'fix'}>
                    <input type="checkbox" checked={f.accepted} onChange={() => onToggle(i)} />
                    <span className="fix-body">
                      <span className="fix-pair">
                        <del className="fix-old">{f.original}</del>
                        <span className="fix-arrow" aria-hidden="true" />
                        <ins className="fix-new">{f.replacement || 'remove it'}</ins>
                      </span>
                      {f.reason ? <span className="fix-why">{f.reason}</span> : null}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="fix-actions">
              <button type="button" className="cool-btn" onClick={onApply} disabled={!state.fixes.some((f) => f.accepted)}>
                Apply {state.fixes.filter((f) => f.accepted).length} changes
              </button>
              <button type="button" className="ghost-btn" onClick={onClose}>
                Not now
              </button>
            </div>
          </>
        ) : (
          <p className="fixes-note">Nothing left to rewrite. The detective’s evidence is gone from the draft.</p>
        )
      ) : null}

      {state.status === 'applied' ? (
        <div className="applied">
          <p className="fixes-note">
            Applied {state.count} {state.count === 1 ? 'change' : 'changes'}. Watch the draft cool down above.
          </p>
          {meaning ? <Meaning meaning={meaning} /> : null}
          <div className="fix-actions">
            <button type="button" className="cool-btn" onClick={onRetest}>
              Send the detective again
            </button>
            <button type="button" className="ghost-btn" onClick={onCopy}>
              <CopyIcon />
              {copied ? 'Copied' : 'Copy post'}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function rewriteLabel(source: Source) {
  return source === 'on_device' ? 'Rewritten on this device' : 'Rewritten in the cloud, without your vault'
}

function Meaning({ meaning }: { meaning: NonNullable<MeaningState> }) {
  if (meaning.status === 'loading') return <p className="fixes-note pulse">Checking the rewrite still says what you meant…</p>
  const m = meaning.result
  const level = m.score >= 85 ? 'kept' : m.score >= 65 ? 'mostly' : 'lost'
  return (
    <div className={`meaning meaning-${level}`}>
      <div className="meaning-top">
        <span className="meaning-label">Meaning kept</span>
        <span className="meaning-score">{m.score}%</span>
        <SourceBadge source={m.by === 'on_device' ? 'on_device' : 'rule'} label={m.by === 'on_device' ? 'Checked by Gemini Nano' : 'Checked by rules on this device'} />
      </div>
      <div className="meaning-bar" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={m.score} aria-label="Meaning kept">
        <span style={{ width: `${m.score}%` }} />
      </div>
      <p className="meaning-verdict">{m.verdict}</p>
      {m.lost.length ? (
        <p className="meaning-lost">
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
