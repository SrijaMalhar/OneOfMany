// Nobody, the mascot. In the Odyssey, Odysseus tells the Cyclops his name is
// Nobody, then escapes hidden in the flock. Here, Nobody is the sheep that
// stands for you: it warms up with every giveaway in your draft, steps out of
// line when the detective finds you, and blends back in when you're safe.

import type { CSSProperties } from 'react'

export type Mood = 'calm' | 'happy' | 'worried' | 'exposed'
export type Glow = 'none' | 'warm' | 'hot' | 'hottest'

const EYE = 'var(--sheep-eye)'

/** Shared body parts, drawn once and reused by every sheep in a flock. */
export function SheepDefs() {
  return (
    <svg width="0" height="0" className="sr-defs" aria-hidden="true" focusable="false">
      <defs>
        <symbol id="sheep-wool" viewBox="0 0 60 64">
          <circle cx="15" cy="29" r="10" />
          <circle cx="22" cy="19" r="10.5" />
          <circle cx="31" cy="15" r="10.5" />
          <circle cx="40" cy="19" r="10.5" />
          <circle cx="46" cy="29" r="10" />
          <circle cx="41" cy="39" r="10.5" />
          <circle cx="30" cy="42" r="10.5" />
          <circle cx="19" cy="39" r="10.5" />
          <circle cx="30" cy="29" r="13" />
        </symbol>
        <symbol id="sheep" viewBox="0 0 60 64">
          <SheepBody />
          <Face mood="calm" />
        </symbol>
      </defs>
    </svg>
  )
}

function SheepBody() {
  return (
    <>
      <rect x="20" y="44" width="5" height="14" rx="2.5" fill="var(--sheep-leg)" />
      <rect x="35" y="44" width="5" height="14" rx="2.5" fill="var(--sheep-leg)" />
      <use href="#sheep-wool" width="60" height="64" fill="var(--sheep-wool)" />
      <ellipse cx="17.5" cy="31" rx="6.5" ry="3.2" transform="rotate(-22 17.5 31)" fill="var(--sheep-face)" />
      <ellipse cx="42.5" cy="31" rx="6.5" ry="3.2" transform="rotate(22 42.5 31)" fill="var(--sheep-face)" />
      <path d="M30 23c6.5 0 9.5 5 9.5 11 0 6.5-4.5 11-9.5 11s-9.5-4.5-9.5-11c0-6 3-11 9.5-11z" fill="var(--sheep-face)" />
      <g fill="var(--sheep-wool)">
        <circle cx="26" cy="23.5" r="4" />
        <circle cx="30.5" cy="21.5" r="4.6" />
        <circle cx="34.6" cy="23.6" r="3.8" />
      </g>
    </>
  )
}

