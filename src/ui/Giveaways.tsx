// The list of giveaways in the draft, strongest first. Selecting one points
// at it in the editor; Blur rewrites it on this device, instantly.

import { useState } from 'react'
import { TELL_KIND_LABEL } from '../types'
import type { HeatTell } from './heat'

const HEAT_RANK = { hottest: 3, hot: 2, warm: 1, cool: 0 } as const
const SHOWN = 6
const ORIGIN_TEXT = { rule: 'rules', on_device: 'Gemini Nano', in_cloud: 'the detective' } as const

interface Props {
  tells: HeatTell[]
  onPick: (t: HeatTell) => void
  /** The instant, on-device rewrite for a giveaway, if there is a safe one. */
  blurOf: (t: HeatTell) => string | null
  onBlur: (t: HeatTell) => void
}

export function Giveaways({ tells, onPick, blurOf, onBlur }: Props) {
  const [all, setAll] = useState(false)
  if (!tells.length) return null
  const sorted = [...tells].sort((a, b) => HEAT_RANK[b.heat] - HEAT_RANK[a.heat] || a.start - b.start)
  const shown = all ? sorted : sorted.slice(0, SHOWN)
  return (
    <section className="section" aria-labelledby="gv-title">
      <div className="section-head">
        <h2 id="gv-title" className="section-title">
          What gives you away <span className="count">{tells.length}</span>
        </h2>
        <span className="small muted hide-sm">Select one to find it in your draft</span>
      </div>
      <ul className="list">
        {shown.map((t) => {
          const to = blurOf(t)
          return (
            <li key={`${t.start}-${t.end}`} className="gv-row">
              <button type="button" className="gv-main" onClick={() => onPick(t)}>
                <span className={`swatch swatch-${t.heat}`} aria-hidden="true" />
                <span className="gv-text">
                  <span className="gv-quote">“{t.text}”</span>
                  <span className="gv-why">{t.why}</span>
                </span>
              </button>
              <span className="gv-kind" data-tip={`Found by ${t.origins.map((o) => ORIGIN_TEXT[o]).join(' and ')}`} tabIndex={0}>
                {TELL_KIND_LABEL[t.kind]}
              </span>
              {to != null ? (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => onBlur(t)}
                  data-tip={to ? `Replace with “${to}”, on this device` : 'Remove it, on this device'}
                  data-tip-align="end"
                  aria-label={to ? `Blur “${t.text}” to “${to}”` : `Remove “${t.text}”`}
                >
                  Blur
                </button>
              ) : (
                <span />
              )}
            </li>
          )
        })}
      </ul>
      {sorted.length > SHOWN ? (
        <button type="button" className="btn btn-ghost btn-sm list-more" onClick={() => setAll((v) => !v)}>
          {all ? 'Show fewer' : `Show all ${sorted.length}`}
        </button>
      ) : null}
    </section>
  )
}
