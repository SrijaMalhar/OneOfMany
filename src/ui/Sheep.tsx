// Nobody and the flock. One drawing, defined once and reused: nine circles of
// wool, a face, two legs. Nobody is the same sheep with a small violet mask.
// The same shapes draw the README art (scripts/readme_art.py).

import { FACE, MASK, SHEEP_VIEWBOX, TUFT, WOOL } from './sheepShape'

// Fills come from custom properties, which inherit through <use>, so each
// sheep can be recoloured from CSS without redrawing it.
const WOOL_FILL = { fill: 'var(--sheep-wool)' }
const FACE_FILL = { fill: 'var(--sheep-face)' }
const EYE_FILL = { fill: 'var(--sheep-eye)' }
const MASK_FILL = { fill: 'var(--sheep-mask)' }
// An ink outline around the silhouette, drawn first; transparent by default.
const LINE = { fill: 'var(--sheep-line, transparent)', stroke: 'var(--sheep-line, transparent)', strokeWidth: 3.2, strokeLinejoin: 'round' as const }

/** Put once on the page; every <Sheep /> refers to it. */
export function SheepDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <symbol id="sheep" viewBox={SHEEP_VIEWBOX}>
          <g style={LINE}>
            <rect x="20" y="44" width="5" height="14" rx="2.5" />
            <rect x="35" y="44" width="5" height="14" rx="2.5" />
            {WOOL.map(([x, y, r]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
            ))}
            <ellipse cx="17.5" cy="31" rx="6.5" ry="3.2" transform="rotate(-22 17.5 31)" />
            <ellipse cx="42.5" cy="31" rx="6.5" ry="3.2" transform="rotate(22 42.5 31)" />
          </g>
          <g style={FACE_FILL}>
            <rect x="20" y="44" width="5" height="14" rx="2.5" />
            <rect x="35" y="44" width="5" height="14" rx="2.5" />
          </g>
          <g style={WOOL_FILL}>
            {WOOL.map(([x, y, r]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
            ))}
          </g>
          <g style={FACE_FILL}>
            <ellipse cx="17.5" cy="31" rx="6.5" ry="3.2" transform="rotate(-22 17.5 31)" />
            <ellipse cx="42.5" cy="31" rx="6.5" ry="3.2" transform="rotate(22 42.5 31)" />
            <path d={FACE} />
          </g>
          <g style={WOOL_FILL}>
            {TUFT.map(([x, y, r]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
            ))}
          </g>
          <g style={EYE_FILL}>
            <circle cx="26.4" cy="33.2" r="1.2" />
            <circle cx="33.6" cy="33.2" r="1.2" />
          </g>
        </symbol>
        <symbol id="sheep-mask" viewBox={SHEEP_VIEWBOX}>
          <path d={MASK} fillRule="evenodd" style={MASK_FILL} />
        </symbol>
      </defs>
    </svg>
  )
}

export function Sheep({ masked = false, className }: { masked?: boolean; className?: string }) {
  return (
    <svg className={`sheep${className ? ` ${className}` : ''}`} viewBox={SHEEP_VIEWBOX} aria-hidden="true" focusable="false">
      <use href="#sheep" />
      {masked ? <use className="sheep-mask" href="#sheep-mask" /> : null}
    </svg>
  )
}
