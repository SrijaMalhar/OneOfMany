// The detective's file on you: one tile per vault fact, then what it got
// right, what it narrowed down, and what it missed. Wrong guesses are never
// shown, so the tool can't be used to confirm a guess about somebody else.

import { useState } from 'react'
import type { Exposure, Fact, FactStatus } from '../engine/grade'
import { ATTRIBUTE_LABEL, type Attribute, type DetectiveGuess, type DetectiveReport, type Grade, type Verdict } from '../types'
import { SourceBadge } from './Badges'
import { SearchIcon } from './icons'
import { locate } from '../engine/tells'

export interface RunView {
  report: DetectiveReport
  grades: Grade[]
  exposure: Exposure
}

export interface Run extends RunView {
  id: number
  at: number
  draft: string
  fixesBefore: number
  history?: RunView & { posts: number }
}

const STATUS_TEXT: Record<FactStatus, string> = {
  recovered: 'Recovered',
  narrowed: 'Narrowed down',
  safe: 'Not recovered',
  empty: 'Not in vault',
}

export function FactTiles({ facts, blank }: { facts: Fact[]; blank?: boolean }) {
  return (
    <ol className={blank ? 'tiles is-blank' : 'tiles'} aria-label="Your facts">
      {facts.map((f, i) => (
        <li key={f.attribute} className={`tile tile-${blank ? 'unknown' : f.status}`} style={{ ['--i' as string]: i }}>
          <span className="tile-label">{ATTRIBUTE_LABEL[f.attribute]}</span>
          <span className="tile-status">{blank ? (f.status === 'empty' ? 'Not in vault' : 'Unknown') : STATUS_TEXT[f.status]}</span>
        </li>
      ))}
    </ol>
  )
}

export function MiniStrip({ facts }: { facts: Fact[] }) {
  return (
    <span className="mini" aria-hidden="true">
      {facts.map((f) => (
        <span key={f.attribute} className={`mini-cell tile-${f.status}`} />
      ))}
    </span>
  )
}

interface ReportProps {
  run: Run
  /** The current draft, to tell evidence in it apart from evidence in earlier posts. */
  draft: string
  graderLabel: string
  onEvidence: (quote: string) => void
  onOverride: (attribute: Attribute, verdict: Verdict, scope: 'alone' | 'history') => void
  onCoolDown: () => void
  coolingDisabled: boolean
}

