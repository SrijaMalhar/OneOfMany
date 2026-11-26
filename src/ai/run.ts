// Every AI call goes through here: firewall check for anything that may reach
// the cloud, a receipt entry, and the real inference source reported by the
// SDK (never guessed).

import type { GenerateContentResponse, GenerativeModel } from 'firebase/ai'
import { inspect } from '../engine/firewall'
import type { Profile } from '../types'
import { readDeviceStatus } from './device'
import { finishRecord, startRecord, type Routing } from './receipt'

export interface RunResult {
  text: string
  source: 'on_device' | 'in_cloud'
  response: GenerateContentResponse
  ms: number
}

export interface RunOptions {
  task: string
  model: GenerativeModel
  modelName: string
  routing: Routing
  prompt: string
  /** Required for any routing that can reach the cloud. */
  guard?: { profile: Profile; draft: string }
  /** Give up after this long instead of the SDK's 3-minute default. */
  timeoutMs?: number
}

export class TimedOut extends Error {}

export class BlockedByFirewall extends Error {}

export async function run(o: RunOptions): Promise<RunResult> {
  const mayReachCloud = o.routing !== 'device_only'
  let firewall: 'passed' | 'blocked' | 'not_needed' = 'not_needed'
  if (mayReachCloud) {
    if (!o.guard) throw new Error(`${o.task}: cloud-capable call without a firewall guard`)
    const check = inspect(o.prompt, o.guard.profile, o.guard.draft)
    firewall = check.ok ? 'passed' : 'blocked'
    if (!check.ok) {
      startRecordBlocked(o, check.blockedField ?? 'field')
      throw new BlockedByFirewall(`Blocked before sending: the request contained your private ${check.blockedField}.`)
    }
  }

  // Defense in depth: a device-only job must never be dispatched unless the
  // browser really has an on-device model, whatever the SDK would do.
  if (o.routing === 'device_only' && (await readDeviceStatus()) !== 'available') {
    throw new Error(`${o.task} needs the on-device model, which isn't ready on this device. Nothing was sent.`)
  }

  const id = startRecord({ task: o.task, routing: o.routing, model: o.modelName, payload: o.prompt, firewall })
  const t0 = performance.now()
  const timeoutMs = o.timeoutMs ?? (o.routing === 'cloud_only' ? 75_000 : 45_000)
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const result = await Promise.race([
      o.model.generateContent(o.prompt, { signal: controller.signal, timeout: timeoutMs }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort()
          reject(new TimedOut(`${o.task} took longer than ${Math.round(timeoutMs / 1000)}s and was stopped.`))
        }, timeoutMs + 2_000)
      }),
    ])
    clearTimeout(timer)
    const ms = Math.round(performance.now() - t0)
    const source = (result.response.inferenceSource ?? (o.routing === 'device_only' ? 'on_device' : 'in_cloud')) as RunResult['source']
    const text = result.response.text()
    finishRecord(id, { status: 'ok', source, ms })
    return { text, source, response: result.response, ms }
  } catch (e) {
    clearTimeout(timer)
    finishRecord(id, { status: 'error', error: (e as Error).message, ms: Math.round(performance.now() - t0) })
    throw e
  }
}

function startRecordBlocked(o: RunOptions, field: string) {
  const id = startRecord({ task: o.task, routing: o.routing, model: o.modelName, payload: '[withheld: contained private data]', firewall: 'blocked' })
  finishRecord(id, { status: 'blocked', error: `Contained your private ${field}` })
}

/** Lenient JSON extraction: handles ```json fences and leading prose. */
export function parseJson<T>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidates = [fenced?.[1], text]
  for (const c of candidates) {
    if (!c) continue
    const trimmed = c.trim()
    try {
      return JSON.parse(trimmed) as T
    } catch {
      const a = trimmed.indexOf('{')
      const b = trimmed.lastIndexOf('}')
      if (a >= 0 && b > a) {
        try {
          return JSON.parse(trimmed.slice(a, b + 1)) as T
        } catch {
          /* try next */
        }
      }
    }
  }
  return null
}
