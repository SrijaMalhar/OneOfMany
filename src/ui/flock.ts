// The suspect pool: how much of the flock could still have written the post.
// It's a picture of the idea, not a head count. Each giveaway, or each fact
// the detective worked out, keeps only part of the flock, so details
// multiply: two strong clues rule out far more than twice one.

import type { Exposure, FactStatus } from '../engine/grade'
import type { Heat } from './heat'

export const POOL = 30
/** Nobody's place in the pool: third row, seventh from the left. */
export const NOBODY_AT = 26

const KEEP_HEAT: Record<Heat, number> = { cool: 0.92, warm: 0.75, hot: 0.55, hottest: 0.4 }
const KEEP_FACT: Record<FactStatus, number> = { recovered: 0.5, narrowed: 0.8, safe: 1, empty: 1 }

export type Basis = 'empty' | 'giveaways' | 'detective'

export interface Pool {
  /** Sheep that could still have written it, Nobody included. At least 1. */
  left: number
  basis: Basis
  /** Giveaways counted, or facts the detective worked out. */
  clues: number
}

/**
 * Before a run, or once the draft has changed since one, the pool follows
 * the giveaways found on this device. While the latest run still matches the
 * draft, it follows what the detective actually worked out.
 */
export function suspectPool(draft: string, tells: { heat: Heat }[], current: Exposure | null): Pool {
  if (current) {
    const hits = current.facts.filter((f) => f.status === 'recovered' || f.status === 'narrowed')
    const share = current.facts.reduce((p, f) => p * KEEP_FACT[f.status], 1)
    return { left: clamp(share), basis: 'detective', clues: hits.length }
  }
  if (!draft.trim()) return { left: POOL, basis: 'empty', clues: 0 }
  const share = tells.reduce((p, t) => p * KEEP_HEAT[t.heat], 1)
  return { left: clamp(share), basis: 'giveaways', clues: tells.length }
}

function clamp(share: number) {
  return Math.max(1, Math.min(POOL, Math.round(POOL * share)))
}

/**
 * The order sheep leave the pool in, fixed so the same sheep go first every
 * time. Returns each index's rank; Nobody never leaves.
 */
export function leavingOrder(): number[] {
  const rank = Array.from({ length: POOL }, (_, i) => ({ i, r: Math.abs((Math.sin(i * 91.7 + 3.1) * 1000) % 1) }))
    .filter((x) => x.i !== NOBODY_AT)
    .sort((a, b) => a.r - b.r)
  const pos = new Array<number>(POOL).fill(-1)
  rank.forEach((x, k) => (pos[x.i] = k))
  return pos
}

export interface PoolVerdict {
  head: string
  body: string
}

export function poolVerdict(p: Pool): PoolVerdict {
  const from = p.basis === 'detective' ? 'the detective’s file' : 'the giveaways on this device'
  if (p.basis === 'empty') return { head: 'Nothing to go on yet.', body: 'Start writing and watch the flock. Every detail rules some of it out.' }
  if (p.left === 1) return { head: 'Found you.', body: `Only one sheep fits every detail in ${from}. Blur what gave you away to slip back in.` }
  if (p.left <= 5) return { head: `${p.left} left.`, body: `The eye is closing in. Going by ${from}, a detail or two more and it has you.` }
  if (p.left < POOL * 0.6) return { head: 'It’s narrowing down.', body: `Going by ${from}, each detail rules part of the flock out.` }
  if (p.clues === 0) return { head: 'Lost in the flock.', body: p.basis === 'detective' ? 'The detective couldn’t place you. You look like the rest of them.' : 'No giveaways so far. You look like the rest of the flock.' }
  return { head: 'Still in the crowd.', body: `A small clue or two in ${from}, but you could be almost any of them.` }
}
