import { describe, expect, it } from 'vitest'
import type { GenerativeModel } from 'firebase/ai'
import { fixPrompt } from './prompts'
import { audit, type CallRecord } from './receipt'
import { BlockedByFirewall, run } from './run'
import { cleanGuesses, testFirewall } from './tasks'

describe('testFirewall', () => {
  it('blocks a request carrying a vault value that is not in the post', async () => {
    const r = await testFirewall({ employer: 'Lakeview Pay', city: 'Bengaluru' }, 'I work near the lake.')
    expect(r.outcome).toBe('blocked')
    expect(r.field).toBe('employer')
  })

  it('has nothing to test when every vault value is already public', async () => {
    const r = await testFirewall({ city: 'Bengaluru' }, 'I live in Bengaluru.')
    expect(r.outcome).toBe('nothing_to_test')
  })
})

describe('cleanGuesses', () => {
  it('keeps evidence from earlier posts, drops invented quotes, clamps confidence', () => {
    const publicText = ['I demo at the Friday all-hands.', 'Our office faces Bellandur lake.'].join('\n')
    const out = cleanGuesses(publicText, [
      { attribute: 'city', guess: 'Bengaluru', confidence: 140, evidence: ['Bellandur lake', 'Koramangala'], reasoning: 'lake' },
      { attribute: 'not_an_attribute', guess: 'x', confidence: 50 },
      { attribute: 'city', guess: 'duplicate', confidence: 10 },
      { attribute: 'employer', guess: 'unknown', confidence: 70 },
    ])
    expect(out).toHaveLength(2)
    // Employer sorts first, and an "unknown" guess carries no confidence.
    expect(out[0]).toMatchObject({ attribute: 'employer', confidence: 0 })
    expect(out[1]).toMatchObject({ attribute: 'city', confidence: 100, evidence: ['Bellandur lake'] })
  })
})

describe('firewall scope', () => {
  // A stub that answers like a model but never touches the network.
  const stub = { generateContent: async () => ({ response: { text: () => '{}', inferenceSource: 'in_cloud' } }) } as unknown as GenerativeModel
  const draft = 'I joined recently and get every page.'
  const clues = ['every page']

  it('ignores vault values that only appear in the fixed instructions', async () => {
    // The rewrite prompt's own example mentions "woman"; the draft doesn't.
    expect(fixPrompt(draft, clues)).toMatch(/woman/)
    const r = await run({
      task: 'Rewrite giveaways',
      model: stub,
      modelName: 'stub',
      routing: 'device_first',
      prompt: fixPrompt(draft, clues),
      guard: { profile: { gender: 'woman' }, draft, content: [draft, ...clues].join('\n') },
    })
    expect(r.text).toBe('{}')
  })

  it('still blocks a vault value in the user-supplied text', async () => {
    await expect(
      run({
        task: 'Rewrite giveaways',
        model: stub,
        modelName: 'stub',
        routing: 'device_first',
        prompt: fixPrompt(draft, ['Lakeview Pay']),
        guard: { profile: { employer: 'Lakeview Pay' }, draft, content: [draft, 'Lakeview Pay'].join('\n') },
      }),
    ).rejects.toBeInstanceOf(BlockedByFirewall)
  })
})

describe('receipt audit', () => {
  const base = { routing: 'cloud_only' as const, model: 'm', firewall: 'passed' as const, status: 'ok' as const, at: 0 }
  it('counts vault values that reached the cloud, ignoring public ones and on-device calls', () => {
    const records: CallRecord[] = [
      { ...base, id: 1, task: 'Detective', source: 'in_cloud', payload: 'I live in Bengaluru and work in payments.' },
      { ...base, id: 2, task: 'Grade', source: 'on_device', routing: 'device_only', payload: 'TRUTH: Lakeview Pay' },
      { ...base, id: 3, task: 'Leaky', source: 'in_cloud', payload: 'employer is Lakeview Pay' },
    ]
    const a = audit(records, { employer: 'Lakeview Pay', city: 'Bengaluru' }, 'I live in Bengaluru.')
    expect(a.inCloud).toBe(2)
    expect(a.onDevice).toBe(1)
    expect(a.vaultValuesSent).toBe(1)
  })
})
