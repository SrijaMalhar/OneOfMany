// Writing style, on this device only. People are often linked across
// accounts by how they write rather than what they say: the same "!!!", a
// lowercase "i", a space before the question mark, British spelling, the
// same rhythm of small words. This finds those habits in a draft and, given
// something the author wrote under their real name, says how alike the two
// read. Nothing here calls a model or the network.

export type HabitId =
  | 'exclaim'
  | 'ellipsis'
  | 'dash'
  | 'lower_i'
  | 'lower_start'
  | 'double_space'
  | 'space_before_punct'
  | 'curly_quotes'
  | 'british'
  | 'american'
  | 'netspeak'
  | 'emoji'
  | 'caps'
  | 'semicolon'
  | 'parens'
  | 'no_contractions'
  | 'long_sentences'
  | 'short_sentences'

export interface Habit {
  id: HabitId
  label: string
  /** How to stop it giving you away. */
  tip: string
  count: number
}

interface Rule {
  id: HabitId
  label: string
  tip: string
  count: (t: string, s: Stats) => number
}

interface Stats {
  words: string[]
  sentences: string[]
}

const BRITISH =
  /\b(?:colour|favourite|behaviour|neighbour|honour|labour|centre|theatre|organis(?:e|ed|ing|ation)|realis(?:e|ed|ing)|recognis(?:e|ed|ing)|apologis(?:e|ed|ing)|travelled|travelling|cancelled|whilst|amongst|fortnight|mum|flat(?:mate)?s?)\b/gi
