// What Nobody says and how it looks, from the state of the draft and the
// detective's latest run. Pure, so it's easy to test.

import type { Exposure } from '../engine/grade'
import type { HeatTell } from './heat'
import type { Glow, Mood } from './Nobody'

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

export interface Coach {
  mood: Mood
  glow: Glow
  says: string
  singledOut: boolean
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
  const glowFromHeat: Glow = anyCited ? 'hottest' : heat >= 18 ? 'hot' : heat >= 8 ? 'warm' : 'none'
  const moodFromHeat: Mood = heat >= 18 || anyCited ? 'worried' : 'calm'

  if (c.running) {
    return { mood: 'worried', glow: glowFromHeat, singledOut: false, says: 'Shh. The Cyclops is reading our post. It gets the words, never the vault.' }
  }

  if (c.current) {
    const e = c.current
    if (e.score >= 50) {
      return {
        mood: 'exposed',
        glow: 'hottest',
        singledOut: true,
        says: `It worked out ${e.exposed} ${e.exposed === 1 ? 'thing' : 'things'} about us${e.partial ? ` and narrowed down ${e.partial} more` : ''}. Let’s cool down the hottest words.`,
      }
    }
    if (e.score >= 25) {
      return { mood: 'worried', glow: 'hot', singledOut: false, says: 'It narrowed us down. A few rewrites should help.' }
    }
    if (c.first != null && c.runs > 1 && e.score < c.first) {
      return { mood: 'happy', glow: 'none', singledOut: false, says: `Lost in the flock again: ${c.first}% down to ${e.score}%. That’s the goal.` }
    }
    return {
      mood: 'calm',
      glow: 'none',
      singledOut: false,
      says: 'It struggled to find us. One run is one sample, so a second try before you post is worth it.',
    }
  }

  if (!c.draft.trim()) {
    return {
      mood: 'calm',
      glow: 'none',
      singledOut: false,
      says: 'Hi, I’m Nobody. Paste the post you want to publish anonymously, and we’ll check it before anyone else does.',
    }
  }

  if (c.fixesPending > 0) {
    return { mood: 'calm', glow: glowFromHeat, singledOut: false, says: 'Cooler already. Send the Cyclops again to check.' }
  }

  if (!c.online) {
    return { mood: moodFromHeat, glow: glowFromHeat, singledOut: false, says: 'We’re offline. I can still spot giveaways; the Cyclops has to wait.' }
  }

  if (!c.tells.length) {
    return {
      mood: 'calm',
      glow: 'none',
      singledOut: false,
      says:
        c.words < 15
          ? 'Keep going. The detective needs a few sentences to work with.'
          : 'I can’t spot anything obvious. The detective looks for small things too, so send it when you’re ready.',
    }
  }

  const hottest = [...c.tells].sort((a, b) => RANK[b.heat] - RANK[a.heat] || b.end - b.start - (a.end - a.start))[0]
  const more = c.tells.length > 1 ? ` That’s one of ${c.tells.length} giveaways I can see.` : ''
  return {
    mood: moodFromHeat,
    glow: glowFromHeat,
    singledOut: false,
    says: `“${hottest.text}”: ${lowerFirst(hottest.why).replace(/\.$/, '')}.${more}`,
  }
}
