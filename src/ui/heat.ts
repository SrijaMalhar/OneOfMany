// Maps giveaways to a strength level for the editor and the list: cool for
// small clues, up to hottest for the words the detective actually used
// against you.

import { locate } from '../engine/tells'
import { ATTRIBUTE_LABEL, type Attribute, type DetectiveGuess, type Tell, type TellKind } from '../types'

export type Heat = 'cool' | 'warm' | 'hot' | 'hottest'

export interface HeatTell extends Tell {
  heat: Heat
  /** The detective quoted this span as evidence. */
  cited: boolean
  /** Facts the detective worked out from this span. */
  attrs: Attribute[]
}

export interface CitedTell extends Tell {
  attribute: Attribute
}

export const HEAT_LABEL: Record<Heat, string> = {
  cool: 'Small clue',
  warm: 'Narrows it down',
  hot: 'Strong clue',
  hottest: 'Used by the detective',
}

const KIND_FOR: Record<Attribute, TellKind> = {
  employer: 'employer',
  industry: 'workplace_detail',
  city: 'location',
  country: 'location',
  team_or_department: 'team_or_role',
  job_role: 'team_or_role',
  seniority: 'team_or_role',
  tenure: 'time',
  age_range: 'demographic',
  gender: 'demographic',
}

/** Detective evidence as spans in the draft, so it can be marked and rewritten. */
export function evidenceTells(draft: string, guesses: DetectiveGuess[], minConfidence: number): CitedTell[] {
  const out: CitedTell[] = []
  for (const g of guesses) {
    if (g.confidence < minConfidence / 2) continue
    for (const e of g.evidence) {
      const at = locate(draft, e)
      if (at < 0) continue
      const len = e.trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').length
      out.push({
        start: at,
        end: at + len,
        text: draft.slice(at, at + len),
        kind: KIND_FOR[g.attribute],
        why: `The detective used this to work out your ${ATTRIBUTE_LABEL[g.attribute].toLowerCase()}`,
        risk: 'high',
        origins: ['in_cloud'],
        attribute: g.attribute,
      })
    }
  }
  return out
}

export function withHeat(tells: Tell[], cited: CitedTell[]): HeatTell[] {
  return tells.map((t) => {
    const hits = cited.filter((c) => c.start < t.end && c.end > t.start)
    const heat: Heat = hits.length ? 'hottest' : t.risk === 'high' ? 'hot' : t.risk === 'medium' ? 'warm' : 'cool'
    return { ...t, heat, cited: hits.length > 0, attrs: Array.from(new Set(hits.map((c) => c.attribute))) }
  })
}