export function Report({ run, draft, graderLabel, onEvidence, onOverride, onCoolDown, coolingDisabled }: ReportProps) {
  const [scope, setScope] = useState<'alone' | 'history'>('alone')
  const view: RunView = scope === 'history' && run.history ? run.history : run
  const e = view.exposure
  const guessFor = new Map(view.report.guesses.map((g) => [g.attribute, g]))
  const graded = new Map(view.grades.map((g) => [g.attribute, g]))
  const by = (s: FactStatus) => e.facts.filter((f) => f.status === s)
  const recovered = by('recovered')
  const narrowed = by('narrowed')
  const safe = by('safe')

  return (
    <article className="file" aria-labelledby="file-title">
      <header className="file-head">
        <h3 id="file-title" className="cloud-h3">
          The detective’s file on you
        </h3>
        <div className="file-badges">
          <SourceBadge source="in_cloud" label={`Guessed by ${view.report.model}, ${seconds(view.report.ms)}`} />
          <SourceBadge source={graderLabel === 'Gemini Nano' ? 'on_device' : 'rule'} label={`Checked by ${graderLabel} on this device`} />
        </div>
      </header>

      {run.history ? (
        <div className="scope" role="tablist" aria-label="Which text the detective read">
          <button type="button" role="tab" aria-selected={scope === 'alone'} onClick={() => setScope('alone')}>
            This post alone <b>{run.exposure.score}%</b>
          </button>
          <button type="button" role="tab" aria-selected={scope === 'history'} onClick={() => setScope('history')}>
            With {run.history.posts} earlier {run.history.posts === 1 ? 'post' : 'posts'} <b>{run.history.exposure.score}%</b>
          </button>
        </div>
      ) : null}

      <div className="verdict">
        <div className={`exposure exposure-${e.level}`}>
          <span className="exposure-n">{e.score}%</span>
          <span className="exposure-label">exposed</span>
        </div>
        <p className="verdict-text">
          {e.considered === 0
            ? 'Fill in your vault to see which guesses were right.'
            : `It recovered ${e.exposed} of your ${e.considered} facts${e.partial ? ` and narrowed down ${e.partial} more` : ''}.`}{' '}
          {view.report.crowdSize ? (
            <>
              Rough crowd you’d hide in: <strong>{view.report.crowdSize}</strong>
              <span className="muted"> (the detective’s own estimate)</span>.
            </>
          ) : null}
        </p>
      </div>

      <FactTiles facts={e.facts} />

      {recovered.length ? (
        <Group title="What it got right" facts={recovered} guessFor={guessFor} graded={graded} draft={draft} onEvidence={onEvidence} onOverride={(a, v) => onOverride(a, v, scope)} />
      ) : null}
      {narrowed.length ? (
        <Group title="What it narrowed down" facts={narrowed} guessFor={guessFor} graded={graded} draft={draft} onEvidence={onEvidence} onOverride={(a, v) => onOverride(a, v, scope)} />
      ) : null}
      {safe.length ? (
        <div className="missed">
          <h4 className="group-title">What it missed</h4>
          <p className="missed-list">
            {safe.map((f) => (
              <MissedChip key={f.attribute} attribute={f.attribute} tried={Boolean(guessFor.get(f.attribute) && guessFor.get(f.attribute)!.confidence > 0)} onOverride={(v) => onOverride(f.attribute, v, scope)} />
            ))}
          </p>
          <p className="muted small">Wrong guesses are never shown, so nobody can use this to confirm a guess about someone else.</p>
        </div>
      ) : null}

      {view.report.nextStep ? (
        <div className="next">
          <h4 className="group-title">What an investigator would check next</h4>
          <p>{view.report.nextStep}</p>
        </div>
      ) : null}

      <SearchTrail report={view.report} />

      <div className="file-cta">
        <button type="button" className="hot-btn" onClick={onCoolDown} disabled={coolingDisabled}>
          Cool down these giveaways
        </button>
        <span className="muted small">Rewrites are chosen from the detective’s evidence, never from your vault.</span>
      </div>
    </article>
  )
}

