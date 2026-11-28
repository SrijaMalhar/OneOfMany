// The two characters. Nobody is you: a sheep in a small violet mask, hiding
// in the flock. The Cyclops is the detective: one big eye that reads only
// what you write. Both are flat SVG drawn from simple shapes.

import './characters.css'
import type { CSSProperties } from 'react'
import { FACE, MASK, SHEEP_VIEWBOX, TUFT, WOOL } from '../ui/sheepShape'

interface NobodyProps {
  /** Where the eyes look, each from -1 to 1. */
  look?: { x: number; y: number }
  wave?: boolean
  className?: string
  title?: string
}

/** Nobody, drawn inline so the eyes can move, blink and the hoof can wave. */
export function Nobody({ look, wave = false, className, title }: NobodyProps) {
  // The pupils read --lx/--ly, so a parent can steer them every frame.
  const style = look ? ({ '--lx': look.x, '--ly': look.y } as CSSProperties) : undefined
  return (
    <svg
      className={`nobody${className ? ` ${className}` : ''}`}
      style={style}
      viewBox={SHEEP_VIEWBOX}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      overflow="visible"
    >
      <Outline />
      <g className="nb-legs">
        <rect x="20" y="44" width="5" height="14" rx="2.5" />
        <rect x="35" y="44" width="5" height="14" rx="2.5" />
      </g>
      <g className="nb-wool">
        {WOOL.map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
        ))}
      </g>
      <g className="nb-face">
        <ellipse className="nb-ear nb-ear-l" cx="17.5" cy="31" rx="6.5" ry="3.2" transform="rotate(-22 17.5 31)" />
        <ellipse className="nb-ear nb-ear-r" cx="42.5" cy="31" rx="6.5" ry="3.2" transform="rotate(22 42.5 31)" />
        <path d={FACE} />
      </g>
      <g className="nb-wool">
        {TUFT.map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
        ))}
      </g>
      <g className="nb-eyes">
        <g className="nb-eye">
          <circle className="nb-white" cx="26.4" cy="33.2" r="2.25" />
          <circle className="nb-pupil" cx="26.4" cy="33.2" r="1.25" />
        </g>
        <g className="nb-eye">
          <circle className="nb-white" cx="33.6" cy="33.2" r="2.25" />
          <circle className="nb-pupil" cx="33.6" cy="33.2" r="1.25" />
        </g>
      </g>
      <path className="nb-mask" d={MASK} fillRule="evenodd" />
      {wave ? (
        <g className="nb-hoof">
          <rect x="42" y="36" width="5.5" height="12" rx="2.75" />
        </g>
      ) : null}
    </svg>
  )
}

/**
 * The sheep's silhouette, stroked and drawn first, so the fills on top leave
 * a clean ink outline around the outside only. Its colour is a custom
 * property: transparent unless a page asks for ink, as on paper.
 */
export function Outline({ className = 'nb-outline' }: { className?: string }) {
  return (
    <g className={className}>
      <rect x="20" y="44" width="5" height="14" rx="2.5" />
      <rect x="35" y="44" width="5" height="14" rx="2.5" />
      {WOOL.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
      ))}
      <ellipse cx="17.5" cy="31" rx="6.5" ry="3.2" transform="rotate(-22 17.5 31)" />
      <ellipse cx="42.5" cy="31" rx="6.5" ry="3.2" transform="rotate(22 42.5 31)" />
    </g>
  )
}

/** One sheep of the flock, from the shared symbol. */
export function FlockSheep({ className }: { className?: string }) {
  return (
    <svg className={`flock-sheep${className ? ` ${className}` : ''}`} viewBox={SHEEP_VIEWBOX} aria-hidden="true" overflow="visible">
      <use href="#sheep" />
    </svg>
  )
}

const ALMOND = 'M58 132C108 62 312 62 362 132C312 206 108 206 58 132Z'
const FIBERS = Array.from({ length: 28 }, (_, i) => (i / 28) * Math.PI * 2)

/**
 * The Cyclops's eye, set into the rock. The iris moves with `--px`/`--py`
 * (in SVG units) set by the parent, so it can follow the cursor without
 * re-rendering React.
 */
export function CyclopsEye({ className }: { className?: string }) {
  return (
    <svg className={`cyclops${className ? ` ${className}` : ''}`} viewBox="0 0 420 260" aria-hidden="true" overflow="visible">
      <defs>
        <clipPath id="cy-almond">
          <path d={ALMOND} />
        </clipPath>
      </defs>
      <path
        className="cy-skin"
        d="M14 140C10 70 70 30 140 22C176 18 190 10 214 12C240 14 252 22 290 24C360 30 410 74 406 140C402 204 350 240 280 244C250 246 236 252 210 252C182 252 168 244 136 244C66 240 18 206 14 140Z"
      />
 <path className="cy-under" d="M30 150C60 214 126 238 210 238C294 238 360 214 390 150C366 196 300 222 210 222C120 222 54 196 30 150Z" />
      <path className="cy-brow" d="M40 92C92 30 328 30 380 92C336 58 84 58 40 92Z" />
      <path className="cy-crease" d="M76 112C132 66 288 66 344 112" />
      <path className="cy-bag" d="M112 196C170 222 250 222 308 196" />
      <path className="cy-bag" d="M140 214C186 230 234 230 280 214" />
      <g className="cy-lid">
        <g clipPath="url(#cy-almond)">
          <path className="cy-white" d={ALMOND} />
          <g className="cy-iris">
            <circle className="cy-iris-fill" cx="210" cy="132" r="58" />
            {FIBERS.map((a) => (
              <line
                key={a}
                className="cy-fiber"
                x1={210 + Math.cos(a) * 30}
                y1={132 + Math.sin(a) * 30}
                x2={210 + Math.cos(a) * 54}
                y2={132 + Math.sin(a) * 54}
              />
            ))}
            <circle className="cy-iris-ring" cx="210" cy="132" r="56" />
            <circle className="cy-pupil" cx="210" cy="132" r="25" />
            <circle className="cy-glint" cx="192" cy="112" r="10" />
            <circle className="cy-glint" cx="228" cy="150" r="4" />
          </g>
          <path className="cy-shade" d="M58 132C108 62 312 62 362 132C312 92 108 92 58 132Z" />
        </g>
        <path className="cy-rim cy-rim-top" d="M58 132C108 62 312 62 362 132" />
        <path className="cy-rim" d="M58 132C108 206 312 206 362 132" />
        <g className="cy-lashes">
          {[
            [96, 98, 84, 76],
            [132, 82, 124, 58],
            [172, 73, 168, 48],
            [210, 70, 210, 44],
            [248, 73, 252, 48],
            [288, 82, 296, 58],
            [324, 98, 336, 76],
          ].map(([x1, y1, x2, y2]) => (
            <line key={x1} x1={x1} y1={y1} x2={x2} y2={y2} />
          ))}
        </g>
      </g>
    </svg>
  )
}
