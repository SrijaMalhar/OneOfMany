// Applying rewrite suggestions to the draft, and choosing which clues to send
// for rewriting. Clue selection never looks at the private profile, so the
// rewrite request reveals nothing new even if it falls back to the cloud.

import type { DetectiveGuess, Fix, Tell } from '../types'
import { locate } from './tells'

export function applyFixes(draft: string, fixes: Fix[]): string {
  let out = draft
  // Longest originals first so a short clue doesn't break a longer one.
  const chosen = fixes.filter((f) => f.accepted).sort((a, b) => b.original.length - a.original.length)
  for (const f of chosen) {
    const at = locate(out, f.original)
    if (at < 0) continue
    const before = out.slice(0, at)
    const after = out.slice(at + f.original.length)
    let replacement = f.replacement
    if (!replacement) {
      // Removing a clue: tidy the doubled space it leaves behind.
      const left = before.replace(/\s+$/, '')
      const right = after.replace(/^\s+/, '')
      out = (left && right ? `${left} ${right}` : left + right).replace(/\s+([,.!?;:])/g, '$1')
      continue
    }
    // Keep the capitalisation of a clue that starts a sentence.
    if (/^[A-Z]/.test(f.original) && /^[a-z]/.test(replacement) && (at === 0 || /[.!?]\s*$/.test(before))) {
      replacement = replacement[0].toUpperCase() + replacement.slice(1)
    }
    out = before + replacement + after
  }
  return out
}

/**
 * Clues to rewrite: every piece of evidence the detective cited with real
 * confidence, plus high-risk local tells. Deliberately independent of the
 * profile and of which guesses were right.
 */
export function cluesToRewrite(draft: string, tells: Tell[], guesses: DetectiveGuess[], minConfidence: number): string[] {
  const set = new Map<string, string>()
  for (const g of guesses) {
    if (g.confidence < minConfidence / 2) continue
    for (const e of g.evidence) {
      const at = locate(draft, e)
      if (at >= 0) {
        const exact = draft.slice(at, at + e.trim().length)
        set.set(exact.toLowerCase(), exact)
      }
    }
  }
  for (const t of tells) {
    if (t.risk === 'high' || (t.risk === 'medium' && t.origins.length > 1)) set.set(t.text.toLowerCase(), t.text)
  }
  // Merge clues that overlap or touch in the draft ("in the Bellandur" +
  // "Bellandur office" -> "in the Bellandur office"), so every suggestion
  // can be applied without breaking another one.
  const spans = Array.from(set.values())
    .map((c) => {
      const at = locate(draft, c)
      return { start: at, end: at + c.length }
    })
    .filter((sp) => sp.start >= 0)
    .sort((a, b) => a.start - b.start)
  const merged: { start: number; end: number }[] = []
  for (const sp of spans) {
    const last = merged[merged.length - 1]
    if (last && sp.start <= last.end + 1) last.end = Math.max(last.end, sp.end)
    else merged.push({ ...sp })
  }
  return merged.map((sp) => draft.slice(sp.start, sp.end).trim()).filter(Boolean).slice(0, 14)
}
