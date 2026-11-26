import { describe, expect, it } from 'vitest'
import { applyFixes, cluesToRewrite } from './fixes'
import { enforce, inspect, ProfileLeakError } from './firewall'
import { exposure, gradeAll, gradeOne } from './grade'
import { meaningKept } from './meaning'
import { locate, modelTells, ruleTells } from './tells'
import { similarity } from './text'
import type { DetectiveGuess } from '../types'

const DRAFT =
  "Since the reorg in March, our on-call rotation for the settlement service went from 8 people to 3. " +
  "I'm the only woman engineer on the team and I've been here 2 years. Our office is right next to Bellandur lake. " +
  'Last Thursday I got paged at 3am for the fourth time this week!!!'

describe('ruleTells', () => {
  const tells = ruleTells(DRAFT)
  const texts = tells.map((t) => t.text.toLowerCase())

  it('finds dates, headcounts, uniqueness, tenure, landmarks, times and style', () => {
    expect(texts.some((t) => t.includes('march'))).toBe(true)
    expect(texts.some((t) => t.includes('8 people'))).toBe(true)
    expect(texts.some((t) => t.includes('only woman'))).toBe(true)
    expect(texts.some((t) => t.includes('2 years'))).toBe(true)
    expect(texts.some((t) => t.includes('bellandur') || t.includes('lake'))).toBe(true)
    expect(texts.some((t) => t.includes('3am'))).toBe(true)
    expect(texts.some((t) => t.includes('!!!'))).toBe(true)
  })

  it('returns non-overlapping spans that match the draft text', () => {
    for (let i = 1; i < tells.length; i++) expect(tells[i].start).toBeGreaterThanOrEqual(tells[i - 1].end)
    for (const t of tells) expect(DRAFT.slice(t.start, t.end)).toBe(t.text)
  })

  it('captures whole place names and ignores other people’s job titles', () => {
    const t = ruleTells('My manager reads this. I demoed in the Bellandur office. I work as a backend engineer.')
    const texts = t.map((x) => x.text)
    expect(texts).toContain('in the Bellandur')
    expect(texts.some((x) => /manager/i.test(x))).toBe(false)
    expect(texts.some((x) => /backend engineer/i.test(x))).toBe(true)
  })

  it('flags a named employer as the highest-risk tell', () => {
    const t = ruleTells('I work at Lakeview Pay and our office is in Koramangala.')
    const employer = t.find((x) => x.kind === 'employer')
    expect(employer?.text).toBe('work at Lakeview Pay')
    expect(employer?.risk).toBe('high')
  })

  it('catches dialect: regional phrases, spellings, currencies and time zones', () => {
    const t = ruleTells('Kindly do the needful, my CTC is 18 lakhs. Meeting at 9 IST. My favourite colour is blue, salary ₹40,000.')
    const dialect = t.filter((x) => x.kind === 'dialect').map((x) => x.text)
    expect(dialect).toContain('Kindly do the needful')
    expect(dialect).toContain('18 lakhs')
    expect(dialect).toContain('IST')
    expect(dialect).toContain('favourite')
    expect(dialect).toContain('colour')
    expect(dialect).toContain('₹40,000')
  })

  it('marks writing-style habits like text-speak and emoji', () => {
    const t = ruleTells('ngl this place is wild 😅 lol')
    expect(t.filter((x) => x.kind === 'style').map((x) => x.text)).toEqual(['ngl', '😅', 'lol'])
  })

  it('ignores sentence starters that are not places', () => {
    const t = ruleTells('I work in The team every day. In Slack we talk.')
    expect(t.filter((x) => x.kind === 'location')).toHaveLength(0)
  })
})

describe('modelTells', () => {
  it('keeps quotes found in the draft and drops hallucinated ones', () => {
    const out = modelTells(DRAFT, [
      { quote: 'settlement service', kind: 'team_or_role', why: 'names the team', risk: 'high' },
      { quote: 'a quote that is not there', kind: 'event', why: 'x', risk: 'low' },
    ], 'on_device')
    expect(out).toHaveLength(1)
    expect(out[0].text).toBe('settlement service')
  })

  it('locates quotes case-insensitively and strips quote marks', () => {
    expect(locate(DRAFT, '"BELLANDUR LAKE"')).toBe(DRAFT.indexOf('Bellandur lake'))
  })
})

