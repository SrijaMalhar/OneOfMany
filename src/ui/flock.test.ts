import { describe, expect, it } from 'vitest'
import type { Exposure, Fact } from '../engine/grade'
import { ATTRIBUTES } from '../types'
import { leavingOrder, NOBODY_AT, POOL, poolVerdict, suspectPool } from './flock'

function exposure(statuses: Fact['status'][]): Exposure {
  const facts = ATTRIBUTES.map((attribute, i) => ({ attribute, status: statuses[i] ?? 'empty' }))
  return { exposed: 0, partial: 0, safe: 0, considered: 0, score: 0, level: 'clear', facts }
}

describe('suspect pool', () => {
  it('is full when there is nothing to read', () => {
    expect(suspectPool('   ', [], null)).toEqual({ left: POOL, basis: 'empty', clues: 0 })
  })

  it('shrinks with each giveaway, more for stronger ones', () => {
    const one = suspectPool('draft', [{ heat: 'warm' }], null).left
    const strong = suspectPool('draft', [{ heat: 'hottest' }], null).left
    const two = suspectPool('draft', [{ heat: 'warm' }, { heat: 'warm' }], null).left
    expect(one).toBeLessThan(POOL)
    expect(strong).toBeLessThan(one)
    expect(two).toBeLessThan(one)
  })

  it('never drops below Nobody', () => {
    const many = Array.from({ length: 20 }, () => ({ heat: 'hottest' as const }))
    expect(suspectPool('draft', many, null).left).toBe(1)
  })

  it('follows the detective once there is a current run', () => {
    const p = suspectPool('draft', [{ heat: 'cool' }], exposure(['recovered', 'recovered', 'narrowed', 'safe']))
    expect(p.basis).toBe('detective')
    expect(p.clues).toBe(3)
    expect(p.left).toBe(Math.round(POOL * 0.5 * 0.5 * 0.8))
  })

  it('treats a run that found nothing as the whole flock', () => {
    const p = suspectPool('draft', [{ heat: 'hot' }], exposure(['safe', 'safe', 'empty']))
    expect(p.left).toBe(POOL)
    expect(poolVerdict(p).head).toBe('Lost in the flock.')
  })
})

describe('leaving order', () => {
  it('ranks every sheep except Nobody, each once', () => {
    const order = leavingOrder()
    expect(order[NOBODY_AT]).toBe(-1)
    const ranks = order.filter((r) => r >= 0).sort((a, b) => a - b)
    expect(ranks).toEqual(Array.from({ length: POOL - 1 }, (_, i) => i))
  })

  it('is the same every time', () => {
    expect(leavingOrder()).toEqual(leavingOrder())
  })
})

describe('pool verdict', () => {
  it('says found when only Nobody is left', () => {
    expect(poolVerdict({ left: 1, basis: 'giveaways', clues: 6 }).head).toBe('Found you.')
  })

  it('names where the estimate came from', () => {
    expect(poolVerdict({ left: 12, basis: 'detective', clues: 3 }).body).toContain('detective')
    expect(poolVerdict({ left: 12, basis: 'giveaways', clues: 3 }).body).toContain('this device')
  })
})
