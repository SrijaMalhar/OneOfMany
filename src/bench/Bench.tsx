// Benchmark: 30 fictional posts. Each is attacked by the detective, every
// suggested fix is applied, and the fixed post is attacked again. Grading uses
// the deterministic rules so anyone can reproduce the numbers.

import { useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_SETTINGS, isConfigured, loadSettings, type Settings } from '../firebase'
import type { Exposure } from '../engine/grade'
import { Mark } from '../ui/Mark'
import { friendly } from '../ui/errors'
import { BENCH_CASES } from './cases'
import { runCase, summarize, toMarkdown, type BenchRow, type Step } from './runner'

const STORE = 'oneofmany.bench.v1'
const GAP_MS = 6000

const STEP_TEXT: Record<Step, string> = {
  attack: 'attacking the original',
  rewrite: 'rewriting the giveaways',
  're-attack': 'attacking the rewrite',
}

const EMPTY: Exposure = { exposed: 0, partial: 0, safe: 0, considered: 0, score: 0, level: 'clear', facts: [] }

function loadRows(): BenchRow[] {
  try {
    return JSON.parse(localStorage.getItem(STORE) ?? '[]') as BenchRow[]
  } catch {
    return []
  }
}

export default function Bench() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [rows, setRows] = useState<BenchRow[]>(loadRows)
  const [running, setRunning] = useState(false)
  const [current, setCurrent] = useState<{ label: string; step: Step } | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const stop = useRef(false)

  useEffect(() => {
    loadSettings().then(setSettings)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(rows))
    } catch {
      /* storage unavailable: results stay in memory */
    }
  }, [rows])

  const summary = useMemo(() => summarize(rows), [rows])
  const order = new Map(BENCH_CASES.map((c, i) => [c.id, i]))
  const sorted = [...rows].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
  const doneIds = new Set(rows.filter((r) => !r.error).map((r) => r.id))
  const todo = BENCH_CASES.filter((c) => !doneIds.has(c.id))

  const start = async () => {
    stop.current = false
    setRunning(true)
    for (const c of todo) {
      if (stop.current) break
      try {
        const row = await runCase(c, settings, (step) => setCurrent({ label: c.label, step }))
        setRows((rs) => [...rs.filter((r) => r.id !== c.id), row])
      } catch (e) {
        const error = friendly(e)
        setRows((rs) => [
          ...rs.filter((r) => r.id !== c.id),
          {
            id: c.id,
            label: c.label,
            before: EMPTY,
            after: EMPTY,
            crowdBefore: '',
            crowdAfter: '',
            fixes: 0,
            meaningKept: 0,
            modelBefore: '',
            modelAfter: '',
            usedSearch: false,
            rewrittenBy: 'none',
            finishedAt: new Date().toISOString(),
            error,
          },
        ])
      }
      // Stay inside free-tier rate limits.
      if (!stop.current) await new Promise((r) => setTimeout(r, GAP_MS))
    }
    setCurrent(null)
    setRunning(false)
  }

  const download = () => {
    const blob = new Blob([JSON.stringify({ settings, summary, rows: sorted }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'oneofmany-benchmark.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const ok = sorted.filter((r) => !r.error)

  return (
    <div className="bench">
      <header className="topbar">
        <a className="brand" href="#">
          <Mark size={20} />
          <span>OneOfMany</span>
        </a>
        <nav className="topbar-actions">
          <a className="btn btn-ghost btn-sm" href="#">
            Back to the app
          </a>
        </nav>
      </header>

      <main className="bench-main">
        <h1 className="title">Benchmark</h1>
        <p className="bench-lede">
          {BENCH_CASES.length} fictional people, each with an anonymous post they might write and the truth about them. For every
          post the detective attacks, every suggested rewrite is applied, and the detective attacks again. Guesses are graded by the
          deterministic rules, so anyone can reproduce the numbers. Employers are invented; places are real so the clues behave
          like real ones.
        </p>

        <div className="actions">
          {running ? (
            <button type="button" className="btn btn-primary" onClick={() => (stop.current = true)}>
              Pause after this post
            </button>
          ) : (
            <button type="button" className="btn btn-primary" disabled={!todo.length || !isConfigured} onClick={start}>
              {rows.length ? `Continue (${todo.length} left)` : 'Run the benchmark'}
            </button>
          )}
          <button
            type="button"
            className="btn"
            disabled={!rows.length || running}
            onClick={async () => {
              await navigator.clipboard.writeText(toMarkdown(sorted, summary))
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            }}
          >
            {copied ? 'Copied' : 'Copy as Markdown'}
          </button>
          <button type="button" className="btn" disabled={!rows.length || running} onClick={download}>
            Download JSON
          </button>
          {confirmClear ? (
            <span className="confirm-inline">
              Clear all results?
              <button
                type="button"
                className="btn btn-sm btn-danger btn-solid"
                onClick={() => {
                  setRows([])
                  setConfirmClear(false)
                }}
              >
                Clear
              </button>
              <button type="button" className="btn" onClick={() => setConfirmClear(false)}>
                Keep
              </button>
            </span>
          ) : (
            <button type="button" className="btn btn-ghost btn-danger" disabled={!rows.length || running} onClick={() => setConfirmClear(true)}>
              Clear results
            </button>
          )}
        </div>
        <p className="small muted">
          {!isConfigured
            ? 'Connect Firebase (see the README) to run the benchmark.'
            : current
              ? `Now: ${current.label}, ${STEP_TEXT[current.step]}.`
              : `About 20 to 30 minutes for all ${BENCH_CASES.length}, with a ${GAP_MS / 1000} s pause between posts. Progress is saved in this browser, so you can pause and continue later.`}
        </p>

        {summary ? (
          <dl className="bench-summary">
            <div>
              <dt>Mean exposure</dt>
              <dd>
                {summary.meanBefore}% <span className="to">to</span> {summary.meanAfter}%
              </dd>
            </div>
            <div>
              <dt>Median exposure</dt>
              <dd>
                {summary.medianBefore}% <span className="to">to</span> {summary.medianAfter}%
              </dd>
            </div>
            <div>
              <dt>Facts recovered per post</dt>
              <dd>
                {summary.factsBefore} <span className="to">to</span> {summary.factsAfter}
              </dd>
            </div>
            <div>
              <dt>Posts that got safer</dt>
              <dd>
                {summary.improved} <span className="to">of</span> {summary.cases}
              </dd>
            </div>
            <div>
              <dt>Meaning kept, on average</dt>
              <dd>{summary.meanMeaningKept}%</dd>
            </div>
          </dl>
        ) : null}

        {ok.length ? (
          <figure className="dumbbell">
            <figcaption>
              <span className="section-title">Exposure before and after the rewrites</span>
              <span className="legend">
                <span className="key key-before" /> Before
                <span className="key key-after" /> After
              </span>
            </figcaption>
            <ol className="db-rows">
              {ok.map((r) => {
                const lo = Math.min(r.before.score, r.after.score)
                const hi = Math.max(r.before.score, r.after.score)
                return (
                  <li key={r.id} className="db-row" tabIndex={0}>
                    <span className="db-label">{r.label}</span>
                    <span className="db-track">
                      <span className="db-link" style={{ left: `${lo}%`, width: `${hi - lo}%` }} />
                      <span className="db-dot db-before" style={{ left: `${r.before.score}%` }} />
                      <span className="db-dot db-after" style={{ left: `${r.after.score}%` }} />
                      <span className="db-tip" role="tooltip">
                        {r.label}: {r.before.score}% before, {r.after.score}% after {r.fixes} rewrites. Meaning kept {r.meaningKept}%.
                      </span>
                    </span>
                    <span className="db-values">
                      {r.before.score}% <span className="to">to</span> {r.after.score}%
                    </span>
                  </li>
                )
              })}
            </ol>
            <div className="db-axis" aria-hidden="true">
              <span>0%</span>
              <span>50%</span>
              <span>100% exposed</span>
            </div>
          </figure>
        ) : null}

        <table className="bench-table">
          <caption>All posts</caption>
          <thead>
            <tr>
              <th scope="col">Post</th>
              <th scope="col">Before</th>
              <th scope="col">After</th>
              <th scope="col">Rewrites</th>
              <th scope="col">Meaning kept</th>
              <th scope="col">Detective</th>
            </tr>
          </thead>
          <tbody>
            {BENCH_CASES.map((c) => {
              const r = rows.find((x) => x.id === c.id)
              const now = current?.label === c.label
              return (
                <tr key={c.id} className={r?.error ? 'is-error' : now ? 'is-now' : r ? '' : 'is-todo'}>
                  <th scope="row">{c.label}</th>
                  {r && !r.error ? (
                    <>
                      <td>{r.before.score}%</td>
                      <td>{r.after.score}%</td>
                      <td>{r.fixes}</td>
                      <td>{r.meaningKept}%</td>
                      <td>{r.modelBefore}</td>
                    </>
                  ) : (
                    <td colSpan={5} className="muted">
                      {r?.error ?? (now ? STEP_TEXT[current!.step] : 'Not run yet')}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </main>
    </div>
  )
}
