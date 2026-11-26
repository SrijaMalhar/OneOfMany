// The profile firewall. Every request that is allowed to reach the cloud is
// checked here first. If it contains a vault value that is not already in the
// draft the user is about to publish, the request is blocked before it leaves.

import type { Profile } from '../types'
import { containsPhrase } from './text'

export class ProfileLeakError extends Error {
  readonly field: string
  constructor(field: string) {
    super(`Blocked: a request tried to send your private "${field}" to the cloud.`)
    this.field = field
  }
}

export interface FirewallResult {
  ok: boolean
  checked: number
  blockedField?: string
}

export function inspect(payload: string, profile: Profile, draft: string): FirewallResult {
  let checked = 0
  for (const [field, raw] of Object.entries(profile)) {
    const value = (raw ?? '').trim()
    if (value.length < 3) continue
    checked++
    // Values already in the public draft are not secrets the cloud can learn.
    if (containsPhrase(draft, value)) continue
    if (containsPhrase(payload, value)) return { ok: false, checked, blockedField: field }
  }
  return { ok: true, checked }
}

export function enforce(payload: string, profile: Profile, draft: string): FirewallResult {
  const r = inspect(payload, profile, draft)
  if (!r.ok) throw new ProfileLeakError(r.blockedField ?? 'field')
  return r
}
