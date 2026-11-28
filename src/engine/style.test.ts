import { describe, expect, it } from 'vitest'
import { cosine, habits, styleMatch } from './style'

const ids = (t: string) => habits(t).map((h) => h.id)

describe('writing habits', () => {
  it('finds nothing in an empty draft', () => {
    expect(habits('   ')).toEqual([])
  })

  it('spots punctuation habits', () => {
    expect(ids('Why does nobody care?!! It was awful...')).toEqual(expect.arrayContaining(['exclaim', 'ellipsis']))
    expect(ids('Is this normal ? I think not !')).toContain('space_before_punct')
    expect(ids('It was late.  Then it got worse.')).toContain('double_space')
  })

  it('spots a lowercase i, but not the letter inside words', () => {
    expect(ids('honestly i think i should quit')).toContain('lower_i')
    expect(ids('It is in this city')).not.toContain('lower_i')
  })

  it('tells British from American spelling', () => {
    expect(ids('My favourite colour is grey and I realised it whilst travelling.')).toContain('british')
    expect(ids('My favorite color is gray and I realized it.')).toContain('american')
  })

  it('notices shorthand, emoji and shouting', () => {
    const found = ids('tbh this is NEVER going to change lol 😭')
    expect(found).toEqual(expect.arrayContaining(['netspeak', 'caps', 'emoji']))
  })

  it('does not treat common acronyms as shouting', () => {
    expect(ids('I work in HR at a UPI company in the USA. My CTC went up and NASA called.')).not.toContain('caps')
    expect(ids('This is NOT okay and I am DONE.')).toContain('caps')
  })

  it('notices writing with no contractions', () => {
    expect(ids('I do not know. It is not fair. I am tired and I cannot sleep.')).toContain('no_contractions')
    expect(ids("I do not know. It's not fair. I am tired and I can't sleep.")).not.toContain('no_contractions')
  })
})

describe('style match', () => {
  const me =
    "honestly i think the reorg was a mess!! nobody told us anything... i asked my manager twice and got nothing back. tbh i'm tired of chasing people for answers. i just want to do the work and go home lol"
  const myOther =
    "ok so i finally finished the migration!! took way longer than it should have... i kept getting pulled into meetings. tbh i'm not sure anyone noticed. anyway i'm going home lol"
  const someoneElse =
    'The quarterly review highlighted several operational concerns; in particular, the escalation process remains unclear. I would recommend that the committee formalise ownership before the next cycle, and that each team document its dependencies.'

  it('scores the same author higher than a stranger', () => {
    const same = styleMatch(me, myOther)
    const other = styleMatch(me, someoneElse)
    expect(same.score).toBeGreaterThan(other.score)
    expect(same.level).toBe('strong')
    expect(other.level).toBe('weak')
  })

  it('lists the habits both texts share, and the ones the draft avoids', () => {
    const m = styleMatch(me, myOther)
    expect(m.shared.map((h) => h.id)).toEqual(expect.arrayContaining(['exclaim', 'ellipsis', 'lower_i', 'netspeak']))
    const clean = styleMatch('I think the reorg was a mess. Nobody told us anything.', myOther)
    expect(clean.avoided.map((h) => h.id)).toContain('netspeak')
  })

  it('says so when neither text has a habit to compare', () => {
    const m = styleMatch('We moved the batch jobs on Tuesday. The error rate is down.', 'The review found two issues. Each team will fix its own.')
    expect(m.bland).toBe(true)
    expect(m.level).toBe('weak')
  })

  it('stays between 0 and 100', () => {
    for (const [a, b] of [
      [me, me],
      [me, someoneElse],
      ['a', 'b'],
    ]) {
      const s = styleMatch(a, b).score
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThanOrEqual(100)
    }
  })
})

describe('cosine', () => {
  it('is 1 for identical vectors and 0 for disjoint ones', () => {
    expect(cosine([1, 2, 3], [1, 2, 3])).toBeCloseTo(1)
    expect(cosine(new Map([['a', 1]]), new Map([['b', 1]]))).toBe(0)
  })
})
