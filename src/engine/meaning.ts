// "Meaning kept": after the giveaways are rewritten, did the post still say
// what the author meant to say? This is the deterministic fallback used when
// the on-device model isn't ready. It ignores the words that were meant to go
// (the clues) and checks how much of everything else survived.

import type { MeaningCheck } from '../types'
import { normalize } from './text'

// Function words carry little meaning on their own. Negations are kept out of
// this list on purpose: losing a "not" or "never" changes what a post says.
const FUNCTION_WORDS = new Set(
  (
    'a an the and or but so if then than that this these those there here it its i me my mine we us our ours you your ' +
    'he him his she her they them their is are was were be been being am have has had do does did done to of in on at ' +
    'for from by with about as into over after before since until up down out off just also very really still even ' +
    'only too some any all each every much many more most other such own same can could would should will shall may ' +
    'might must what which who whom whose when where why how because while though although again once yet ever get got ' +
    'gets getting go goes went one two three four five six seven eight nine ten lot lots thing things kind stuff like'
  ).split(' '),
)

export function contentWords(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter((w) => w.length > 2 && !FUNCTION_WORDS.has(w) && !/^\d+$/.test(w))
}

/** Loose match so "paged" survives as "pages" and "reporting" as "report". */
function sameWord(a: string, b: string): boolean {
  if (a === b) return true
  const n = Math.min(a.length, b.length)
  return n >= 5 && a.slice(0, n - 1) === b.slice(0, n - 1)
}

export function meaningKept(original: string, rewritten: string, removedClues: string[]): MeaningCheck {
  const clueWords = new Set(contentWords(removedClues.join(' ')))
  const core = Array.from(new Set(contentWords(original))).filter((w) => !clueWords.has(w))
  const after = Array.from(new Set(contentWords(rewritten)))

  if (!core.length) {
    return { score: 100, verdict: 'Nothing beyond the clues needed to survive.', lost: [], by: 'rule' }
  }

  const lost = core.filter((w) => !after.some((a) => sameWord(w, a)))
  let score = Math.round(((core.length - lost.length) / core.length) * 100)

  const lostQuestion = original.includes('?') && !rewritten.includes('?')
  if (lostQuestion) score -= 15
  score = Math.max(0, Math.min(100, score))

  const lostWords = lost.sort((a, b) => b.length - a.length).slice(0, lostQuestion ? 3 : 4)
  if (lostQuestion) lostWords.unshift('your question')

  const verdict =
    score >= 85
      ? 'Your point comes through intact.'
      : score >= 65
        ? 'Most of your point survives. A few details went with the clues.'
        : 'The rewrite lost part of what you were saying. Check the words below.'

  return { score, verdict, lost: lostWords, by: 'rule' }
}
