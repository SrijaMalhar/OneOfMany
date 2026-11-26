// Turns the JSON that the #bench page downloads into the README's Results
// chart (light and dark SVG) and prints the Results table, filled in.
//
//   node scripts/benchmark-chart.mjs ~/Downloads/oneofmany-benchmark.json
//
// Every number comes from the file; nothing is estimated.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const input = process.argv[2]
if (!input) {
  console.error('Usage: node scripts/benchmark-chart.mjs <oneofmany-benchmark.json>')
  process.exit(1)
}

const data = JSON.parse(readFileSync(input, 'utf8'))
const rows = (data.rows ?? []).filter((r) => !r.error)
if (!rows.length) {
  console.error('No finished posts in that file. Run the benchmark at #bench first.')
  process.exit(1)
}

// Colours from the app's tokens, checked for contrast and colour-blind
// separation against each surface.
const THEMES = {
  light: { page: '#f8f8f9', line: '#e6e6ea', fg: '#18181b', fg3: '#6d6d77', link: '#c9c9d1', before: '#e5484d', after: '#0b68cb' },
  dark: { page: '#0f0f11', line: '#29292f', fg: '#ececef', fg3: '#8d8d97', link: '#45454d', before: '#e5484d', after: '#4f9ff2' },
}
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"

const sorted = [...rows].sort((a, b) => b.before.score - a.before.score || b.after.score - a.after.score)
const W = 1200
const LABEL = 300
const VALUES = 130
const PLOT = W - LABEL - VALUES - 48
const X0 = LABEL + 24
const ROW = 24
const TOP = 64
const H = TOP + sorted.length * ROW + 44

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const x = (score) => X0 + (Math.max(0, Math.min(100, score)) / 100) * PLOT

function chart(t) {
  const out = []
  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" font-family="${FONT}">`,
    `<title>Exposure before and after rewrites for each of ${sorted.length} fictional posts</title>`,
    `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.page}" stroke="${t.line}"/>`,
  )
  // Legend: identity is never colour alone, so each key has a label.
  out.push(
    `<circle cx="${X0 + 6}" cy="30" r="5" fill="${t.before}"/>`,
    `<text x="${X0 + 18}" y="34.5" font-size="13" font-weight="500" fill="${t.fg}">Before rewrites</text>`,
    `<circle cx="${X0 + 146}" cy="30" r="5" fill="${t.after}"/>`,
    `<text x="${X0 + 158}" y="34.5" font-size="13" font-weight="500" fill="${t.fg}">After rewrites</text>`,
    `<text x="${W - 24}" y="34.5" font-size="12" fill="${t.fg3}" text-anchor="end">Exposure, % of vault facts</text>`,
  )
  // Recessive grid.
  for (const g of [0, 25, 50, 75, 100]) {
    out.push(`<line x1="${x(g)}" x2="${x(g)}" y1="${TOP - 8}" y2="${H - 36}" stroke="${t.line}" stroke-width="1"/>`)
    out.push(`<text x="${x(g)}" y="${H - 16}" font-size="12" fill="${t.fg3}" text-anchor="middle">${g}%</text>`)
  }
  sorted.forEach((r, i) => {
    const y = TOP + i * ROW + ROW / 2
    const b = x(r.before.score)
    const a = x(r.after.score)
    out.push(
      `<text x="${LABEL}" y="${y + 4.5}" font-size="13" fill="${t.fg}" text-anchor="end">${esc(r.label)}</text>`,
      `<line x1="${Math.min(a, b)}" x2="${Math.max(a, b)}" y1="${y}" y2="${y}" stroke="${t.link}" stroke-width="2" stroke-linecap="round"/>`,
      `<circle cx="${b}" cy="${y}" r="5" fill="${t.before}" stroke="${t.page}" stroke-width="2"><title>${esc(r.label)}: ${r.before.score}% before</title></circle>`,
      `<circle cx="${a}" cy="${y}" r="5" fill="${t.after}" stroke="${t.page}" stroke-width="2"><title>${esc(r.label)}: ${r.after.score}% after</title></circle>`,
      `<text x="${W - 24}" y="${y + 4.5}" font-size="12" fill="${t.fg3}" text-anchor="end" font-variant-numeric="tabular-nums">${r.before.score}% to ${r.after.score}%</text>`,
    )
  })
  out.push('</svg>\n')
  return out.join('\n')
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'docs', 'readme')
mkdirSync(dir, { recursive: true })
writeFileSync(join(dir, 'benchmark-light.svg'), chart(THEMES.light))
writeFileSync(join(dir, 'benchmark-dark.svg'), chart(THEMES.dark))

// The README table, computed the same way as the #bench summary.
const mean = (xs) => Math.round(xs.reduce((s, v) => s + v, 0) / xs.length)
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return Math.round(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2)
}
const facts = (r, k) => r[k].exposed + r[k].partial * 0.5
const avg1 = (xs) => Math.round((xs.reduce((s, v) => s + v, 0) / xs.length) * 10) / 10
const before = rows.map((r) => r.before.score)
const after = rows.map((r) => r.after.score)

console.log(`Wrote docs/readme/benchmark-light.svg and benchmark-dark.svg (${rows.length} posts).\n`)
console.log(`| Across ${rows.length} fictional posts | Before rewrites | After rewrites |`)
console.log('| --- | --- | --- |')
console.log(`| Mean exposure | ${mean(before)}% | ${mean(after)}% |`)
console.log(`| Median exposure | ${median(before)}% | ${median(after)}% |`)
console.log(`| Facts recovered per post | ${avg1(rows.map((r) => facts(r, 'before')))} | ${avg1(rows.map((r) => facts(r, 'after')))} |`)
console.log(`| Posts that got safer | | ${rows.filter((r) => r.after.score < r.before.score).length} of ${rows.length} |`)
console.log(`| Meaning kept, on average | | ${mean(rows.map((r) => r.meaningKept ?? 100))}% |`)
