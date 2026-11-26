import { describe, expect, it } from 'vitest'
import { BENCH_CASES } from './cases'
import { summarize, toMarkdown, type BenchRow } from './runner'
import { ATTRIBUTES } from '../types'

const ex = (score: number, exposed: number) => ({ exposed, partial: 0, safe: 10 - exposed, considered: 10, score, level: 'high' as const, facts: [] })
const row = (id: string, b: number, a: number): BenchRow => ({
  id, label: id, before: ex(b, b / 10), after: ex(a, a / 10), crowdBefore: '', crowdAfter: '', fixes: 3, meaningKept: 90,
  modelBefore: 'm', modelAfter: 'm', usedSearch: false, rewrittenBy: 'in_cloud', finishedAt: '',
})

describe('benchmark cases', () => {
  it('has 30 unique cases with a full vault each', () => {
    expect(BENCH_CASES).toHaveLength(30)
    expect(new Set(BENCH_CASES.map((c) => c.id)).size).toBe(30)
    for (const c of BENCH_CASES) {
      for (const a of ATTRIBUTES) expect((c.vault[a] ?? '').length, `${c.id}.${a}`).toBeGreaterThan(0)
      expect(c.draft.length).toBeGreaterThan(150)
    }
  })
})

describe('summarize', () => {
  it('reports means, medians and how many improved, ignoring failed runs', () => {
    const rows = [row('a', 60, 20), row('b', 40, 40), row('c', 80, 10), { ...row('d', 0, 0), error: 'quota' }]
    const s = summarize(rows)!
    expect(s.cases).toBe(3)
    expect(s.meanBefore).toBe(60)
    expect(s.meanAfter).toBe(23)
    expect(s.medianBefore).toBe(60)
    expect(s.improved).toBe(2)
    expect(s.meanMeaningKept).toBe(90)
    expect(toMarkdown(rows, s)).toContain('mean exposure fell from 60% to 23%')
  })
})
