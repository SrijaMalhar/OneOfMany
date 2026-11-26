// Small, dependency-free text helpers used by the deterministic engine.

export function normalize(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const STOP = new Set([
  'the', 'a', 'an', 'of', 'in', 'at', 'on', 'and', 'or', 'for', 'to', 'my', 'our', 'is', 'inc', 'ltd', 'llc', 'co', 'company',
])

export function tokens(s: string): string[] {
  return normalize(s)
    .split(' ')
    .filter((t) => t.length > 1 && !STOP.has(t))
}

/** Jaro-Winkler similarity in [0, 1]. */
export function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1
  if (!a.length || !b.length) return 0
  const range = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1)
  const aM = new Array<boolean>(a.length).fill(false)
  const bM = new Array<boolean>(b.length).fill(false)
  let matches = 0
  for (let i = 0; i < a.length; i++) {
    const lo = Math.max(0, i - range)
    const hi = Math.min(i + range + 1, b.length)
    for (let j = lo; j < hi; j++) {
      if (bM[j] || a[i] !== b[j]) continue
      aM[i] = bM[j] = true
      matches++
      break
    }
  }
  if (!matches) return 0
  let t = 0
  let k = 0
  for (let i = 0; i < a.length; i++) {
    if (!aM[i]) continue
    while (!bM[k]) k++
    if (a[i] !== b[k]) t++
    k++
  }
  const m = matches
  const jaro = (m / a.length + m / b.length + (m - t / 2) / m) / 3
  let prefix = 0
  while (prefix < 4 && a[prefix] === b[prefix]) prefix++
  return jaro + prefix * 0.1 * (1 - jaro)
}

/** Overlap of meaningful tokens, relative to the smaller set. */
export function tokenOverlap(a: string, b: string): number {
  const A = new Set(tokens(a))
  const B = new Set(tokens(b))
  if (!A.size || !B.size) return 0
  let shared = 0
  for (const t of A) if (B.has(t)) shared++
  return shared / Math.min(A.size, B.size)
}

/**
 * Consonant skeleton: catches transliteration variants such as
 * Bangalore/Bengaluru, Kolkata/Calcutta or Pune/Poona.
 */
export function skeleton(s: string): string {
  return normalize(s)
    .replace(/ph/g, 'f')
    .replace(/c/g, 'k')
    .replace(/q/g, 'k')
    .replace(/[aeiouyhw\s]/g, '')
    .replace(/(.)\1+/g, '$1')
}

/** Strict similarity in [0, 1]: weak character overlap counts as 0. */
export function similarity(a: string, b: string): number {
  const na = normalize(a)
  const nb = normalize(b)
  if (!na || !nb) return 0
  if (na === nb) return 1
  const jw = jaroWinkler(na, nb)
  return Math.max(jw >= 0.85 ? jw : 0, tokenOverlap(na, nb))
}

/** True when `needle` appears in `hay` as whole words, ignoring case and punctuation. */
export function containsPhrase(hay: string, needle: string): boolean {
  const h = ` ${normalize(hay)} `
  const n = normalize(needle)
  if (!n) return false
  return h.includes(` ${n} `)
}

export function numbersIn(s: string): number[] {
  return (s.match(/\d+(?:\.\d+)?/g) ?? []).map(Number)
}
