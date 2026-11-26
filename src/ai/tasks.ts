// The four AI jobs. Each picks its inference mode for a privacy reason.

import type { GenerativeModel, GroundingMetadata } from 'firebase/ai'
import { gradeAll, gradeOne, isUnknownGuess } from '../engine/grade'
import { meaningKept } from '../engine/meaning'
import { locate, modelTells, type ModelTell } from '../engine/tells'
import { containsPhrase } from '../engine/text'
import type { Settings } from '../firebase'
import {
  ATTRIBUTES,
  type Attribute,
  type DetectiveGuess,
  type DetectiveReport,
  type Fix,
  type Grade,
  type MeaningCheck,
  type Profile,
  type Tell,
} from '../types'
import { modelFor } from './models'
import { detectivePrompt, fixPrompt, gradePrompt, lintPrompt, meaningPrompt, structurePrompt } from './prompts'
import { BlockedByFirewall, parseJson, run, TimedOut } from './run'
import { DETECTIVE_SCHEMA, FIX_SCHEMA, GRADE_SCHEMA, MEANING_SCHEMA, TELLS_SCHEMA } from './schemas'

// ---------------------------------------------------------------- lint

export async function findTells(draft: string, profile: Profile, s: Settings): Promise<{ tells: Tell[]; source: 'on_device' | 'in_cloud' }> {
  const model = modelFor({ job: 'lint', routing: 'device_first', cloudModel: s.fastModel, schema: TELLS_SCHEMA, temperature: 0.2 })
  const r = await run({ task: 'Find giveaways', model, modelName: s.fastModel, routing: 'device_first', prompt: lintPrompt(draft), guard: { profile, draft } })
  const parsed = parseJson<{ tells: ModelTell[] }>(r.text)
  return { tells: modelTells(draft, parsed?.tells ?? [], r.source), source: r.source }
}

// ---------------------------------------------------------------- detective

interface RawGuess {
  attribute?: string
  guess?: string
  confidence?: number | string
  evidence?: string[] | string
  reasoning?: string
}
interface RawReport {
  guesses?: RawGuess[]
  crowdSize?: string
  nextStep?: string
}

interface Attempt {
  model: string
  search: boolean
  lowThinking: boolean
  timeoutMs: number
}

// Session memory of what didn't work, so later runs skip straight past it.
const SEARCH_OFF_KEY = 'oneofmany.searchUnavailable.v1'
const SLOW_KEY = 'oneofmany.slowModels.v1'

function remembered(key: string, model: string): boolean {
  try {
    return (JSON.parse(sessionStorage.getItem(key) ?? '[]') as string[]).includes(model)
  } catch {
    return false
  }
}

function remember(key: string, model: string) {
  try {
    const list = JSON.parse(sessionStorage.getItem(key) ?? '[]') as string[]
    sessionStorage.setItem(key, JSON.stringify(Array.from(new Set([...list, model]))))
  } catch {
    /* ignore */
  }
}

const TIMEOUT_RE = /timed? ?out|timeout|expired|abort/i

/** Errors worth trying the next option for, rather than giving up. */
function recoverable(e: unknown): boolean {
  if (e instanceof TimedOut) return true
  const msg = (e as Error)?.message ?? ''
  return TIMEOUT_RE.test(msg) || /\b(429|500|503|504)\b|quota|exhausted|deadline|overloaded|unavailable|not found|not supported|thinking/i.test(msg)
}

/**
 * The detective tries the strongest option first and steps down quickly:
 * strong model + Search, fast model + Search, strong model, fast model.
 * Search grounding is skipped for the rest of the session once a model
 * reports it has no quota for it.
 *
 * `earlierPosts` are posts the same anonymous account already published.
 * They are public, so the firewall treats them like the draft.
 */
export async function runDetective(draft: string, profile: Profile, s: Settings, earlierPosts: string[] = []): Promise<DetectiveReport> {
  const plan: Attempt[] = []
  const all = Array.from(new Set([s.detectiveModel, s.fastModel]))
  // A model that timed out earlier this session is skipped, unless it's the only one left.
  const models = all.filter((m) => !remembered(SLOW_KEY, m)).length ? all.filter((m) => !remembered(SLOW_KEY, m)) : all
  if (s.useSearch) {
    for (const m of models) if (!remembered(SEARCH_OFF_KEY, m)) plan.push({ model: m, search: true, lowThinking: m === s.detectiveModel, timeoutMs: 30_000 })
  }
  for (const m of models) plan.push({ model: m, search: false, lowThinking: m === s.detectiveModel, timeoutMs: m === s.fastModel ? 35_000 : 25_000 })

  let lastError: unknown
  for (const a of plan) {
    try {
      return await attemptDetective(draft, profile, s, a, earlierPosts)
    } catch (e) {
      lastError = e
      const msg = (e as Error)?.message ?? ''
      if (a.search && /429|quota|exhausted|billing|not supported|google.?search/i.test(msg)) remember(SEARCH_OFF_KEY, a.model)
      if (e instanceof TimedOut || TIMEOUT_RE.test(msg)) remember(SLOW_KEY, a.model)
      if (a.lowThinking && /thinking/i.test(msg)) {
        try {
          return await attemptDetective(draft, profile, s, { ...a, lowThinking: false }, earlierPosts)
        } catch (e2) {
          lastError = e2
        }
      }
      if (!recoverable(e)) throw e
    }
  }
  throw lastError
}

