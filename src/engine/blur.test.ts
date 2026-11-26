import { describe, expect, it } from 'vitest'
import { blurFor, blurSpan, replaceSpan } from './blur'
import { ruleTells } from './tells'

function blurAll(draft: string): string {
  let out = draft
  // Apply right to left so earlier offsets stay valid.
  for (const t of [...ruleTells(draft)].reverse()) {
    const b = blurSpan(out, t)
    if (b) out = replaceSpan(out, b.start, b.end, b.replacement)
  }
  return out
}

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
    const out = blurAll("Since the reorg in March I've been here 2 years. I'm 34 and the only woman engineer, paged at 3am!!!")
    expect(out).not.toMatch(/March|2 years|34|3am|!!!/)
    expect(out).toContain('recently')
  })
})
