// The "cloud receipt": a local log of every AI call, where it ran, and exactly
// what was sent. Lets the user verify the privacy promise for themselves.

import { containsPhrase } from '../engine/text'
import type { Profile } from '../types'

export type Routing = 'device_only' | 'device_first' | 'cloud_only'

export interface CallRecord {
  id: number
  task: string
  routing: Routing
  model: string
  source?: 'on_device' | 'in_cloud'
  payload: string
  /** The user-supplied part of the payload, which the audit re-checks. */
  checked?: string
  firewall: 'passed' | 'blocked' | 'not_needed'
  ms?: number
  status: 'running' | 'ok' | 'error' | 'blocked'
  error?: string
  at: number
}

type Listener = (records: CallRecord[]) => void

let records: CallRecord[] = []
let nextId = 1
const listeners = new Set<Listener>()

function emit() {
  const snapshot = [...records]
  for (const l of listeners) l(snapshot)
}

export function startRecord(r: Omit<CallRecord, 'id' | 'at' | 'status'>): number {
  const id = nextId++
  const record: CallRecord = { ...r, id, at: Date.now(), status: 'running' }
  records = [record, ...records].slice(0, 60)
  emit()
  return id
}

export function finishRecord(id: number, patch: Partial<CallRecord>) {
  records = records.map((r) => (r.id === id ? { ...r, ...patch } : r))
  emit()
}

export function subscribe(l: Listener): () => void {
  listeners.add(l)
  l([...records])
  return () => listeners.delete(l)
}

export function clearRecords() {
  records = []
  emit()
}

export interface Audit {
  onDevice: number
  inCloud: number
  blocked: number
  /** Vault values found in anything that actually went to the cloud. */
  vaultValuesSent: number
}

/**
 * Re-checks every finished cloud call against the vault, independently of
 * the firewall that ran before dispatch. Values the user wrote into a public
 * post themselves are not secrets and are not counted.
 */
export function audit(records: CallRecord[], profile: Profile, publicText: string): Audit {
  const secrets = Object.values(profile)
    .map((v) => (v ?? '').trim())
    .filter((v) => v.length >= 3 && !containsPhrase(publicText, v))
  let vaultValuesSent = 0
  for (const r of records) {
    if (r.source !== 'in_cloud') continue
    for (const v of secrets) if (containsPhrase(r.checked ?? r.payload, v)) vaultValuesSent++
  }
  return {
    onDevice: records.filter((r) => r.source === 'on_device').length,
    inCloud: records.filter((r) => r.source === 'in_cloud').length,
    blocked: records.filter((r) => r.status === 'blocked').length,
    vaultValuesSent,
  }
}