async function attemptDetective(draft: string, profile: Profile, s: Settings, a: Attempt, earlierPosts: string[]): Promise<DetectiveReport> {
  const publicText = [draft, ...earlierPosts].join('\n')
  const t0 = performance.now()
  const model = modelFor({
    job: 'detective',
    routing: 'cloud_only',
    cloudModel: a.model,
    tools: a.search ? [{ googleSearch: {} }] : undefined,
    temperature: 0.4,
    lowThinking: a.lowThinking,
  })
  const r = await run({
    task: a.search ? 'Detective' : 'Detective (no search)',
    model,
    modelName: a.model,
    routing: 'cloud_only',
    prompt: detectivePrompt(draft, a.search, earlierPosts),
    guard: { profile, draft: publicText },
    timeoutMs: a.timeoutMs,
  })
  const text = r.text
  const grounding: GroundingMetadata | undefined = r.response.candidates?.[0]?.groundingMetadata

  let raw = parseJson<RawReport>(text)
  if (!raw?.guesses) {
    const structurer = modelFor({ job: 'structure', routing: 'cloud_only', cloudModel: s.fastModel, schema: DETECTIVE_SCHEMA, temperature: 0 })
    // The audit is the cloud's own output, so anything in it is already known
    // to the cloud and counts as public alongside the draft.
    const sr = await run({
      task: 'Structure report',
      model: structurer,
      modelName: s.fastModel,
      routing: 'cloud_only',
      prompt: structurePrompt(text),
      guard: { profile, draft: `${publicText}\n${text}` },
      timeoutMs: 30_000,
    })
    raw = parseJson<RawReport>(sr.text)
  }

  return {
    guesses: cleanGuesses(publicText, raw?.guesses ?? []),
    crowdSize: (raw?.crowdSize ?? '').toString().slice(0, 80),
    nextStep: (raw?.nextStep ?? '').toString().slice(0, 240),
    searchQueries: grounding?.webSearchQueries ?? [],
    sources: (grounding?.groundingChunks ?? [])
      .map((c) => ({ title: c.web?.title ?? '', uri: c.web?.uri ?? '' }))
      .filter((c) => c.uri)
      .slice(0, 8),
    searchEntryPointHtml: grounding?.searchEntryPoint?.renderedContent,
    usedSearch: a.search,
    model: a.model,
    ms: Math.round(performance.now() - t0),
  }
}

/** Keeps valid attributes, clamps confidence, and drops evidence not found in the public text. */
export function cleanGuesses(publicText: string, raw: RawGuess[]): DetectiveGuess[] {
  const seen = new Set<string>()
  const out: DetectiveGuess[] = []
  for (const g of raw) {
    const attribute = (g.attribute ?? '').toString().trim() as Attribute
    if (!ATTRIBUTES.includes(attribute) || seen.has(attribute)) continue
    seen.add(attribute)
    const evidence = (Array.isArray(g.evidence) ? g.evidence : g.evidence ? [g.evidence] : [])
      .map((e) => e.toString())
      .filter((e) => locate(publicText, e) >= 0)
      .slice(0, 4)
    const guess = (g.guess ?? 'unknown').toString().slice(0, 80)
    const confidence = isUnknownGuess(guess) ? 0 : Math.max(0, Math.min(100, Math.round(Number(g.confidence) || 0)))
    out.push({ attribute, guess, confidence, evidence, reasoning: (g.reasoning ?? '').toString().slice(0, 240) })
  }
  return out.sort((a, b) => ATTRIBUTES.indexOf(a.attribute) - ATTRIBUTES.indexOf(b.attribute))
}

// ---------------------------------------------------------------- private grading

/**
 * Compares guesses with the profile. The on-device path is ONLY_ON_DEVICE:
 * if no local model exists, the request is never sent; the deterministic
 * grader answers instead and the user can correct any row.
 */