describe('grading', () => {
  it('grades cities, employers, ages and genders sensibly', () => {
    expect(gradeOne('city', 'Bengaluru, India', 'Bengaluru')).toBe('exact')
    expect(gradeOne('city', 'Bangalore', 'Bengaluru')).toBe('close')
    expect(gradeOne('employer', 'unknown', 'Lakeview Pay')).toBe('not_guessed')
    expect(gradeOne('employer', 'Razorpay', 'Lakeview Pay')).toBe('wrong')
    expect(gradeOne('age_range', '25-30', '27')).toBe('exact')
    expect(gradeOne('age_range', '30-35', '27')).toBe('close')
    expect(gradeOne('age_range', '40-45', '27')).toBe('wrong')
    expect(gradeOne('gender', 'Female', 'woman')).toBe('exact')
    expect(gradeOne('team_or_department', 'Payments settlement', '')).toBe('no_truth')
  })

  it('computes exposure only over filled-in, confident guesses', () => {
    const guesses: DetectiveGuess[] = [
      { attribute: 'city', guess: 'Bengaluru', confidence: 90, evidence: ['Bellandur lake'], reasoning: '' },
      { attribute: 'gender', guess: 'female', confidence: 95, evidence: ['only woman engineer'], reasoning: '' },
      { attribute: 'employer', guess: 'Razorpay', confidence: 40, evidence: [], reasoning: '' },
      { attribute: 'age_range', guess: '30-35', confidence: 60, evidence: [], reasoning: '' },
    ]
    const grades = gradeAll(guesses, { city: 'Bengaluru', gender: 'woman', employer: 'Lakeview Pay', age_range: '27' })
    const e = exposure(grades, guesses, 50)
    expect(e.exposed).toBe(2)
    expect(e.partial).toBe(1)
    expect(e.safe).toBe(1)
    expect(e.level).toBe('high')
    const status = Object.fromEntries(e.facts.map((f) => [f.attribute, f.status]))
    expect(status.city).toBe('recovered')
    expect(status.age_range).toBe('narrowed')
    expect(status.employer).toBe('safe')
    expect(status.country).toBe('empty')
    expect(e.facts).toHaveLength(10)
  })

  it('treats a verdict the user set by hand as final', () => {
    const guesses: DetectiveGuess[] = [{ attribute: 'city', guess: 'Bangalore', confidence: 20, evidence: [], reasoning: '' }]
    const profile = { city: 'Bengaluru' }
    const e = exposure([{ attribute: 'city', verdict: 'exact', by: 'you' }], guesses, 50, profile)
    expect(e.facts[2]).toEqual({ attribute: 'city', status: 'recovered' })
  })

  it('counts vault facts the detective never tried as safe', () => {
    const guesses: DetectiveGuess[] = [{ attribute: 'city', guess: 'Bengaluru', confidence: 80, evidence: [], reasoning: '' }]
    const profile = { city: 'Bengaluru', country: 'India' }
    const e = exposure(gradeAll(guesses, profile), guesses, 50, profile)
    expect(e.exposed).toBe(1)
    expect(e.safe).toBe(1)
    expect(e.score).toBe(50)
  })
})

describe('firewall', () => {
  const profile = { employer: 'Lakeview Pay', city: 'Bengaluru' }
  it('blocks a payload that carries a private value not in the draft', () => {
    expect(() => enforce('Rewrite this. Employer: Lakeview Pay', profile, DRAFT)).toThrow(ProfileLeakError)
  })
  it('allows values the draft already contains', () => {
    const draft = 'I live in Bengaluru and hate traffic.'
    expect(inspect(`Audit: ${draft}`, profile, draft).ok).toBe(true)
  })
})

describe('fixes', () => {
  it('applies accepted fixes and keeps sentence capitalisation', () => {
    const out = applyFixes('Since the reorg in March, we suffer. Our office is next to Bellandur lake.', [
      { original: 'in March', replacement: 'earlier this year', reason: '', accepted: true },
      { original: 'next to Bellandur lake', replacement: 'in the city', reason: '', accepted: true },
      { original: 'we suffer', replacement: 'nope', reason: '', accepted: false },
    ])
    expect(out).toBe('Since the reorg earlier this year, we suffer. Our office is in the city.')
  })

  it('removes a clue cleanly when the replacement is empty', () => {
    expect(applyFixes('I paged at 3am, again!!!', [{ original: '!!!', replacement: '', reason: '', accepted: true }])).toBe(
      'I paged at 3am, again',
    )
  })

  it('merges overlapping clues into one suggestion', () => {
    const draft = 'I demoed at the Friday all-hands in the Bellandur office today.'
    const guesses: DetectiveGuess[] = [
      { attribute: 'city', guess: 'Bengaluru', confidence: 90, evidence: ['Bellandur office'], reasoning: '' },
    ]
    const clues = cluesToRewrite(draft, ruleTells(draft), guesses, 50)
    expect(clues).toContain('in the Bellandur office')
    expect(clues).not.toContain('Bellandur office')
  })

  it('selects clues without looking at the profile', () => {
    const guesses: DetectiveGuess[] = [
      { attribute: 'city', guess: 'Bengaluru', confidence: 90, evidence: ['Bellandur lake', 'not in draft'], reasoning: '' },
      { attribute: 'employer', guess: 'x', confidence: 10, evidence: ['settlement service'], reasoning: '' },
    ]
    const clues = cluesToRewrite(DRAFT, ruleTells(DRAFT), guesses, 50)
    expect(clues.some((c) => c.toLowerCase().includes('bellandur'))).toBe(true)
    expect(clues).not.toContain('not in draft')
  })
})

describe('similarity', () => {
  it('is 1 for normalized equals and low for unrelated strings', () => {
    expect(similarity('Lakeview Pay', 'lakeview  pay!')).toBe(1)
    expect(similarity('Seattle', 'Bengaluru')).toBeLessThan(0.5)
  })
})

describe('meaningKept', () => {
  const original = "Since the reorg in March our on-call rotation went from 8 people to 3. I get every page and nobody helps. Should I quit?"

  it('scores a rewrite that only removed clues as intact', () => {
    const rewritten = 'Since a recent reorg our on-call rotation shrank a lot. I get every page and nobody helps. Should I quit?'
    const m = meaningKept(original, rewritten, ['in March', 'from 8 people to 3'])
    expect(m.score).toBeGreaterThanOrEqual(85)
    expect(m.lost).toHaveLength(0)
  })

  it('notices when the point and the question are lost', () => {
    const rewritten = 'Work has been busy lately.'
    const m = meaningKept(original, rewritten, ['in March'])
    expect(m.score).toBeLessThan(50)
    expect(m.lost[0]).toBe('your question')
    expect(m.lost.length).toBeGreaterThan(1)
  })

  it('treats a lost negation as lost meaning', () => {
    const m = meaningKept('The manager did not report the incident.', 'The manager did report the incident.', [])
    expect(m.lost).toContain('not')
  })
})
