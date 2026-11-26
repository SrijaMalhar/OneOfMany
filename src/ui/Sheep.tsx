// Nobody and the flock. One drawing, defined once and reused: nine circles of
// wool, a face, two legs. Nobody is the same sheep with a small violet mask.
// The same shapes draw the README art (scripts/readme_art.py).

const WOOL: [number, number, number][] = [
  [15, 29, 10],
  [22, 19, 10.5],
  [31, 15, 10.5],
  [40, 19, 10.5],
  [46, 29, 10],
  [41, 39, 10.5],
  [30, 42, 10.5],
  [19, 39, 10.5],
  [30, 29, 13],
]
const TUFT: [number, number, number][] = [
  [26, 23.5, 4],
  [30.5, 21.5, 4.6],
  [34.6, 23.6, 3.8],
]
const FACE = 'M30 23c6.5 0 9.5 5 9.5 11 0 6.5-4.5 11-9.5 11s-9.5-4.5-9.5-11c0-6 3-11 9.5-11z'
const MASK =
  'M17.2 31.2C19.8 27.9 25 28.4 30 30.1 35 28.4 40.2 27.9 42.8 31.2 43.5 34.4 41.6 37.6 37.8 37.7 ' +
  '34.9 37.8 32.4 36.3 30 35.4 27.6 36.3 25.1 37.8 22.2 37.7 18.4 37.6 16.5 34.4 17.2 31.2Z' +
  'M23.7 33.2a2.7 2.3 0 1 0 5.4 0a2.7 2.3 0 1 0-5.4 0Z' +
  'M30.9 33.2a2.7 2.3 0 1 0 5.4 0a2.7 2.3 0 1 0-5.4 0Z'

export const SHEEP_VIEWBOX = '-8 -6 76 76'

// Fills come from custom properties, which inherit through <use>, so each
// sheep can be recoloured from CSS without redrawing it.
const WOOL_FILL = { fill: 'var(--sheep-wool)' }
const FACE_FILL = { fill: 'var(--sheep-face)' }
const EYE_FILL = { fill: 'var(--sheep-eye)' }
const MASK_FILL = { fill: 'var(--sheep-mask)' }

/** Put once on the page; every <Sheep /> refers to it. */
export function SheepDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <symbol id="sheep" viewBox={SHEEP_VIEWBOX}>
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
