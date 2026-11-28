import { describe, expect, it } from 'vitest'
import { blurAll, blurFor, blurSpan, replaceSpan } from './blur'
import { ruleTells } from './tells'

describe('blur', () => {
  it('makes common giveaways vaguer without a model', () => {
    expect(blurFor({ text: 'in March' })).toBe('recently')
    expect(blurFor({ text: "I've been here 2 years" })).toBe("I've been here a while")
    expect(blurFor({ text: "I'm 34" })).toBe("I'm in my thirties")
    expect(blurFor({ text: "I'm the only woman engineer" })).toBe("I'm one of the engineers")
    expect(blurFor({ text: 'in the Bellandur office' })).toBe('in our office')
    expect(blurFor({ text: 'Kindly do the needful' })).toBe('handle it')
    expect(blurFor({ text: '24 lakhs' })).toBe('a decent amount')
    expect(blurFor({ text: '!!!' })).toBe('!')
    expect(blurFor({ text: 'my wife' })).toBe('my partner')
    expect(blurFor({ text: 'UPI settlement service' })).toBeNull()
  })

  it('keeps time phrases grammatical from the words around them', () => {
    const a = 'I get every 3am page.'
    const s1 = blurSpan(a, { start: 12, end: 15, text: '3am' })!
    expect(replaceSpan(a, s1.start, s1.end, s1.replacement)).toBe('I get every middle-of-the-night page.')
    const b = 'I was paged at 3am.'
    const s2 = blurSpan(b, { start: 15, end: 18, text: '3am' })!
    expect(replaceSpan(b, s2.start, s2.end, s2.replacement)).toBe('I was paged in the middle of the night.')
  })

  it('removes contact details and tidies the gap', () => {
    expect(replaceSpan('Email me at a@b.co, thanks', 12, 18, '')).toBe('Email me at, thanks')
  })

  it('cools a whole draft', () => {
    const draft = "Since the reorg in March I've been here 2 years. I'm 34 and the only woman engineer, paged at 3am!!!"
    const { draft: out, count } = blurAll(draft, ruleTells(draft))
    expect(out).not.toMatch(/March|2 years|34|3am|!!!/)
    expect(out).toContain('recently')
    expect(count).toBeGreaterThanOrEqual(5)
  })

  it('leaves giveaways with no safe rewrite for the AI, and counts only what changed', () => {
    const draft = 'I work on the UPI settlement service in March.'
    const tells = [
      { start: 14, end: 36, text: 'UPI settlement service' },
      { start: 37, end: 45, text: 'in March' },
    ]
    const { draft: out, count } = blurAll(draft, tells)
    expect(count).toBe(1)
    expect(out).toBe('I work on the UPI settlement service recently.')
  })

  it('changes nothing when there is nothing to blur', () => {
    expect(blurAll('A plain sentence.', [])).toEqual({ draft: 'A plain sentence.', count: 0 })
  })
})
