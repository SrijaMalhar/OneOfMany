import { describe, expect, it } from 'vitest'
import type { Exposure } from '../engine/grade'
import { coach, type CoachInput } from './coach'
import type { HeatTell } from './heat'

const tell = (text: string, heat: HeatTell['heat'], why = 'Being "the only" one makes you unique'): HeatTell => ({
  start: 0, end: text.length, text, kind: 'demographic', why, risk: 'high', origins: ['rule'], heat, cited: heat === 'hottest', attrs: [],
})
const ex = (score: number, exposed = 0, partial = 0): Exposure => ({ exposed, partial, safe: 0, considered: 10, score, level: 'high', facts: [] })
const base: CoachInput = { draft: '', words: 0, tells: [], running: false, online: true, current: null, first: null, runs: 0, fixesPending: 0 }

describe('coach', () => {
  it('asks for a draft when there is none', () => {
    expect(coach(base).says).toMatch(/Paste the post/)
  })

  it('points at the hottest giveaway while you write', () => {
    const c = coach({ ...base, draft: 'x', words: 30, tells: [tell('in March', 'warm', 'Months narrow it down'), tell('the only woman engineer', 'hot')] })
    expect(c.says).toContain('“the only woman engineer”: being "the only" one makes you unique.')
    expect(c.says).toContain('one of 2 giveaways')
    expect(c.tone).toBe('warn')
  })

  it('warns when the detective found you', () => {
    const c = coach({ ...base, draft: 'x', current: ex(65, 5, 3), first: 65, runs: 1 })
    expect(c.tone).toBe('bad')
    expect(c.says).toContain('5 things')
  })

  it('notices blending back in after rewrites', () => {
    const c = coach({ ...base, draft: 'x', current: ex(15), first: 65, runs: 2 })
    expect(c.tone).toBe('good')
    expect(c.says).toContain('65% down to 15%')
  })
})