function Group({
  title,
  facts,
  guessFor,
  graded,
  draft,
  onEvidence,
  onOverride,
}: {
  title: string
  facts: Fact[]
  guessFor: Map<Attribute, DetectiveGuess>
  graded: Map<Attribute, Grade>
  draft: string
  onEvidence: (q: string) => void
  onOverride: (a: Attribute, v: Verdict) => void
}) {
  return (
    <div className="group">
      <h4 className="group-title">{title}</h4>
      <ul className="rows">
        {facts.map((f) => {
          const g = guessFor.get(f.attribute)
          const grade = graded.get(f.attribute)
          return (
            <li key={f.attribute} className={`row row-${f.status}`}>
              <div className="row-top">
                <span className="row-attr">{ATTRIBUTE_LABEL[f.attribute]}</span>
                <span className="row-guess">{g?.guess ?? '—'}</span>
                <span className="conf" title={`Detective’s confidence ${g?.confidence ?? 0}%`}>
                  <span className="conf-bar">
                    <span style={{ width: `${g?.confidence ?? 0}%` }} />
                  </span>
                  {g?.confidence ?? 0}%
                </span>
              </div>
              {g?.reasoning ? <p className="row-why">{g.reasoning}</p> : null}
              {g?.evidence.length ? (
                <p className="evidence">
                  <span className="muted">Gave it away:</span>
                  {g.evidence.map((q) =>
                    locate(draft, q) >= 0 ? (
                      <button key={q} type="button" className="quote" onClick={() => onEvidence(q)}>
                        {q}
                      </button>
                    ) : (
                      <span key={q} className="quote is-elsewhere" title="Not in your draft: from an earlier post, or already rewritten">
                        {q}
                      </span>
                    ),
                  )}
                </p>
              ) : null}
              <Override grade={grade} onOverride={(v) => onOverride(f.attribute, v)} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Override({ grade, onOverride }: { grade?: Grade; onOverride: (v: Verdict) => void }) {
  const [open, setOpen] = useState(false)
  const by = grade?.by === 'on_device' ? 'Gemini Nano' : grade?.by === 'you' ? 'you' : 'rules'
  return (
    <div className="override">
      <span className="muted small">Checked by {by} on this device.</span>
      {open ? (
        (
          [
            ['exact', 'Recovered'],
            ['close', 'Narrowed'],
            ['wrong', 'Missed'],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            className="seg"
            aria-pressed={grade?.verdict === v}
            onClick={() => {
              onOverride(v)
              setOpen(false)
            }}
          >
            {label}
          </button>
        ))
      ) : (
        <button type="button" className="link-btn small cloud-link" onClick={() => setOpen(true)}>
          Correct this
        </button>
      )}
    </div>
  )
}

function MissedChip({ attribute, tried, onOverride }: { attribute: Attribute; tried: boolean; onOverride: (v: Verdict) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="missed-chip">
      <button type="button" className="missed-name" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {ATTRIBUTE_LABEL[attribute]}
        <span className="muted"> {tried ? 'wrong guess' : 'no guess'}</span>
      </button>
      {open ? (
        <span className="missed-fix">
          It was actually
          <button type="button" className="seg" onClick={() => onOverride('exact')}>
            right
          </button>
          <button type="button" className="seg" onClick={() => onOverride('close')}>
            close
          </button>
        </span>
      ) : null}
    </span>
  )
}

function SearchTrail({ report }: { report: DetectiveReport }) {
  const found = report.searchQueries.length || report.sources.length || report.searchEntryPointHtml
  if (report.usedSearch && !found) {
    return (
      <p className="trail-note muted small">
        <SearchIcon /> Web search was available, but the detective didn’t need it for this post.
      </p>
    )
  }
  if (!report.usedSearch) {
    return (
      <p className="trail-note muted small">
        <SearchIcon /> This run worked from the text alone. Live web search needs the Firebase Blaze plan, which this deployment
        doesn’t use, so a real investigator with a search engine could do better.
      </p>
    )
  }
  return (
    <div className="trail">
      <h4 className="group-title">
        <SearchIcon /> What it searched
      </h4>
      {report.searchQueries.length ? (
        <ul className="queries">
          {report.searchQueries.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      ) : null}
      {report.sources.length ? (
        <ul className="sources">
          {report.sources.map((s) => (
            <li key={s.uri}>
              <a href={s.uri} target="_blank" rel="noreferrer noopener">
                {s.title || new URL(s.uri).hostname}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {report.searchEntryPointHtml ? (
        <iframe className="entry-point" title="Google Search suggestions" sandbox="allow-popups allow-popups-to-escape-sandbox" srcDoc={report.searchEntryPointHtml} />
      ) : null}
    </div>
  )
}

export function Runs({ runs }: { runs: Run[] }) {
  if (runs.length < 2) return null
  const first = runs[0].exposure.score
  return (
    <section className="runs" aria-labelledby="runs-title">
      <h3 id="runs-title" className="cloud-h3 small-h3">
        Every run
      </h3>
      <ol className="run-list">
        {runs.map((r, i) => (
          <li key={r.id} className="run">
            <span className="run-name">
              Run {i + 1}
              <span className="muted small">{i === 0 ? 'original draft' : r.fixesBefore ? `after ${r.fixesBefore} rewrites` : 'edited draft'}</span>
            </span>
            <MiniStrip facts={r.exposure.facts} />
            <span className="run-bar" aria-hidden="true">
              <span className={`exposure-${r.exposure.level}`} style={{ width: `${Math.max(2, r.exposure.score)}%` }} />
            </span>
            <span className="run-score">{r.exposure.score}%</span>
          </li>
        ))}
      </ol>
      {runs[runs.length - 1].exposure.score < first ? (
        <p className="muted small">
          Exposure went from {first}% to {runs[runs.length - 1].exposure.score}%. One run is one sample, so results vary a little each
          time.
        </p>
      ) : (
        <p className="muted small">One run is one sample, so results vary a little each time.</p>
      )}
    </section>
  )
}

function seconds(ms: number) {
  return `${Math.max(1, Math.round(ms / 1000))} s`
}
