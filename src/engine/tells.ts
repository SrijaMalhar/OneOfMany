// Deterministic "tell" detection. Runs instantly on every keystroke, offline,
// and never needs a model. The on-device model adds the subtle tells on top.

import { TELL_KINDS, type Origin, type Risk, type Tell, type TellKind } from '../types'

interface Rule {
  kind: TellKind
  risk: Risk
  why: string
  re: RegExp
}

const MONTHS =
  'January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec'
const DAYS = 'Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday'
const NUM_WORD = 'one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|a few|a couple of'
const ROLES =
  'engineer|developer|designer|manager|director|nurse|doctor|resident|intern|analyst|scientist|researcher|teacher|professor|postdoc|PhD student|grad student|recruiter|lawyer|paralegal|accountant|consultant|technician|pilot|driver|chef|cashier|pharmacist|SRE|PM|VP|lead|architect'

const RULES: Rule[] = [
  { kind: 'employer', risk: 'high', why: 'Naming where you work is the biggest giveaway', re: /\b(?:work(?:s|ing|ed)?\s+(?:at|for)|joined|employed\s+(?:at|by)|intern(?:ing|ed)?\s+at)\s+[A-Z][\w&'-]+(?:\s+[A-Z][\w&'-]+)*/g },
  { kind: 'time', risk: 'high', why: 'A specific date narrows down events', re: new RegExp(`\\b(?:${MONTHS})\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{4})?\\b`, 'gi') },
  { kind: 'time', risk: 'high', why: 'A specific date narrows down events', re: new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?(?:${MONTHS})\\b(?:\\s+\\d{4})?`, 'gi') },
  { kind: 'time', risk: 'medium', why: 'Months and years pin down when things happened', re: new RegExp(`\\b(?:in|since|last|this|early|late|mid)\\s+(?:${MONTHS})\\b`, 'gi') },
  { kind: 'time', risk: 'medium', why: 'A year anchors your story in time', re: /\b(?:19[5-9]\d|20[0-4]\d)\b/g },
  { kind: 'time', risk: 'low', why: 'Routine days can match rosters or schedules', re: new RegExp(`\\b(?:every|on|last|this)\\s+(?:${DAYS})s?\\b`, 'gi') },
  { kind: 'time', risk: 'medium', why: 'Exact times can match shift patterns or logs', re: /\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/gi },
  { kind: 'time', risk: 'medium', why: 'Tenure and durations narrow who it could be', re: new RegExp(`\\b(?:\\d+|${NUM_WORD})\\s+(?:years?|months?)\\b(?:\\s+(?:here|in|at|on|ago|into|now))?`, 'gi') },
  { kind: 'demographic', risk: 'high', why: 'Age is a strong identifier', re: /\b(?:i'?m|i am|as a|turned)\s+(?:a\s+)?\d{2}\b(?:[- ]?(?:years?[- ]old|yo|f|m))?/gi },
  { kind: 'demographic', risk: 'high', why: 'Age and gender shorthand is a strong identifier', re: /\b\d{2}\s?[FfMm]\b(?=[\s,.)!?]|$)/g },
  { kind: 'demographic', risk: 'high', why: 'Being "the only" one makes you unique', re: /\b(?:the\s+)?only\s+(?:\w+\s+){0,2}(?:woman|women|man|men|person|one|girl|guy|mother|dad|mom|engineer|nurse|designer|student|hire|intern|employee|member)\b/gi },
  { kind: 'demographic', risk: 'high', why: 'Being "the first" or "youngest" makes you unique', re: /\b(?:the\s+)?(?:first|youngest|oldest|newest|last remaining)\s+(?:\w+\s+){0,2}(?:woman|man|person|hire|engineer|nurse|member|employee|student|one)\b/gi },
  { kind: 'team_or_role', risk: 'medium', why: 'Team size narrows the group', re: new RegExp(`\\b(?:team|group|lab|ward|squad|unit|department)\\s+of\\s+(?:\\d+|${NUM_WORD})\\b`, 'gi') },
  { kind: 'team_or_role', risk: 'medium', why: 'Headcounts narrow the group', re: new RegExp(`\\b(?:from\\s+)?(?:\\d+|${NUM_WORD})\\s+(?:people|engineers|nurses|devs|developers|designers|of us|students)\\b`, 'gi') },
  { kind: 'team_or_role', risk: 'medium', why: 'Your job title narrows the group', re: new RegExp(`\\b(?:i'?m|i am|as|work as|working as|i was)\\s+(?:a|an|the)?\\s*(?:[\\w-]+\\s+){0,2}(?:${ROLES})s?\\b`, 'gi') },
  { kind: 'team_or_role', risk: 'medium', why: 'A specific title narrows the group', re: new RegExp(`\\b(?:senior|junior|staff|principal|lead|head|chief|night[- ]shift|charge)\\s+(?:${ROLES})s?\\b`, 'gi') },
  { kind: 'relationship', risk: 'low', why: 'Family details add up', re: /\bmy\s+(?:wife|husband|partner|boyfriend|girlfriend|son|daughter|kids?|twins|mom|dad|mother|father|sister|brother)\b/gi },
  { kind: 'location', risk: 'high', why: 'A named place is a direct location clue', re: /\b(?:in|at|near|from|next to|across from|outside|around)\s+(?:the\s+)?[A-Z][\w'-]+(?:\s+(?:(?:of|de|la)\s+)?[A-Z][\w'-]+)*/g },
  { kind: 'location', risk: 'high', why: 'Landmarks pin down where you are', re: /\b(?:lake|river|bridge|station|terminal|airport|campus|mall|stadium|metro|tower|park|harbou?r|ferry|beach|hospital|clinic|university|college)\b/gi },
  { kind: 'other', risk: 'high', why: 'Contact details identify you directly', re: /[\w.+-]+@[\w-]+\.[\w.]+/g },
  { kind: 'other', risk: 'high', why: 'Links can point straight back to you', re: /\bhttps?:\/\/\S+/gi },
  { kind: 'other', risk: 'high', why: 'Handles identify accounts', re: /(?:^|\s)@[A-Za-z0-9_]{3,}/g },
  { kind: 'style', risk: 'low', why: 'Repeated punctuation is a writing-style fingerprint', re: /[!?]{3,}|\.{4,}/g },

  // Dialect: words that say where you learned your English. A name scrubber
  // never catches these, and a detective uses them first.
  { kind: 'dialect', risk: 'medium', why: 'Typical of Indian English, so it points to India', re: /\b(?:(?:kindly )?do the needful|kindly (?:revert|share|check|confirm)|prepone[ds]?|revert back|out of station|cousin (?:brother|sister)|passed out (?:of|from)|timepass|yaar)\b/gi },
  { kind: 'dialect', risk: 'medium', why: 'Indian number words point to South Asia', re: /\b(?:\d+(?:\.\d+)?\s?)?(?:lakhs?|crores?)\b/gi },
  { kind: 'dialect', risk: 'low', why: 'British-style spelling or slang narrows where you’re from', re: /\b(?:colour(?:ed|s)?|favourite|neighbour(?:s|hood)?|whilst|innit|fortnight|knackered|gutted|flatmates?)\b/gi },
  { kind: 'dialect', risk: 'low', why: 'American spelling or terms point to the US', re: /\b(?:y'all|fall semester|freshman year|sophomore year|zip code|401\(?k\)?|color(?:ed|s)?|favorite|neighbor(?:s|hood)?)\b/gi },
  { kind: 'dialect', risk: 'medium', why: 'Regional slang points to Australia or Canada', re: /\b(?:arvo|servo|bogan|maccas|toque|loonie|toonie|double-double)\b/gi },
  { kind: 'dialect', risk: 'medium', why: 'A currency points to a country', re: /(?:₹|£|€|\bRs\.?\s?(?=\d)|\bINR\b|\b[ACS]\$|\brupees?\b)\s?(?:\d[\d,]*(?:\.\d+)?)?/gi },
  { kind: 'dialect', risk: 'medium', why: 'A time zone points to a region', re: /\b(?:IST|PST|PDT|EST|EDT|CST|CDT|GMT|BST|CET|AEST|SGT)\b/g },

  // Style: habits that link your accounts to each other.
  { kind: 'style', risk: 'low', why: 'Signature abbreviations are a writing fingerprint', re: /\b(?:lol|lmao|tbh|imo|imho|ngl|smh|fwiw)\b/gi },
  { kind: 'style', risk: 'low', why: 'Emoji habits can link your accounts', re: /\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/gu },
]

const RISK_RANK: Record<Risk, number> = { low: 0, medium: 1, high: 2 }

/** Words that start "in X" style matches but are not places. */
const NOT_PLACES = new Set([
  'I', 'The', 'My', 'Our', 'A', 'An', 'This', 'That', 'It', 'We', 'They', 'He', 'She', 'You', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday', 'Sunday', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December', 'Slack', 'Zoom', 'Teams', 'Email', 'Google Meet',
])

export function ruleTells(draft: string): Tell[] {
  const out: Tell[] = []
  for (const rule of RULES) {
    rule.re.lastIndex = 0
    for (const m of draft.matchAll(rule.re)) {
      let text = m[0]
      let start = m.index ?? 0
      // Trim leading whitespace captured by some patterns.
      const lead = text.length - text.trimStart().length
      start += lead
      text = text.trim()
      if (text.length < 2) continue
      if (rule.kind === 'location' && rule.re.source.startsWith('\\b(?:in|at')) {
        const place = text.replace(/^\w+(?:\s+to|\s+from)?\s+(?:the\s+)?/i, '')
        const first = place.split(/\s+/)[0]
        if (NOT_PLACES.has(first) || NOT_PLACES.has(place)) continue
      }
      out.push({ start, end: start + text.length, text, kind: rule.kind, why: rule.why, risk: rule.risk, origins: ['rule'] })
    }
  }
  return withText(draft, mergeTells(out))
}

/** Locate a model-reported quote inside the draft. Returns -1 when not found. */
export function locate(draft: string, quote: string): number {
  const q = quote.trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
  if (!q) return -1
  const exact = draft.indexOf(q)
  if (exact >= 0) return exact
  return draft.toLowerCase().indexOf(q.toLowerCase())
}

export interface ModelTell {
  quote: string
  kind: string
  why: string
  risk: string
}

export function modelTells(draft: string, items: ModelTell[], origin: Origin): Tell[] {
  const out: Tell[] = []
  for (const it of items) {
    const quote = (it.quote ?? '').trim()
    const at = locate(draft, quote)
    if (at < 0 || quote.length < 2) continue
    const len = quote.replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').length
    const kind = (isKind(it.kind) ? it.kind : 'other') as TellKind
    const risk = (['low', 'medium', 'high'].includes(it.risk) ? it.risk : 'medium') as Risk
    out.push({ start: at, end: at + len, text: draft.slice(at, at + len), kind, why: it.why || 'Could help identify you', risk, origins: [origin] })
  }
  return out
}

function isKind(k: string): boolean {
  return (TELL_KINDS as readonly string[]).includes(k)
}

/** Merge overlapping spans, keeping the highest risk and combining origins. */
export function mergeTells(tells: Tell[]): Tell[] {
  const sorted = [...tells].sort((a, b) => a.start - b.start || b.end - a.end)
  const merged: Tell[] = []
  for (const t of sorted) {
    const last = merged[merged.length - 1]
    if (last && t.start < last.end) {
      const winner = RISK_RANK[t.risk] > RISK_RANK[last.risk] ? t : last
      merged[merged.length - 1] = {
        ...winner,
        start: Math.min(last.start, t.start),
        end: Math.max(last.end, t.end),
        text: '',
        origins: Array.from(new Set([...last.origins, ...t.origins])),
      }
    } else {
      merged.push({ ...t })
    }
  }
  return merged
}

export function withText(draft: string, tells: Tell[]): Tell[] {
  return tells.map((t) => ({ ...t, text: draft.slice(t.start, t.end) }))
}

export function combineTells(draft: string, ...groups: Tell[][]): Tell[] {
  return withText(draft, mergeTells(groups.flat()))
}