function Face({ mood }: { mood: Mood }) {
  const blush = mood === 'calm' || mood === 'happy'
  return (
    <g className="sheep-face">
      {blush ? (
        <g fill="#ff8fb3" opacity="0.55">
          <ellipse cx="25" cy="37.6" rx="1.6" ry="1" />
          <ellipse cx="35" cy="37.6" rx="1.6" ry="1" />
        </g>
      ) : null}
      {mood === 'calm' ? (
        <g className="sheep-eyes" fill={EYE}>
          <ellipse cx="26.5" cy="33" rx="1.9" ry="2.4" />
          <ellipse cx="33.5" cy="33" rx="1.9" ry="2.4" />
        </g>
      ) : null}
      {mood === 'happy' ? (
        <path d="M24.6 33.6q1.9-2.6 3.8 0M31.6 33.6q1.9-2.6 3.8 0" stroke={EYE} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      ) : null}
      {mood === 'worried' ? (
        <>
          <g className="sheep-eyes" fill={EYE}>
            <ellipse cx="26.5" cy="33.5" rx="2" ry="2.6" />
            <ellipse cx="33.5" cy="33.5" rx="2" ry="2.6" />
          </g>
          <path d="M23.6 29.6l4.8-1.6M36.4 29.6l-4.8-1.6" stroke={EYE} strokeWidth="1.4" strokeLinecap="round" />
          <path className="sweat" d="M45 23q2.2 3.4 0 5-2.2-1.6 0-5z" fill="#9fdcff" />
        </>
      ) : null}
      {mood === 'exposed' ? (
        <>
          <circle cx="26.5" cy="33" r="3.2" fill="#fff" />
          <circle cx="33.5" cy="33" r="3.2" fill="#fff" />
          <circle cx="26.5" cy="33.4" r="1.6" fill={EYE} />
          <circle cx="33.5" cy="33.4" r="1.6" fill={EYE} />
        </>
      ) : null}
      {mood === 'exposed' ? (
        <ellipse cx="30" cy="40.2" rx="1.8" ry="2.2" fill={EYE} />
      ) : mood === 'worried' ? (
        <path d="M27.6 40.6q2.4-1.6 4.8 0" stroke={EYE} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M27.6 39.4q2.4 2 4.8 0" stroke={EYE} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      )}
    </g>
  )
}

/** Nobody, drawn in full so its face can change. */
export function Sheep({ mood, glow = 'none', size = 64, title }: { mood: Mood; glow?: Glow; size?: number; title?: string }) {
  return (
    <svg
      className={`sheep sheep-${mood} glow-${glow}`}
      viewBox="0 0 60 64"
      width={size}
      height={(size * 64) / 60}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <SheepBody />
      <Face mood={mood} />
      {mood === 'exposed' ? (
        <g className="alarm" fill="var(--hottest)">
          <rect x="48" y="2" width="4" height="10" rx="2" />
          <circle cx="50" cy="16" r="2.2" />
        </g>
      ) : null}
    </svg>
  )
}

/** Any other sheep in the flock: one shared drawing. */
export function FlockSheep({ size = 48, style, className }: { size?: number; style?: CSSProperties; className?: string }) {
  return (
    <svg className={className ? `sheep ${className}` : 'sheep'} viewBox="0 0 60 64" width={size} height={(size * 64) / 60} style={style} aria-hidden="true">
      <use href="#sheep" width="60" height="64" />
    </svg>
  )
}

// Positions in the hero flock: x offset (%), lift (px) and size (px).
const HERD = [
  [0, 3, 52],
  [10.5, 0, 56],
  [21, 7, 48],
  [31, 0, 0], // Nobody
  [44, 4, 54],
  [55, 9, 46],
  [65, 0, 58],
  [77, 6, 50],
  [88, 2, 54],
] as const

interface FlockProps {
  mood: Mood
  glow: Glow
  says: string
  /** Steps out of line when the detective found you. */
  singledOut: boolean
}

export function Flock({ mood, glow, says, singledOut }: FlockProps) {
  return (
    <div className={singledOut ? 'flock is-singled' : 'flock'}>
      <div className="bubble" role="status" aria-live="polite">
        <span className="bubble-name">Nobody</span>
        <span key={says} className="bubble-text">
          {says}
        </span>
      </div>
      <div className="herd" aria-hidden="true">
        {HERD.map(([x, lift, size], i) =>
          size ? (
            <span key={i} className="herd-sheep" style={{ left: `${x}%`, bottom: lift }}>
              <FlockSheep size={size} />
            </span>
          ) : (
            <span key={i} className="herd-sheep herd-you" style={{ left: `${x}%`, bottom: lift }}>
              <Sheep mood={mood} glow={glow} size={64} />
            </span>
          ),
        )}
      </div>
    </div>
  )
}

/**
 * The crowd you'd hide in, as a flock that thins out. This is an
 * illustration, not a measurement: each recovered fact rules out a large
 * share of the crowd, each narrowed fact a smaller one.
 */
export function Crowd({ recovered, narrowed }: { recovered: number; narrowed: number }) {
  const TOTAL = 48
  const left = Math.max(1, Math.round(TOTAL * 0.5 ** recovered * 0.75 ** narrowed))
  const youAt = 21
  // Rule out sheep in a scattered but stable order, keeping "you".
  const order = Array.from({ length: TOTAL }, (_, i) => i)
    .filter((i) => i !== youAt)
    .sort((a, b) => ((a * 37) % 47) - ((b * 37) % 47))
  const out = new Set(order.slice(0, TOTAL - left))
  return (
    <div className="crowd">
      <div className="crowd-grid" aria-hidden="true">
        {Array.from({ length: TOTAL }, (_, i) =>
          i === youAt ? (
            <span key={i} className={left <= 3 ? 'crowd-cell is-you is-alone' : 'crowd-cell is-you'}>
              <Sheep mood={left <= 3 ? 'exposed' : left <= 12 ? 'worried' : 'calm'} size={26} />
            </span>
          ) : (
            <span key={i} className={out.has(i) ? 'crowd-cell is-out' : 'crowd-cell'} style={{ ['--d' as string]: `${order.indexOf(i) * 18}ms` }}>
              <FlockSheep size={26} />
            </span>
          ),
        )}
      </div>
      <p className="crowd-text">
        {left <= 3 ? (
          <>
            <strong>You’re easy to pick out.</strong> Of a flock of {TOTAL}, the facts it found leave {left === 1 ? 'only you' : `you and ${left - 1} other${left - 1 === 1 ? '' : 's'}`}.
          </>
        ) : left >= TOTAL / 2 ? (
          <>
            <strong>You’re one of many.</strong> {left} of {TOTAL} still match what it found.
          </>
        ) : (
          <>
            <strong>{left} of {TOTAL} still match.</strong> Every fact it pins down rules more of the crowd out.
          </>
        )}{' '}
        <span className="muted">An illustration, not a count.</span>
      </p>
    </div>
  )
}
