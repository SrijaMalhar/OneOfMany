// Local storage for the vault and preferences, plus the opt-in community
// counter. The vault and drafts never leave the browser.

import { doc, getDoc, increment, serverTimestamp, setDoc } from 'firebase/firestore'
import { ensureSignedIn, firebase, isConfigured } from './firebase'
import { TELL_KINDS, type Profile, type Tell, type TellKind } from './types'

const VAULT_KEY = 'oneofmany.vault.v1'
const SHARE_KEY = 'oneofmany.shareCounts.v1'
const DRAFT_KEY = 'oneofmany.draft.v1'

function read<T>(storage: () => Storage, key: string, fallback: T): T {
  try {
    const raw = storage().getItem(key)
    return raw == null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

function write(storage: () => Storage, key: string, value: unknown) {
  try {
    if (value === undefined) storage().removeItem(key)
    else storage().setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable (private mode, quota). The app keeps working in memory.
  }
}

const local = () => localStorage
const session = () => sessionStorage

export const loadVault = (): Profile => read<Profile>(local, VAULT_KEY, {})
export const saveVault = (p: Profile) => write(local, VAULT_KEY, p)

/** Drafts live in session storage only: closing the tab forgets them. */
export const loadDraft = (): string => read<string>(session, DRAFT_KEY, '')
export const saveDraft = (d: string) => write(session, DRAFT_KEY, d || undefined)

export const loadShareChoice = (): boolean => read<boolean>(local, SHARE_KEY, false)
export const saveShareChoice = (v: boolean) => write(local, SHARE_KEY, v)

export function forgetEverything() {
  write(local, VAULT_KEY, undefined)
  write(local, SHARE_KEY, undefined)
  write(session, DRAFT_KEY, undefined)
  try {
    for (const k of Object.keys(sessionStorage)) if (k.startsWith('oneofmany.')) sessionStorage.removeItem(k)
  } catch {
    /* ignore */
  }
}

// ------------------------------------------------------------ community counts
// Only counts by giveaway *kind* are shared, never text: { time: 1, location: 2 }.

export type Counts = Partial<Record<TellKind, number>> & { runs?: number }

export async function shareCounts(tells: Tell[]): Promise<void> {
  if (!isConfigured) return
  const uid = await ensureSignedIn()
  if (!uid) return
  const { db } = firebase()
  const byKind: Record<string, number> = {}
  for (const t of tells) byKind[t.kind] = Math.min(30, (byKind[t.kind] ?? 0) + 1)
  const update: Record<string, unknown> = { runs: increment(1), updatedAt: serverTimestamp() }
  for (const [k, n] of Object.entries(byKind)) update[k] = increment(n)
  await setDoc(doc(db, 'community', 'tells'), update, { merge: true })
}

export async function readCounts(): Promise<Counts | null> {
  if (!isConfigured) return null
  try {
    const { db } = firebase()
    const snap = await getDoc(doc(db, 'community', 'tells'))
    return snap.exists() ? (snap.data() as Counts) : {}
  } catch {
    return null
  }
}

export function topKind(c: Counts | null): { kind: TellKind; share: number } | null {
  if (!c) return null
  const total = TELL_KINDS.reduce((t, k) => t + (c[k] ?? 0), 0)
  if (!total) return null
  const kind = [...TELL_KINDS].sort((a, b) => (c[b] ?? 0) - (c[a] ?? 0))[0]
  return { kind, share: Math.round(((c[kind] ?? 0) / total) * 100) }
}
