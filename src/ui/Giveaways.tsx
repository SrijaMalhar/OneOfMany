// The list of giveaways in the draft, hottest first. Clicking one points at it
// in the viewfinder.

import { useState } from 'react'
import { TELL_KIND_LABEL } from '../types'
import type { HeatTell } from './heat'

const HEAT_RANK = { hottest: 3, hot: 2, warm: 1, cool: 0 } as const

const ORIGIN_TEXT = { rule: 'rules', on_device: 'Gemini Nano', in_cloud: 'detective' } as const

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
  const shown = all ? sorted : sorted.slice(0, 8)
  return (
    <section className="giveaways" aria-label="What gives you away">
      <h3 className="dev-h3">What gives you away</h3>
      <ul className="gv-list">
        {shown.map((t) => (
          <li key={`${t.start}-${t.end}`} className={`gv heat-${t.heat}`}>
            <button type="button" className={`gv-item heat-${t.heat}`} onClick={() => onPick(t)}>
              <span className="gv-dot" aria-hidden="true" />
              <span className="gv-body">
                <span className="gv-quote">{t.text}</span>
                <span className="gv-why">{t.why}</span>
                <span className="gv-meta">
                  {TELL_KIND_LABEL[t.kind]}, found by {t.origins.map((o) => ORIGIN_TEXT[o]).join(' and ')}
                </span>
              </span>
            </button>
            <Blur tell={t} to={blurOf(t)} onBlur={onBlur} />
          </li>
        ))}
      </ul>
      {sorted.length > 8 ? (
        <button type="button" className="link-btn dev-link" onClick={() => setAll((v) => !v)}>
          {all ? 'Show fewer' : `Show all ${sorted.length}`}
        </button>
      ) : null}
    </section>
  )
}

function Blur({ tell, to, onBlur }: { tell: HeatTell; to: string | null; onBlur: (t: HeatTell) => void }) {
  if (to == null) return null
  return (
    <button type="button" className="blur-btn" onClick={() => onBlur(tell)} title="Rewrite this on your device, instantly">
      Blur it{to ? <span className="blur-to"> to “{to}”</span> : <span className="blur-to"> (remove)</span>}
    </button>
  )
}
