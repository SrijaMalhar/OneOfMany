// Deterministic grading: compares the detective's guesses with the private
// profile without any model. Used when the on-device model is unavailable,
// and as a cross-check on the on-device verdicts.

import { ATTRIBUTES, type Attribute, type DetectiveGuess, type Grade, type Profile, type Verdict } from '../types'
import { containsPhrase, normalize, numbersIn, similarity, skeleton } from './text'

const GENDER: Record<string, string> = {
  f: 'female', female: 'female', woman: 'female', w: 'female', girl: 'female', she: 'female',
  m: 'male', male: 'male', man: 'male', guy: 'male', he: 'male',
  nb: 'nonbinary', nonbinary: 'nonbinary', 'non binary': 'nonbinary', enby: 'nonbinary',
}

const UNKNOWN = /^(unknown|n\/?a|none|not sure|unclear|cannot (be )?determined?|-|)$/i

export function isUnknownGuess(guess: string | undefined): boolean {
  return !guess || UNKNOWN.test(guess.trim())
}

export function gradeOne(attribute: Attribute, guess: string | undefined, truth: string | undefined): Verdict {
  if (!truth || !truth.trim()) return 'no_truth'
  if (isUnknownGuess(guess)) return 'not_guessed'
  const g = guess as string

  if (attribute === 'gender') {
    const a = GENDER[normalize(g)] ?? normalize(g)
    const b = GENDER[normalize(truth)] ?? normalize(truth)
    return a === b ? 'exact' : 'wrong'
  }

  if (attribute === 'age_range' || attribute === 'tenure') {
    const tn = numbersIn(truth)
    const gn = numbersIn(g)
    if (tn.length && gn.length) {
      const t = tn.length > 1 ? (tn[0] + tn[1]) / 2 : tn[0]
      const lo = Math.min(...gn)
      const hi = gn.length > 1 ? Math.max(...gn) : lo
      if (t >= lo && t <= hi) return 'exact'
      const dist = t < lo ? lo - t : t - hi
      const slack = attribute === 'age_range' ? 5 : 1
      return dist <= slack ? 'close' : 'wrong'
    }
  }

  if (containsPhrase(g, truth) || containsPhrase(truth, g)) {
    // "Bengaluru, India" contains "Bengaluru". A guess that merely contains a
    // very short truth (e.g. "IT") is still exact for our purposes.
    return 'exact'
  }
  const s = similarity(g, truth)
  if (s >= 0.93) return 'exact'
  const sk = skeleton(truth)
  if (s >= 0.5 || (sk.length >= 3 && sk === skeleton(g))) return 'close'
  return 'wrong'
}

export function gradeAll(guesses: DetectiveGuess[], profile: Profile): Grade[] {
  const graded: Grade[] = guesses.map((gu) => ({
    attribute: gu.attribute,
    verdict: gradeOne(gu.attribute, gu.guess, profile[gu.attribute]),
    by: 'rule' as const,
  }))
  // Vault facts the detective never even attempted count as safe.
  const seen = new Set(guesses.map((g) => g.attribute))
  for (const a of ATTRIBUTES) {
    if (!seen.has(a) && (profile[a] ?? '').trim()) graded.push({ attribute: a, verdict: 'not_guessed', by: 'rule' })
  }
  return graded
}

/** What one vault fact looks like after an attack. */
export type FactStatus = 'recovered' | 'narrowed' | 'safe' | 'empty'

export interface Fact {
  attribute: Attribute
  status: FactStatus
}

export interface Exposure {
  exposed: number
  partial: number
  safe: number
  considered: number
  score: number // 0..100, higher is worse
  level: 'clear' | 'low' | 'medium' | 'high'
  /** One entry per attribute, in display order. */
  facts: Fact[]
}

export function factStatus(verdict: Verdict | undefined, confidence: number, minConfidence: number): FactStatus {
  if (!verdict || verdict === 'no_truth') return 'empty'
  if (verdict === 'exact' && confidence >= minConfidence) return 'recovered'
  if ((verdict === 'exact' || verdict === 'close') && confidence >= minConfidence / 2) return 'narrowed'
  return 'safe'
}

/**
 * Exposure counts only attributes the user actually filled in, and only
 * guesses the detective was reasonably confident about.
 */
export function exposure(grades: Grade[], guesses: DetectiveGuess[], minConfidence: number, profile?: Profile): Exposure {
  const conf = new Map(guesses.map((g) => [g.attribute, g.confidence]))
  const byAttr = new Map(grades.map((g) => [g.attribute, g.verdict]))
  const facts: Fact[] = ATTRIBUTES.map((attribute) => {
    const filled = profile ? Boolean((profile[attribute] ?? '').trim()) : byAttr.has(attribute)
    if (!filled) return { attribute, status: 'empty' as const }
    return { attribute, status: factStatus(byAttr.get(attribute) ?? 'not_guessed', conf.get(attribute) ?? 0, minConfidence) }
  })
  const exposed = facts.filter((f) => f.status === 'recovered').length
  const partial = facts.filter((f) => f.status === 'narrowed').length
  const safe = facts.filter((f) => f.status === 'safe').length
  const considered = exposed + partial + safe
  const score = considered ? Math.round(((exposed + partial * 0.5) / considered) * 100) : 0
  const level = score === 0 ? 'clear' : score < 25 ? 'low' : score < 50 ? 'medium' : 'high'
  return { exposed, partial, safe, considered, score, level, facts }
}
