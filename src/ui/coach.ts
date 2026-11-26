// The one-line hint above the draft: what to do next, from the state of the
// draft and the detective's latest run. Pure, so it's easy to test.

import type { Exposure } from '../engine/grade'
import type { HeatTell } from './heat'

export interface CoachInput {
  draft: string
  words: number
  tells: HeatTell[]
  running: boolean
  online: boolean
  /** The latest run, if the draft hasn't changed since. */
  current: Exposure | null
  /** Exposure of the very first run, to notice improvement. */
  first: number | null
  runs: number
  /** Rewrites applied since the last run. */
  fixesPending: number
}

export type Tone = 'neutral' | 'busy' | 'warn' | 'bad' | 'good'

export interface Coach {
  tone: Tone
  says: string
}

const WEIGHT = { cool: 1, warm: 2, hot: 4, hottest: 6 } as const
const RANK = { cool: 0, warm: 1, hot: 2, hottest: 3 } as const

export function heatOf(tells: HeatTell[]): number {
  return tells.reduce((s, t) => s + WEIGHT[t.heat], 0)
}

function lowerFirst(s: string) {
  return s ? s[0].toLowerCase() + s.slice(1) : s
}

export function coach(c: CoachInput): Coach {
  const heat = heatOf(c.tells)
  const anyCited = c.tells.some((t) => t.heat === 'hottest')
  const anyHot = c.tells.some((t) => t.heat === 'hot')
  const toneFromHeat: Tone = anyCited || heat >= 18 ? 'bad' : anyHot || heat >= 8 ? 'warn' : 'neutral'

  if (c.running) {
    return { tone: 'busy', says: 'The detective is reading your post. It gets the words, never the vault.' }
  }

  if (c.current) {
    const e = c.current
    if (e.score >= 50) {
      return {
        tone: 'bad',
        says: `It worked out ${e.exposed} ${e.exposed === 1 ? 'thing' : 'things'} about you${e.partial ? ` and narrowed down ${e.partial} more` : ''}. Rewrite the words it used, then test again.`,
      }
    }
    if (e.score >= 25) {
      return { tone: 'warn', says: 'It narrowed you down. A few rewrites should help.' }
    }
    if (c.first != null && c.runs > 1 && e.score < c.first) {
      return { tone: 'good', says: `Back in the crowd: ${c.first}% down to ${e.score}%. That’s the goal.` }
    }
    return { tone: 'good', says: 'It struggled to place you. One run is one sample, so a second run before you post is worth it.' }
  }

  if (!c.draft.trim()) {
    return { tone: 'neutral', says: 'Paste the post you want to publish anonymously, or try a sample story.' }
  }

  if (c.fixesPending > 0) {
    return { tone: toneFromHeat, says: 'Rewrites applied. Send the detective again to check.' }
  }

  if (!c.online) {
    return { tone: toneFromHeat, says: 'You’re offline. Giveaways are still found on this device; the detective has to wait.' }
  }

  if (!c.tells.length) {
    return {
      tone: 'neutral',
      says:
        c.words < 15
          ? 'Keep going. The detective needs a few sentences to work with.'
          : 'Nothing obvious so far. The detective looks for small things too, so send it when you’re ready.',
    }
  }

  const hottest = [...c.tells].sort((a, b) => RANK[b.heat] - RANK[a.heat] || b.end - b.start - (a.end - a.start))[0]
  const more = c.tells.length > 1 ? ` That’s one of ${c.tells.length} giveaways.` : ''
  return { tone: toneFromHeat, says: `“${hottest.text}”: ${lowerFirst(hottest.why).replace(/\.$/, '')}.${more}` }
}