export async function gradePrivately(
  guesses: DetectiveGuess[],
  profile: Profile,
  s: Settings,
  deviceReady: boolean,
): Promise<Grade[]> {
  const rules = gradeAll(guesses, profile)
  const askable = guesses.filter((g) => {
    const v = gradeOne(g.attribute, g.guess, profile[g.attribute])
    return v !== 'no_truth' && v !== 'not_guessed'
  })
  if (!deviceReady || askable.length === 0) return rules
  try {
    const model = modelFor({ job: 'grade', routing: 'device_only', cloudModel: s.fastModel, schema: GRADE_SCHEMA, temperature: 0 })
    const r = await run({ task: 'Private grading', model, modelName: 'Gemini Nano', routing: 'device_only', prompt: gradePrompt(askable, profile) })
    const parsed = parseJson<{ grades: { attribute: Attribute; verdict: 'exact' | 'close' | 'wrong' }[] }>(r.text)
    const device = new Map((parsed?.grades ?? []).map((g) => [g.attribute, g.verdict]))
    return rules.map((g) => {
      const v = device.get(g.attribute)
      if (!v || g.verdict === 'no_truth' || g.verdict === 'not_guessed') return g
      // Never downgrade an exact rule match: string equality is certain.
      if (g.verdict === 'exact') return g
      return { ...g, verdict: v, by: 'on_device' as const }
    })
  } catch {
    return rules
  }
}

// ---------------------------------------------------------------- rewrite

export async function suggestFixes(draft: string, clues: string[], profile: Profile, s: Settings): Promise<{ fixes: Fix[]; source: 'on_device' | 'in_cloud' }> {
  if (!clues.length) return { fixes: [], source: 'on_device' }
  const model = modelFor({ job: 'rewrite', routing: 'device_first', cloudModel: s.fastModel, schema: FIX_SCHEMA, temperature: 0.3 })
  const r = await run({ task: 'Rewrite giveaways', model, modelName: s.fastModel, routing: 'device_first', prompt: fixPrompt(draft, clues), guard: { profile, draft } })
  const parsed = parseJson<{ fixes: { original: string; replacement: string; reason: string }[] }>(r.text)
  const seen = new Set<string>()
  const fixes: Fix[] = []
  for (const f of parsed?.fixes ?? []) {
    const original = (f.original ?? '').toString()
    if (!original || seen.has(original.toLowerCase()) || locate(draft, original) < 0) continue
    if ((f.replacement ?? '').trim().toLowerCase() === original.trim().toLowerCase()) continue
    seen.add(original.toLowerCase())
    fixes.push({ original, replacement: (f.replacement ?? '').toString(), reason: (f.reason ?? '').toString(), accepted: true })
  }
  return { fixes, source: r.source }
}

// ---------------------------------------------------------------- meaning kept

/**
 * Did the rewrite keep the point? ONLY_ON_DEVICE: the original holds the clues
 * the author just chose not to publish, so it never goes anywhere again. With
 * no on-device model, the deterministic check answers instead.
 */
export async function checkMeaning(
  original: string,
  rewritten: string,
  removedClues: string[],
  s: Settings,
  deviceReady: boolean,
): Promise<MeaningCheck> {
  const rules = meaningKept(original, rewritten, removedClues)
  if (!deviceReady) return rules
  try {
    const model = modelFor({ job: 'meaning', routing: 'device_only', cloudModel: s.fastModel, schema: MEANING_SCHEMA, temperature: 0 })
    const r = await run({ task: 'Meaning kept', model, modelName: 'Gemini Nano', routing: 'device_only', prompt: meaningPrompt(original, rewritten) })
    const parsed = parseJson<{ score?: number; verdict?: string; lost?: string[] }>(r.text)
    const score = Number(parsed?.score)
    if (!parsed || !Number.isFinite(score)) return rules
    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      verdict: (parsed.verdict ?? '').toString().slice(0, 140) || rules.verdict,
      lost: (parsed.lost ?? []).map((x) => x.toString().slice(0, 60)).filter(Boolean).slice(0, 4),
      by: 'on_device',
    }
  } catch {
    return rules
  }
}

// ---------------------------------------------------------------- firewall self-test

export interface FirewallTestResult {
  outcome: 'blocked' | 'not_blocked' | 'nothing_to_test'
  field?: string
}

/**
 * Deliberately builds a cloud-capable request that carries a vault value and
 * pushes it through the real firewall in run(). The model handed to run() is
 * a stub that can never reach the network, so even a broken firewall leaks
 * nothing; the test just reports that it wasn't blocked.
 */
export async function testFirewall(profile: Profile, draft: string): Promise<FirewallTestResult> {
  const entry = Object.entries(profile).find(([, v]) => (v ?? '').trim().length >= 3 && !containsPhrase(draft, v as string))
  if (!entry) return { outcome: 'nothing_to_test' }
  const [field, value] = entry
  const neverSends = {
    generateContent: async () => {
      throw new Error('Firewall test stub: this request was not blocked, but nothing was sent.')
    },
  } as unknown as GenerativeModel
  try {
    await run({
      task: 'Firewall test',
      model: neverSends,
      modelName: 'test stub',
      routing: 'device_first',
      prompt: `Firewall test. This request deliberately contains your private ${field}: ${value}`,
      guard: { profile, draft },
    })
    return { outcome: 'not_blocked', field }
  } catch (e) {
    if (e instanceof BlockedByFirewall) return { outcome: 'blocked', field }
    return { outcome: 'not_blocked', field }
  }
}