const AMERICAN =
  /\b(?:color|favorite|behavior|neighbor|honor|labor|center|theater|organiz(?:e|ed|ing|ation)|realiz(?:e|ed|ing)|recogniz(?:e|ed|ing)|apologiz(?:e|ed|ing)|traveled|traveling|canceled|mom|apartment|y'all)\b/gi
const NETSPEAK = /\b(?:lol|lmao|tbh|imo|imho|ngl|smh|idk|btw|fwiw|irl|afaik|rn|u|ur|pls|plz)\b/gi
const EMOJI = /\p{Extended_Pictographic}/gu
const CONTRACTION = /\b\w+'(?:s|t|re|ve|ll|d|m)\b|\b\w+’(?:s|t|re|ve|ll|d|m)\b/gi
const UNCONTRACTED = /\b(?:do not|does not|did not|is not|are not|was not|cannot|can not|will not|would not|should not|could not|i am|it is|that is|i have|we are|they are|you are)\b/gi

const n = (re: RegExp) => (t: string) => (t.match(re) ?? []).length

// Capitals are shouting only when they spell an ordinary word. Most short
// all-caps words in a post are acronyms: CTC, UPI, ICU, NASA.
const SHOUT_SHORT = new Set(['NOT', 'THE', 'AND', 'BUT', 'WHY', 'HOW', 'YOU', 'ALL', 'NOW', 'WAS', 'ANY', 'ONE', 'OUR', 'HIM', 'HER', 'DID', 'CAN', 'YES', 'OMG', 'WTF'])
const ACRONYMS = new Set(['NASA', 'FAANG', 'AWOL', 'ASAP', 'NATO', 'UNESCO', 'OPEC', 'COVID', 'SCRUM', 'JIRA', 'LASIK', 'IKEA', 'UEFA', 'FIFA'])
function isShouting(word: string) {
  if (word.length === 3) return SHOUT_SHORT.has(word)
  return /[AEIOU]/.test(word) && !ACRONYMS.has(word)
}

const RULES: Rule[] = [
  { id: 'exclaim', label: 'Doubled-up !! or ?!', tip: 'Use a single ! or none at all.', count: n(/[!?]{2,}/g) },
  { id: 'ellipsis', label: 'Trailing off with …', tip: 'End the sentence instead of trailing off.', count: n(/\.{3,}|…/g) },
  { id: 'dash', label: 'Dashes between thoughts', tip: 'Split the thought into two sentences.', count: n(/—|–|\s--?\s/g) },
  { id: 'lower_i', label: 'Lowercase “i”', tip: 'Write “I”, the way most people do.', count: n(/(?:^|[\s(])i(?=[\s'’,.!?]|$)/gm) },
  {
    id: 'lower_start',
    label: 'Sentences that start lowercase',
    tip: 'Start sentences with a capital.',
    count: (_t, s) => {
      const lower = s.sentences.filter((x) => /^[a-z]/.test(x)).length
      return s.sentences.length >= 2 && lower / s.sentences.length >= 0.5 ? lower : 0
    },
  },
  { id: 'double_space', label: 'Two spaces after a full stop', tip: 'Use one space after a full stop.', count: n(/[.!?] {2,}(?=\S)/g) },
  { id: 'space_before_punct', label: 'A space before ? or !', tip: 'Put ? and ! right after the word.', count: n(/\w (?=[?!:;](?:\s|$))/g) },
  { id: 'curly_quotes', label: 'Curly quotes and apostrophes', tip: 'Curly quotes can show which device or app you typed on.', count: n(/[‘’“”]/g) },
  { id: 'british', label: 'British spelling', tip: 'Spelling says where you learned to write. Pick neutral words.', count: n(BRITISH) },
  { id: 'american', label: 'American spelling', tip: 'Spelling says where you learned to write. Pick neutral words.', count: n(AMERICAN) },
  { id: 'netspeak', label: 'Shorthand like tbh, imo, lol', tip: 'Write the words out, or leave them out.', count: n(NETSPEAK) },
  { id: 'emoji', label: 'Emoji', tip: 'Leave emoji out; the same ones show up across your accounts.', count: n(EMOJI) },
  { id: 'caps', label: 'WORDS IN CAPITALS for emphasis', tip: 'Drop the capitals.', count: (t) => (t.match(/\b[A-Z]{3,}\b/g) ?? []).filter(isShouting).length },
  { id: 'semicolon', label: 'Semicolons', tip: 'Most people rarely use them; a full stop is plainer.', count: n(/;/g) },
  { id: 'parens', label: 'Asides in brackets', tip: 'Fold the aside into the sentence, or cut it.', count: n(/\([^)]{3,}\)/g) },
  {
    id: 'no_contractions',
    label: 'No contractions (“do not”, “I am”)',
    tip: 'Mix in contractions like “don’t” and “I’m”.',
    count: (t) => {
      const full = (t.match(UNCONTRACTED) ?? []).length
      const short = (t.match(CONTRACTION) ?? []).length
      return full >= 3 && short === 0 ? full : 0
    },
  },
  {
    id: 'long_sentences',
    label: 'Long, winding sentences',
    tip: 'Break a few long sentences up.',
    count: (_t, s) => (s.sentences.length >= 2 && average(s) >= 28 ? s.sentences.length : 0),
  },
  {
    id: 'short_sentences',
    label: 'Short, clipped sentences',
    tip: 'Join a couple of short sentences.',
    count: (_t, s) => (s.sentences.length >= 4 && average(s) <= 7 ? s.sentences.length : 0),
  },
]

function average(s: Stats) {
  return s.words.length / Math.max(1, s.sentences.length)
}

function stats(text: string): Stats {
  const words = text.toLowerCase().match(/[\p{L}\p{N}'’]+/gu) ?? []
  const sentences = text
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((x) => x.trim())
    .filter((x) => /\p{L}/u.test(x))
  return { words, sentences }
}

/** The habits in a piece of writing, most frequent first. */
export function habits(text: string): Habit[] {
  if (!text.trim()) return []
  const s = stats(text)
  const out: Habit[] = []
  for (const r of RULES) {
    const count = r.count(text, s)
    if (count > 0) out.push({ id: r.id, label: r.label, tip: r.tip, count })
  }
  return out.sort((a, b) => b.count - a.count)
}

// The small words everybody uses, at rates that differ from person to person.
// Their frequencies are a classic stylometric signal.
const FUNCTION_WORDS = [
  'the', 'a', 'an', 'and', 'but', 'or', 'so', 'because', 'if', 'then', 'that', 'which', 'who', 'this', 'these', 'it', 'its',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'they', 'them', 'their', 'he', 'she', 'his', 'her', 'of', 'in', 'on', 'at',
  'to', 'for', 'with', 'from', 'by', 'about', 'as', 'into', 'just', 'really', 'very', 'actually', 'still', 'even', 'also',
  'not', 'no', 'all', 'some', 'any', 'more', 'most', 'is', 'was', 'are', 'were', 'be', 'been', 'have', 'has', 'had', 'do',
  'did', 'can', 'could', 'would', 'should', 'will', 'what', 'when', 'how', 'why', 'there', 'here', 'like', 'though', 'anyway',
]

function functionProfile(words: string[]): number[] {
  const counts = new Map<string, number>()
  for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1)
  const total = Math.max(1, words.length)
  return FUNCTION_WORDS.map((w) => (counts.get(w) ?? 0) / total)
}

function trigrams(text: string): Map<string, number> {
  const t = ` ${text.toLowerCase().replace(/\s+/g, ' ').trim()} `
  const m = new Map<string, number>()
  for (let i = 0; i + 3 <= t.length; i++) {
    const g = t.slice(i, i + 3)
    m.set(g, (m.get(g) ?? 0) + 1)
  }
  return m
}

export function cosine(a: number[] | Map<string, number>, b: number[] | Map<string, number>): number {
  let dot = 0
  let na = 0
  let nb = 0
  if (Array.isArray(a) && Array.isArray(b)) {
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i]
      na += a[i] * a[i]
      nb += b[i] * b[i]
    }
  } else if (a instanceof Map && b instanceof Map) {
    for (const [k, v] of a) {
      dot += v * (b.get(k) ?? 0)
      na += v * v
    }
    for (const v of b.values()) nb += v * v
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0
}

const rescale = (x: number, lo: number, hi: number) => Math.max(0, Math.min(1, (x - lo) / (hi - lo)))

export const MIN_WORDS = 40

export interface StyleMatch {
  /** 0 to 100: how alike the two read. A rough guide, not proof. */
  score: number
  level: 'strong' | 'some' | 'weak'
  /** Habits both texts share: the ones that could link them. */
  shared: Habit[]
  /** Habits in your known writing that the draft avoids. */
  avoided: Habit[]
  /** Neither text has a distinctive habit, so there is little to compare. */
  bland: boolean
}

/**
 * How alike a draft and a sample of the author's known writing read.
 *
 * Shared habits carry most of the weight: they're what a reader notices,
 * and on posts this short they're the only reliable signal. The rhythm of
 * small function words and the texture of letter sequences add a little;
 * on a few sentences they're noisy and the letters pick up the topic, so
 * they never decide the result on their own.
 */
export function styleMatch(draft: string, known: string): StyleMatch {
  const d = habits(draft)
  const k = habits(known)
  const kIds = new Set(k.map((h) => h.id))
  const dIds = new Set(d.map((h) => h.id))
  const shared = d.filter((h) => kIds.has(h.id))
  const avoided = k.filter((h) => !dIds.has(h.id))
  const union = new Set([...dIds, ...kIds]).size
  const fw = rescale(cosine(functionProfile(stats(draft).words), functionProfile(stats(known).words)), 0.2, 0.9)
  const grams = rescale(cosine(trigrams(draft), trigrams(known)), 0.1, 0.6)
  if (!union) {
    // Nothing distinctive on either side: say so rather than guess.
    return { score: Math.round(10 + 15 * grams + 10 * fw), level: 'weak', shared, avoided, bland: true }
  }
  const score = Math.round(100 * (0.7 * (shared.length / union) + 0.15 * fw + 0.15 * grams))
  const level = score >= 60 ? 'strong' : score >= 35 ? 'some' : 'weak'
  return { score, level, shared, avoided, bland: false }
}

export function wordCount(text: string): number {
  return (text.match(/\S+/g) ?? []).length
}
