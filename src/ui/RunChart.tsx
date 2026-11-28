// Exposure across runs, drawn on graph paper. The band at the bottom is
// where the checklist says a post is ready: under 25% exposed.

import type { Run } from './Report'

const W = 600
const H = 190
const PAD = { top: 26, right: 30, bottom: 30, left: 50 }
const READY = 25

export function RunChart({ runs }: { runs: Run[] }) {
  if (runs.length < 2) return null
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  // Keep the first and last points clear of the axis labels.
  const inset = 26
  const x = (i: number) => PAD.left + inset + (i / (runs.length - 1)) * (innerW - inset * 2)
  const y = (score: number) => PAD.top + (1 - score / 100) * innerH
  const points = runs.map((r, i) => ({ x: x(i), y: y(r.exposure.score), score: r.exposure.score, level: r.exposure.level }))
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const first = runs[0].exposure.score
  const last = runs[runs.length - 1].exposure.score

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Exposure went from ${first}% on the first run to ${last}% on run ${runs.length}.`}>
        <rect className="chart-ready" x={PAD.left} y={y(READY)} width={innerW} height={y(0) - y(READY)} />
        <text className="chart-ready-label" x={W - PAD.right - 4} y={y(0) - 8} textAnchor="end">
          ready to post
        </text>
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line className="chart-grid" x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} />
            <text className="chart-axis" x={PAD.left - 10} y={y(v) + 4} textAnchor="end">
              {v}%
            </text>
          </g>
        ))}
        <path className="chart-line" d={line} pathLength={1} />
        {points.map((p, i) => (
          <g key={runs[i].id}>
            <circle className={`chart-dot lvl-${p.level}`} cx={p.x} cy={p.y} r="6.5" />
            <text className="chart-value" x={p.x} y={p.y - 13} textAnchor="middle">
              {p.score}%
            </text>
            <text className="chart-axis" x={p.x} y={H - 8} textAnchor="middle">
              Run {i + 1}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  )
}
