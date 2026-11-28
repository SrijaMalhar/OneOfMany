// The detective's file on you. One row per fact, marked Found, Close or
// Missed. Unknown values and wrong guesses sit under a redaction bar: wrong
// guesses are never shown, so the tool can't confirm a guess about somebody
// else.

import { useEffect, useState } from 'react'
import type { Exposure, Fact, FactStatus } from '../engine/grade'
import { locate } from '../engine/tells'
import { ATTRIBUTE_LABEL, type Attribute, type DetectiveGuess, type DetectiveReport, type Grade, type Verdict } from '../types'
import { SourceBadge } from './Badges'
import { SearchIcon } from './icons'

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

// The file opens like a decoded document: each row starts under a redaction
// bar, the guess resolves letter by letter, then the result is stamped. It
// runs once, when a new run arrives, and not at all with reduced motion.
const REVEAL_START = 180
const ROW_MS = 150
const DECODE_MS = 420
const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'

function revealTotal(rows: number) {
  return REVEAL_START + rows * ROW_MS + DECODE_MS
}

function useTimeline(total: number): number {
  const [t, setT] = useState(() => (matchMedia('(prefers-reduced-motion: reduce)').matches ? Infinity : 0))
  useEffect(() => {
    if (t === Infinity) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      if (elapsed >= total) return setT(Infinity)
      setT(elapsed)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    // A background tab may never paint; don't leave the file under bars.
    const fallback = setTimeout(() => setT(Infinity), total + 600)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(fallback)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return t
}

function rowPhase(t: number, i: number): 'hidden' | 'decoding' | 'shown' {
  const start = REVEAL_START + i * ROW_MS
  if (t >= start + DECODE_MS) return 'shown'
  return t >= start ? 'decoding' : 'hidden'
}

function decode(text: string, progress: number) {
  const locked = Math.floor(text.length * progress)
  let out = text.slice(0, locked)
  for (let k = locked; k < text.length; k++) {
    out += /\s/.test(text[k]) ? text[k] : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
  }
  return out
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
  /** The detective is working: blank rows shimmer. */
  running?: boolean
  guessFor?: Map<Attribute, DetectiveGuess>
  graded?: Map<Attribute, Grade>
  draft?: string
  onHover?: (a: Attribute | null) => void
  onEvidence?: (q: string) => void
  onOverride?: (a: Attribute, v: Verdict) => void
  /** Milliseconds into the opening reveal; Infinity once it's over. */
  reveal?: number
}

export function Dossier({ facts, blank, running, guessFor, graded, draft = '', onHover, onEvidence, onOverride, reveal = Infinity }: DossierProps) {
  const [open, setOpen] = useState<Attribute | null>(null)
  const revealing = reveal !== Infinity
  return (
    <ol
      className={`dossier${blank ? ' is-blank' : ''}${running ? ' is-running' : ''}`}
      aria-label="Your facts"
      aria-busy={running || revealing || undefined}
    >
      {facts.map((f, i) => {
        const g = guessFor?.get(f.attribute)
        const isOpen = open === f.attribute
        const hit = f.status === 'recovered' || f.status === 'narrowed'
        const phase = blank ? 'shown' : rowPhase(reveal, i)
        const status = blank || phase === 'hidden' ? (f.status === 'empty' ? 'empty' : 'unknown') : f.status
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
                {blank || phase === 'hidden' ? (
                  f.status === 'empty' ? (
                    <span className="dz-muted">Not in your vault</span>
                  ) : (
                    <span className="dz-blank" aria-label="Unknown" />
                  )
                ) : hit && phase === 'decoding' ? (
                  <span className="dz-guess is-decoding" aria-label={g?.guess}>
                    {decode(g?.guess ?? '', (reveal - REVEAL_START - i * ROW_MS) / DECODE_MS)}
                  </span>
                ) : hit ? (
                  <>
                    <span className="dz-guess">{g?.guess}</span>
                    <span className="dz-conf" data-tip="The detective’s own confidence">
                      {g?.confidence ?? 0}%
                    </span>
                  </>
                ) : f.status === 'safe' ? (
                  g && g.confidence > 0 ? (
                    <span className="redacted" data-tip="A wrong guess, hidden on purpose">
                      wrong guess
                    </span>
                  ) : (
                    <span className="dz-muted">No guess</span>
                  )
                ) : (
                  <span className="dz-muted">Not in your vault</span>
                )}
              </span>
              {!blank && phase === 'shown' && STAMP[f.status] ? (
                <span className={`result result-${f.status}${revealing ? ' is-stamping' : ''}`}>{STAMP[f.status]}</span>
              ) : (
                <span />
              )}
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
          <span>Gave it away:</span>
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
        <span>Checked by {by} on this device. Not right? Mark it</span>
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
  const t = useTimeline(revealTotal(e.facts.length))
  const counted = t === Infinity ? 1 : Math.min(1, Math.max(0, (t - REVEAL_START) / (e.facts.length * ROW_MS + DECODE_MS)))
  const shownScore = Math.round(e.score * (1 - (1 - counted) ** 3))

  return (
    <article className="file" aria-labelledby="file-title">
      <header className="file-head">
        <p className="file-case">
          Case no. {caseNumber(run.id)} · opened {new Date(run.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <div className="section-head">
          <h2 id="file-title" className="section-title">
            The detective’s file on you
          </h2>
          {run.history ? (
            <div className="segmented" role="tablist" aria-label="Which text the detective read">
              <button type="button" role="tab" aria-selected={scope === 'alone'} onClick={() => onScope('alone')}>
                This post <b>{run.exposure.score}%</b>
              </button>
              <button type="button" role="tab" aria-selected={scope === 'history'} onClick={() => onScope('history')}>
                With {run.history.posts} earlier <b>{run.history.exposure.score}%</b>
              </button>
            </div>
          ) : null}
        </div>
        <div className="file-badges">
          <SourceBadge source="in_cloud" label={`Guessed by ${view.report.model} in ${seconds(view.report.ms)}`} />
          <SourceBadge source={graderLabel === 'Gemini Nano' ? 'on_device' : 'rule'} label={`Checked by ${graderLabel} on this device`} />
        </div>
      </header>

      <div className={`panel verdict lvl-${e.level}`}>
        <div className="score">
          <span className="score-n" aria-label={`${e.score}%`}>
            {shownScore}
            <span className="score-pct">%</span>
          </span>
          <span className="score-label">exposed</span>
        </div>
        <p className="verdict-text">
          {e.considered === 0 ? (
            'Fill in your vault to see which guesses were right.'
          ) : (
            <>
              It worked out <strong>{e.exposed}</strong> of your {e.considered} facts
              {e.partial ? (
                <>
                  {' '}
                  and narrowed down <strong>{e.partial}</strong> more
                </>
              ) : null}
              .
            </>
          )}{' '}
          {view.report.crowdSize ? (
            <>
              Its estimate of the crowd you’d hide in: <strong>{view.report.crowdSize}</strong>.
            </>
          ) : null}
        </p>
        <FactStrip facts={e.facts} reveal={t} />
      </div>

      <Dossier
        facts={e.facts}
        guessFor={guessFor}
        graded={graded}
        draft={draft}
        onHover={onHoverFact}
        onEvidence={onEvidence}
        onOverride={(a, v) => onOverride(a, v, scope)}
        reveal={t}
      />
      <p className="small muted">Select a row to see why, what gave it away, or to correct it. Point at a row to trace it back to your words.</p>

      {view.report.nextStep ? (
        <div className="next">
          <h4>What an investigator would check next</h4>
          <p>{view.report.nextStep}</p>
        </div>
      ) : null}

      <SearchTrail report={view.report} />

      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={onCoolDown} disabled={coolingDisabled}>
          Suggest rewrites
        </button>
        <span className="small muted">Chosen from the detective’s evidence, never from your vault.</span>
      </div>
    </article>
  )
}

function FactStrip({ facts, reveal = Infinity }: { facts: Fact[]; reveal?: number }) {
  const n = (s: FactStatus) => facts.filter((f) => f.status === s).length
  return (
    <div className="strip-wrap">
      <div className="strip" role="img" aria-label={`${n('recovered')} found, ${n('narrowed')} close, ${n('safe')} missed`}>
        {facts.map((f) => (
          <span
            key={f.attribute}
            className={`strip-cell strip-${rowPhase(reveal, facts.indexOf(f)) === 'shown' ? f.status : 'pending'}`}
            data-tip={`${ATTRIBUTE_LABEL[f.attribute]}: ${STAMP[f.status] || 'not in your vault'}`} />
        ))}
      </div>
      <div className="strip-legend">
        <span>
          <span className="strip-cell strip-recovered" aria-hidden="true" />
          Found <b>{n('recovered')}</b>
        </span>
        <span>
          <span className="strip-cell strip-narrowed" aria-hidden="true" />
          Close <b>{n('narrowed')}</b>
        </span>
        <span>
          <span className="strip-cell strip-safe" aria-hidden="true" />
          Missed <b>{n('safe')}</b>
        </span>
      </div>
    </div>
  )
}

function SearchTrail({ report }: { report: DetectiveReport }) {
  const found = report.searchQueries.length || report.sources.length || report.searchEntryPointHtml
  if (report.usedSearch && !found) {
    return (
      <p className="trail-note small muted">
        <SearchIcon /> Web search was available, but the detective didn’t need it for this post.
      </p>
    )
  }
  if (!report.usedSearch) {
    return (
      <p className="trail-note small muted">
        <SearchIcon /> This run worked from the text alone. Live web search needs the Firebase Blaze plan, which this deployment
        doesn’t use, so a real investigator with a search engine could do better.
      </p>
    )
  }
  return (
    <div className="trail">
      <h4>
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
    <section className="section" aria-labelledby="runs-title">
      <div className="section-head">
        <h2 id="runs-title" className="section-title">
          Every run
        </h2>
        {last < first ? (
          <span className="badge badge-good tnum">
            {first}% to {last}%
          </span>
        ) : null}
      </div>
      <ol className="list">
        {runs.map((r, i) => (
          <li key={r.id} className="run">
            <span className="run-name">
              Run {i + 1}
              <span className="small muted">{i === 0 ? 'Original draft' : r.fixesBefore ? `After ${r.fixesBefore} ${r.fixesBefore === 1 ? 'rewrite' : 'rewrites'}` : 'Edited draft'}</span>
            </span>
            <MiniStrip facts={r.exposure.facts} />
            <span className="run-bar" aria-hidden="true">
              <span className={`lvl-${r.exposure.level}`} style={{ width: `${Math.max(2, r.exposure.score)}%` }} />
            </span>
            <span className="run-score">{r.exposure.score}%</span>
          </li>
        ))}
      </ol>
      <p className="small muted">One run is one sample, so results vary a little each time.</p>
    </section>
  )
}

/** A short, stable file number for a run, so a run can be referred to. */
function caseNumber(id: number) {
  return String(Math.floor(id) % 10000).padStart(4, '0')
}

function seconds(ms: number) {
  return `${Math.max(1, Math.round(ms / 1000))} s`
}
