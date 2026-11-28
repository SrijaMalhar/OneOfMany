// How it works, in three pencil sketches on index cards, in the order things
// happen. A displacement filter roughens every stroke so it reads as drawn
// by hand.

import { MASK } from '../ui/sheepShape'

/** A woolly outline: a ring of bumps around an ellipse. */
function cloud(cx: number, cy: number, rx: number, ry: number, bumps = 9) {
  let d = ''
  for (let i = 0; i <= bumps; i++) {
    const a = (i / bumps) * Math.PI * 2 - Math.PI / 2
    const x = cx + Math.cos(a) * rx
    const y = cy + Math.sin(a) * ry
    if (i === 0) d += `M${x.toFixed(1)} ${y.toFixed(1)}`
    else {
      const r = ((Math.PI * 2 * Math.max(rx, ry)) / bumps) * 0.55
      d += `A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`
    }
  }
  return `${d}Z`
}

/** A sketched sheep, facing the viewer. `masked` draws Nobody. */
function ChalkSheep({ x, y, s = 1, masked = false }: { x: number; y: number; s?: number; masked?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path className="ch-line" d="M-11 20V34M11 20V34" />
      <path className="ch-line ch-wool" d={cloud(0, 0, 30, 24, 11)} />
      <path className="ch-line ch-face" d="M0 -10C9 -10 12 -3 12 5C12 14 6 19 0 19C-6 19-12 14-12 5C-12 -3-9 -10 0 -10Z" />
      <path className="ch-line" d="M-12 0L-21 -3M12 0L21 -3" />
      {masked ? (
        <path className="ch-mask" d={MASK} fillRule="evenodd" transform="translate(0 4) scale(1.2) translate(-30 -33)" />
      ) : (
        <path className="ch-dot" d="M-4.5 4h.1M4.5 4h.1" />
      )}
    </g>
  )
}

function Eye({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path className="ch-line" d="M-58 0C-30 -34 30 -34 58 0C30 34 -30 34 -58 0Z" />
      <circle className="ch-iris" cx="0" cy="2" r="17" />
      <circle className="ch-pupil" cx="0" cy="2" r="7" />
      <path className="ch-line" d="M-40 -22L-48 -36M-20 -29L-23 -45M0 -31V-48M20 -29L23 -45M40 -22L48 -36" />
    </g>
  )
}

function Scroll({ x, y, lines = 4 }: { x: number; y: number; lines?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path className="ch-line" d="M-34 -40H30C38 -40 38 -28 30 -28M-34 -40C-42 -40 -42 -28 -34 -28V40H34V-28" />
      {Array.from({ length: lines }, (_, i) => (
        <path key={i} className="ch-line ch-thin" d={`M-24 ${-14 + i * 13}H${i === lines - 1 ? 6 : 24}`} />
      ))}
    </g>
  )
}

const STEPS = [
  {
    title: 'Write it here',
    body: 'Type your post and, if you like, who you really are. That stays in this browser, and rules on your device start marking giveaways.',
    art: (
      <>
        <circle className="ch-line ch-dash" cx="160" cy="118" r="92" />
        <ChalkSheep x={118} y={128} s={1.25} masked />
        <Scroll x={214} y={118} />
        <g transform="translate(160 26)">
          <path className="ch-line" d="M-10 0V-8C-10 -16 10 -16 10 -8V0" />
          <rect className="ch-line ch-solid" x="-14" y="0" width="28" height="20" rx="4" />
        </g>
      </>
    ),
  },
  {
    title: 'The eye reads only your words',
    body: 'A Gemini model in the cloud gets your post and nothing else, and tries to work out who wrote it. Your device checks its guesses against your vault.',
    art: (
      <>
        <Eye x={110} y={86} s={1.15} />
        <path className="ch-line ch-dash" d="M150 112L206 140M138 128L196 162M120 132L178 182" />
        <Scroll x={236} y={160} />
        <path className="ch-line ch-thin" d="M206 126L262 160M210 140L250 138" />
      </>
    ),
  },
  {
    title: 'Blur what gave you away',
    body: 'Swap each giveaway for a vaguer word, or let Gemini Nano rewrite it on your device. Then send the detective again, and walk out with the flock.',
    art: (
      <>
        <path className="ch-line" d="M224 210V118C224 70 300 70 300 118V210" />
        <path className="ch-line ch-sun" d="M262 52V36M236 60L226 48M288 60L298 48" />
        <ChalkSheep x={48} y={170} s={0.72} />
        <ChalkSheep x={104} y={170} s={0.72} />
        <ChalkSheep x={160} y={170} s={0.72} masked />
        <ChalkSheep x={212} y={178} s={0.62} />
        <path className="ch-line ch-thin" d="M20 212H310" />
        <Eye x={70} y={52} s={0.5} />
        <path className="ch-line ch-thin" d="M108 30C108 22 118 20 120 26C122 32 114 34 114 40M114 47V48" />
      </>
    ),
  },
]

export function Story() {
  return (
    <div className="story">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="chalk" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <ol className="story-list">
        {STEPS.map((s, i) => (
          <li key={s.title} className="story-step">
            <svg className="story-art" viewBox="0 0 320 230" role="img" aria-label={`Sketch: ${s.title}`}>
              <g filter="url(#chalk)">{s.art}</g>
            </svg>
            <div className="story-text">
              <span className="display story-n" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="display story-title">{s.title}</h3>
              <p>{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
