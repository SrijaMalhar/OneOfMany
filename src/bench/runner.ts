// Benchmark runner: for each fictional case, attack the post, apply every
// suggested fix, attack again, and record exposure before and after. Grading
// uses the deterministic rules so results are reproducible across machines.

import { runDetective, suggestFixes } from '../ai/tasks'
import { applyFixes, cluesToRewrite } from '../engine/fixes'
import { exposure, gradeAll, type Exposure } from '../engine/grade'
import { meaningKept } from '../engine/meaning'
import { ruleTells } from '../engine/tells'
import type { Settings } from '../firebase'
import type { BenchCase } from './cases'

export interface BenchRow {
  id: string
  label: string
  before: Exposure
  after: Exposure
  crowdBefore: string
  crowdAfter: string
  fixes: number
  /** Deterministic meaning-kept score for the rewrite, 0–100. */
  meaningKept: number
  modelBefore: string
  modelAfter: string
  usedSearch: boolean
  rewrittenBy: 'on_device' | 'in_cloud' | 'none'
  finishedAt: string
  error?: string
}

export type Step = 'attack' | 'rewrite' | 're-attack'

export async function runCase(c: BenchCase, s: Settings, onStep: (step: Step) => void): Promise<BenchRow> {
  onStep('attack')
  const r1 = await runDetective(c.draft, c.vault, s)
  const before = exposure(gradeAll(r1.guesses, c.vault), r1.guesses, s.minConfidence, c.vault)

  onStep('rewrite')
  const clues = cluesToRewrite(c.draft, ruleTells(c.draft), r1.guesses, s.minConfidence)
  const fx = clues.length ? await suggestFixes(c.draft, clues, c.vault, s) : { fixes: [], source: 'on_device' as const }
  const fixed = applyFixes(c.draft, fx.fixes)
  const kept = meaningKept(c.draft, fixed, fx.fixes.map((f) => f.original))

  onStep('re-attack')
  const r2 = await runDetective(fixed, c.vault, s)
  const after = exposure(gradeAll(r2.guesses, c.vault), r2.guesses, s.minConfidence, c.vault)

  return {
    id: c.id,
    label: c.label,
    before,
    after,
    crowdBefore: r1.crowdSize,
    crowdAfter: r2.crowdSize,
    fixes: fx.fixes.length,
    meaningKept: kept.score,
    modelBefore: r1.model,
    modelAfter: r2.model,
    usedSearch: r1.usedSearch || r2.usedSearch,
    rewrittenBy: fx.fixes.length ? fx.source : 'none',
    finishedAt: new Date().toISOString(),
  }
}

export interface Summary {
  cases: number
  meanBefore: number
  meanAfter: number
  medianBefore: number
  medianAfter: number
  improved: number
  factsBefore: number
  factsAfter: number
  meanMeaningKept: number
}

export function summarize(rows: BenchRow[]): Summary | null {
  const ok = rows.filter((r) => !r.error)
  if (!ok.length) return null
  const mean = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length)
  const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b)
    const m = Math.floor(s.length / 2)
    return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2)
  }
  const b = ok.map((r) => r.before.score)
  const a = ok.map((r) => r.after.score)
  const facts = (r: BenchRow, k: 'before' | 'after') => r[k].exposed + r[k].partial * 0.5
  return {
    cases: ok.length,
    meanBefore: mean(b),
    meanAfter: mean(a),
    medianBefore: median(b),
    medianAfter: median(a),
    improved: ok.filter((r) => r.after.score < r.before.score).length,
    factsBefore: Math.round((ok.reduce((t, r) => t + facts(r, 'before'), 0) / ok.length) * 10) / 10,
    factsAfter: Math.round((ok.reduce((t, r) => t + facts(r, 'after'), 0) / ok.length) * 10) / 10,
    meanMeaningKept: mean(ok.map((r) => r.meaningKept ?? 100)),
  }
}

export function toMarkdown(rows: BenchRow[], s: Summary | null): string {
  const lines = [
    '| Case | Exposure before | Exposure after | Fixes applied | Meaning kept | Detective model |',
    '| --- | ---: | ---: | ---: | ---: | --- |',
    ...rows.map((r) =>
      r.error
        ? `| ${r.label} | error | error | – | – | ${r.error.slice(0, 40)} |`
        : `| ${r.label} | ${r.before.score}% | ${r.after.score}% | ${r.fixes} | ${r.meaningKept}% | ${r.modelBefore} |`,
    ),
  ]
  if (s) {
    lines.unshift(
      `Across ${s.cases} cases, mean exposure fell from ${s.meanBefore}% to ${s.meanAfter}% (median ${s.medianBefore}% → ${s.medianAfter}%); ` +
        `exposure dropped in ${s.improved} of ${s.cases}. Facts recovered per post fell from ${s.factsBefore} to ${s.factsAfter} on average, ` +
        `and the rewrites kept ${s.meanMeaningKept}% of the meaning on average (rule-based check).`,
      '',
    )
  }
  return lines.join('\n')
}
