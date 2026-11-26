// The detective's case file on you. One typed line per fact, stamped Found,
// Close or Missed. Wrong guesses sit under a redaction bar: they're never
// shown, so the tool can't be used to confirm a guess about somebody else.

import { useState } from 'react'
import type { Exposure, Fact, FactStatus } from '../engine/grade'
import { locate } from '../engine/tells'
import { ATTRIBUTE_LABEL, type Attribute, type DetectiveGuess, type DetectiveReport, type Grade, type Verdict } from '../types'
import { SourceBadge } from './Badges'
import { SearchIcon } from './icons'
import { Crowd } from './Nobody'

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

const STAMP: Record<FactStatus, string> = {
  recovered: 'Found',
  narrowed: 'Close',
  safe: 'Missed',
  empty: '',
}

interface DossierProps {
  facts: Fact[]
  blank?: boolean
  guessFor?: Map<Attribute, DetectiveGuess>
  graded?: Map<Attribute, Grade>
  draft?: string
  onHover?: (a: Attribute | null) => void
  onEvidence?: (q: string) => void
  onOverride?: (a: Attribute, v: Verdict) => void
}

export function Dossier({ facts, blank, guessFor, graded, draft = '', onHover, onEvidence, onOverride }: DossierProps) {
  const [open, setOpen] = useState<Attribute | null>(null)
  return (
    <ol className={blank ? 'dossier is-blank' : 'dossier'} aria-label="Your facts">
      {facts.map((f, i) => {
        const g = guessFor?.get(f.attribute)
        const isOpen = open === f.attribute
        const hit = f.status === 'recovered' || f.status === 'narrowed'
        const status = blank ? (f.status === 'empty' ? 'empty' : 'unknown') : f.status
        return (
          <li
            key={f.attribute}
            className={`dz-row dz-${status}${isOpen ? ' is-open' : ''}`}
            style={{ ['--i' as string]: i }}
            data-attr={blank ? undefined : f.attribute}
            onMouseEnter={onHover ? () => onHover(f.attribute) : undefined}
            onMouseLeave={onHover ? () => onHover(null) : undefined}
          >
            <button
              type="button"
              className="dz-line"
              onClick={() => setOpen(isOpen ? null : f.attribute)}
              disabled={blank || f.status === 'empty'}
              aria-expanded={blank ? undefined : isOpen}
            >
              <span className="dz-label">{ATTRIBUTE_LABEL[f.attribute]}</span>
              <span className="dz-value">
                {blank ? (
                  f.status === 'empty' ? (
                    <span className="dz-muted">Not in your vault</span>
                  ) : (
                    <span className="dz-blank" aria-label="Unknown" />
                  )
                ) : hit ? (
                  <>
                    {g?.guess}
                    <span className="dz-conf" title={`Detective’s confidence ${g?.confidence ?? 0}%`}>
                      {g?.confidence ?? 0}% sure
                    </span>
                  </>
                ) : f.status === 'safe' ? (
                  g && g.confidence > 0 ? (
                    <span className="redacted" title="A wrong guess, hidden on purpose">
                      wrong guess
                    </span>
                  ) : (
                    <span className="dz-muted">No guess</span>
                  )
                ) : (
                  <span className="dz-muted">Not in your vault</span>
                )}
              </span>
              {!blank && STAMP[f.status] ? <span className={`stamp stamp-${f.status}`}>{STAMP[f.status]}</span> : null}
            </button>
            {isOpen && !blank ? (
              <Details fact={f} guess={g} grade={graded?.get(f.attribute)} draft={draft} onEvidence={onEvidence} onOverride={onOverride} />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

function Details({
  fact,
  guess,
  grade,
  draft,
  onEvidence,
  onOverride,
}: {
  fact: Fact
  guess?: DetectiveGuess
  grade?: Grade
  draft: string
  onEvidence?: (q: string) => void
  onOverride?: (a: Attribute, v: Verdict) => void
}) {
  const hit = fact.status === 'recovered' || fact.status === 'narrowed'
  const by = grade?.by === 'on_device' ? 'Gemini Nano' : grade?.by === 'you' ? 'you' : 'rules'
  return (
    <div className="dz-details">
      {hit && guess?.reasoning ? <p className="dz-why">{guess.reasoning}</p> : null}
      {!hit ? (
        <p className="dz-why">
          {guess && guess.confidence > 0
            ? 'It guessed, and got it wrong. Wrong guesses are never shown, so nobody can use this to confirm a guess about someone else.'
            : 'It didn’t find enough in your post to guess.'}
        </p>
      ) : null}
      {hit && guess?.evidence.length ? (
        <p className="evidence">
          <span className="muted">Gave it away:</span>
          {guess.evidence.map((q) =>
            locate(draft, q) >= 0 ? (
              <button key={q} type="button" className="quote" onClick={() => onEvidence?.(q)}>
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
      <div className="override">
        <span className="muted small">Checked by {by} on this device. Not right? Mark it as</span>
        {(
          [
            ['exact', 'Found'],
            ['close', 'Close'],
            ['wrong', 'Missed'],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            className="seg"
            aria-pressed={grade?.by === 'you' && grade.verdict === v}
            onClick={() => onOverride?.(fact.attribute, v)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function MiniStrip({ facts }: { facts: Fact[] }) {
  return (
    <span className="mini" aria-hidden="true">
      {facts.map((f) => (
        <span key={f.attribute} className={`mini-cell mini-${f.status}`} />
      ))}
    </span>
  )
}

interface ReportProps {
  run: Run
  scope: 'alone' | 'history'
  onScope: (s: 'alone' | 'history') => void
  onHoverFact: (a: Attribute | null) => void
  /** The current draft, to tell evidence in it apart from evidence in earlier posts. */
  draft: string
  graderLabel: string
  onEvidence: (quote: string) => void
  onOverride: (attribute: Attribute, verdict: Verdict, scope: 'alone' | 'history') => void
  onCoolDown: () => void
  coolingDisabled: boolean
}

export function Report({ run, scope, onScope, onHoverFact, draft, graderLabel, onEvidence, onOverride, onCoolDown, coolingDisabled }: ReportProps) {
  const view: RunView = scope === 'history' && run.history ? run.history : run
  const e = view.exposure
  const guessFor = new Map(view.report.guesses.map((g) => [g.attribute, g]))
  const graded = new Map(view.grades.map((g) => [g.attribute, g]))

  return (
    <article className="file" aria-labelledby="file-title">
      <span className="file-tab" aria-hidden="true">
        Case file: Nobody
      </span>
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
          <button type="button" role="tab" aria-selected={scope === 'alone'} onClick={() => onScope('alone')}>
            This post alone <b>{run.exposure.score}%</b>
          </button>
          <button type="button" role="tab" aria-selected={scope === 'history'} onClick={() => onScope('history')}>
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
              Its guess at the crowd you’d hide in: <strong>{view.report.crowdSize}</strong>.
            </>
          ) : null}
        </p>
      </div>

      <Dossier
        facts={e.facts}
        guessFor={guessFor}
        graded={graded}
        draft={draft}
        onHover={onHoverFact}
        onEvidence={onEvidence}
        onOverride={(a, v) => onOverride(a, v, scope)}
      />
      <p className="muted small dz-hint">Select a line to see why, what gave it away, or to correct it.</p>

      <Crowd recovered={e.exposed} narrowed={e.partial} />

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
        <iframe
          className="entry-point"
          title="Google Search suggestions"
          sandbox="allow-popups allow-popups-to-escape-sandbox"
          srcDoc={report.searchEntryPointHtml}
        />
      ) : null}
    </div>
  )
}

export function Runs({ runs }: { runs: Run[] }) {
  if (runs.length < 2) return null
  const first = runs[0].exposure.score
  const last = runs[runs.length - 1].exposure.score
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
              <span className="muted small">{i === 0 ? 'original draft' : r.fixesBefore ? `after ${r.fixesBefore} ${r.fixesBefore === 1 ? 'rewrite' : 'rewrites'}` : 'edited draft'}</span>
            </span>
            <MiniStrip facts={r.exposure.facts} />
            <span className="run-bar" aria-hidden="true">
              <span className={`exposure-${r.exposure.level}`} style={{ width: `${Math.max(2, r.exposure.score)}%` }} />
            </span>
            <span className="run-score">{r.exposure.score}%</span>
          </li>
        ))}
      </ol>
      <p className="muted small">
        {last < first ? `Exposure went from ${first}% to ${last}%. ` : ''}One run is one sample, so results vary a little each time.
      </p>
    </section>
  )
}

function seconds(ms: number) {
  return `${Math.max(1, Math.round(ms / 1000))} s`
}
