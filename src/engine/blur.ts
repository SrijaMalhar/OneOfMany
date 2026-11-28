// "Blur it": instant, deterministic rewrites for common giveaways. No model,
// no network, works offline. Each rule keeps the sentence natural and the
// meaning roughly intact while making the detail vaguer. Giveaways with no
// safe automatic rewrite return null and are left to the AI rewrite.

import type { Tell } from '../types'

const MONTHS =
  'January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec'
const NUM: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 }

function decade(age: number): string {
  if (age < 20) return 'in my teens'
  const words = ['twenties', 'thirties', 'forties', 'fifties', 'sixties', 'seventies']
  return `in my ${words[Math.min(5, Math.floor(age / 10) - 2)]}`
}

function partOfDay(hour: number, pm: boolean): string {
  const h = (hour % 12) + (pm ? 12 : 0)
  if (h < 5) return 'in the middle of the night'
  if (h < 12) return 'in the morning'
  if (h < 17) return 'in the afternoon'
  if (h < 21) return 'in the evening'
  return 'late at night'
}

const RULES: [RegExp, string | ((m: RegExpMatchArray) => string)][] = [
  // Contact details: remove outright.
  [/^[\w.+-]+@[\w-]+\.[\w.]+$/, ''],
  [/^https?:\/\/\S+$/i, ''],
  [/^@\w{3,}$/, ''],
  // Style.
  [/^[!?]{3,}$/, (m) => m[0][0]],
  [/^\.{4,}$/, '...'],
  [/^(?:lol|lmao|tbh|imo|imho|ngl|smh|fwiw)$/i, ''],
  [/^\p{Extended_Pictographic}/u, ''],
  // Dialect.
  [/^(?:kindly )?do the needful$/i, 'handle it'],
  [/^kindly (revert|share|check|confirm)$/i, (m) => `please ${m[1].toLowerCase() === 'revert' ? 'reply' : m[1].toLowerCase()}`],
  [/^revert back$/i, 'reply'],
  [/^prepone[ds]?$/i, 'moved earlier'],
  [/^out of station$/i, 'out of town'],
  [/^(?:\d+(?:\.\d+)?\s?)?(?:lakhs?|crores?)$/i, 'a decent amount'],
  [/^(?:₹|£|€|Rs\.?|INR|[ACS]\$|rupees?)\s?[\d,.]*$/i, 'a decent amount'],
  [/^(?:IST|PST|PDT|EST|EDT|CST|CDT|GMT|BST|CET|AEST|SGT)$/, ''],
  [/^y'all$/i, 'you all'],
  [/^whilst$/i, 'while'],
  [/^fortnight$/i, 'couple of weeks'],
  // Time.
  [new RegExp(`^(?:in|since|last|this|early|late|mid)\\s+(?:${MONTHS})$`, 'i'), 'recently'],
  [new RegExp(`^(?:(?:${MONTHS})\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{4})?|\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?(?:${MONTHS})(?:\\s+\\d{4})?)$`, 'i'), 'recently'],
  [/^(?:19|20)\d\d$/, 'a while back'],
  [/^(every|on)\s+(?:mon|tues|wednes|thurs|fri|satur|sun)days?$/i, (m) => (m[1].toLowerCase() === 'every' ? 'every week' : 'one day')],
  [/^(?:last|this)\s+\w+day$/i, 'recently'],
  [/^(\d{1,2})(?::\d{2})?\s?(am|pm)$/i, (m) => partOfDay(Number(m[1]), m[2].toLowerCase() === 'pm')],
  [/^(?:I've been here |been here )?(\d+|\w+)\s+(years?|months?)(?:\s+(?:here|in|at|on|ago|into|now))?$/i, (m) => {
    const n = Number(m[1]) || NUM[m[1].toLowerCase()] || 0
    const unit = m[2].toLowerCase().startsWith('year') ? 'years' : 'months'
    const vague = unit === 'years' ? (n >= 4 ? 'years' : 'a while') : 'a few months'
    return m[0].toLowerCase().startsWith("i've been here") ? `I've been here ${vague}` : m[0].toLowerCase().startsWith('been here') ? `been here ${vague}` : vague
  }],
  // About you.
  [/^(i'?m|i am|turned)\s+(?:a\s+)?(\d{2})(?:[- ]?(?:years?[- ]old|yo|f|m))?$/i, (m) => `${m[1]} ${decade(Number(m[2]))}`],
  [/^\d{2}\s?[FfMm]$/, ''],
  [/^(.*?)\b(?:the\s+)?only\s+(?:[\w-]+\s+){0,2}([\w-]+?)s?$/i, (m) => `${m[1]}one of the ${m[2]}s`],
  [/^(?:the\s+)?(?:first|youngest|oldest|newest|last remaining)\s+(?:[\w-]+\s+){0,2}([\w-]+?)s?$/i, (m) => `one of the ${m[1]}s`],
  // Team and role.
  [/^(team|group|lab|ward|squad|unit|department)\s+of\s+\S+$/i, (m) => `small ${m[1].toLowerCase()}`],
  [/^(from\s+)?(?:\d+|\w+)\s+(people|engineers|nurses|devs|developers|designers|students)$/i, (m) => `${m[1] ?? ''}a handful of ${m[2].toLowerCase()}`],
  [/^(senior|junior|staff|principal|lead|head|chief|night[- ]shift|charge)\s+(.+)$/i, (m) => m[2]],
  // Family.
  [/^my\s+(wife|husband|boyfriend|girlfriend)$/i, 'my partner'],
  [/^my\s+(son|daughter|kids?|twins)$/i, 'my family'],
  // Places: keep the kind of place, drop its name.
  [/^(in|at|near|from|next to|across from|outside|around)\s+(?:the\s+)?(?:[A-Z][\w'-]*\s+)+(office|campus|branch|hospital|clinic|school|lab|plant|store|warehouse)$/, (m) => `${m[1]} our ${m[2]}`],
  [/^(?:the\s+)?[A-Z][\w'-]*(?:\s+[A-Z][\w'-]*)*\s+(office|campus|branch)$/, (m) => `our ${m[1]}`],
  [/^(near|next to|across from|outside|around)\s+.+$/i, 'nearby'],
  [/^(in|at|from)\s+(?:the\s+)?[A-Z].*$/, (m) => `${m[1]} the city`],
  [/^work(?:s|ing|ed)?\s+(?:at|for)\s+.+$/i, (m) => m[0].replace(/\s+(at|for)\s+.+$/i, ' $1 my company')],
]

const TIME = /^(\d{1,2})(?::\d{2})?\s?(am|pm)$/i
const ADJECTIVE: Record<string, string> = {
  'in the middle of the night': 'middle-of-the-night',
  'in the morning': 'morning',
  'in the afternoon': 'afternoon',
  'in the evening': 'evening',
  'late at night': 'late-night',
}

/**
 * The span to replace and what to put there, reading the words around the
 * giveaway so the sentence stays grammatical ("every 3am page" becomes
 * "every middle-of-the-night page"; "paged at 3am" becomes "paged in the
 * middle of the night").
 */
export function blurSpan(draft: string, tell: Pick<Tell, 'start' | 'end' | 'text'>): { start: number; end: number; replacement: string } | null {
  const text = draft.slice(tell.start, tell.end)
  const t = text.trim().match(TIME)
  if (t) {
    const phrase = partOfDay(Number(t[1]), t[2].toLowerCase() === 'pm')
    const before = draft.slice(0, tell.start)
    if (/^\s+[a-z]/i.test(draft.slice(tell.end))) return { start: tell.start, end: tell.end, replacement: ADJECTIVE[phrase] }
    const at = before.match(/\bat\s+$/i)
    if (at) return { start: tell.start - at[0].length, end: tell.end, replacement: phrase }
    return { start: tell.start, end: tell.end, replacement: phrase }
  }
  const replacement = blurFor({ text })
  return replacement == null ? null : { start: tell.start, end: tell.end, replacement }
}

export function blurFor(tell: Pick<Tell, 'text'>): string | null {
  const text = tell.text.trim()
  for (const [re, rep] of RULES) {
    const m = text.match(re)
    if (m) return typeof rep === 'string' ? rep : rep(m)
  }
  return null
}

/** Replaces one span, tidying spaces and keeping a sentence's capital letter. */
export function replaceSpan(draft: string, start: number, end: number, replacement: string): string {
  const before = draft.slice(0, start)
  const after = draft.slice(end)
  if (!replacement) {
    const left = before.replace(/[ \t]+$/, '')
    const right = after.replace(/^[ \t]+/, '')
    const joined = left && right && !/^[,.!?;:)]/.test(right) ? `${left} ${right}` : left + right
    return joined.replace(/[ \t]+([,.!?;:])/g, '$1')
  }
  const startsSentence = start === 0 || /[.!?]\s+$/.test(before) || /\n\s*$/.test(before)
  const rep = startsSentence && /^[a-z]/.test(replacement) ? replacement[0].toUpperCase() + replacement.slice(1) : replacement
  return before + rep + after
}

/**
 * Blurs every giveaway that has a safe automatic rewrite, in one pass. Spans
 * are replaced from the end of the draft backwards, so earlier offsets stay
 * valid. Giveaways with no safe rewrite are left for the AI rewrite.
 */
export function blurAll(draft: string, tells: Pick<Tell, 'start' | 'end' | 'text'>[]): { draft: string; count: number } {
  let next = draft
  let count = 0
  for (const t of [...tells].sort((a, b) => b.start - a.start)) {
    const b = blurSpan(next, t)
    if (!b) continue
    next = replaceSpan(next, b.start, b.end, b.replacement)
    count++
  }
  return { draft: next, count }
}
