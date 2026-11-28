// The opening scene: the Cyclops's eye in a cave cut from kraft paper sweeps
// its highlighter beam over the flock, and follows your cursor. Nobody, in the front row, watches it and
// ducks when the light passes over. Everything per-frame is written to CSS
// variables and classes directly, so React renders the scene once.

import { useEffect, useMemo, useRef } from 'react'
import { CyclopsEye, FlockSheep, Nobody } from './art'

interface Spot {
  /** Centre, as a share of the band's width. */
  x: number
  /** Pixels up from the bottom of the band, before scaling. */
  y: number
  size: number
  row: 0 | 1 | 2
  you?: boolean
}

// Three rows, back to front. A fixed layout, so the flock is the same on
// every visit; Nobody stands in the front row, right of centre.
function layout(): Spot[] {
  const rows: { n: number; size: number; y: number }[] = [
    { n: 15, size: 0.62, y: 118 },
    { n: 13, size: 0.8, y: 58 },
    { n: 10, size: 1, y: 0 },
  ]
  const spots: Spot[] = []
  let seed = 7
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  rows.forEach((r, row) => {
    for (let i = 0; i < r.n; i++) {
      const x = ((i + 0.5 + (rand() - 0.5) * 0.5) / r.n) * 1.08 - 0.04
      spots.push({ x, y: r.y + (rand() - 0.5) * 14, size: r.size * (0.92 + rand() * 0.14), row: row as 0 | 1 | 2 })
    }
  })
  const front = spots.filter((s) => s.row === 2)
  const you = front.reduce((best, s) => (Math.abs(s.x - 0.64) < Math.abs(best.x - 0.64) ? s : best))
  you.you = true
  you.size = 1.04
  return spots
}

const SPREAD = (10 * Math.PI) / 180

export function Hero({ onStart, onPlay }: { onStart: () => void; onPlay: () => void }) {
  const sceneRef = useRef<HTMLDivElement>(null)
  const eyeRef = useRef<HTMLDivElement>(null)
  const spots = useMemo(() => layout(), [])

  useEffect(() => {
    const scene = sceneRef.current
    const eye = eyeRef.current
    if (!scene || !eye) return
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    const sheep = [...scene.querySelectorAll<HTMLElement>('[data-spot]')]
    const nobody = scene.querySelector<HTMLElement>('.hero-you')

    let W = 0
    let H = 0
    let ex = 0
    let ey = 0
    let centres: { x: number; y: number }[] = []
    const measure = () => {
      const box = scene.getBoundingClientRect()
      W = box.width
      H = box.height
      const e = eye.getBoundingClientRect()
      // The pupil sits at (210, 132) of the 420 x 260 drawing.
      ex = e.left - box.left + e.width * 0.5
      ey = e.top - box.top + e.height * (132 / 260)
      scene.style.setProperty('--ex', `${ex}px`)
      scene.style.setProperty('--ey', `${ey}px`)
      scene.style.setProperty('--beam', `${Math.hypot(W, H)}px`)
      centres = sheep.map((s) => {
        const r = s.getBoundingClientRect()
        return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height * 0.45 }
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(scene)

    let target: { x: number; y: number } | null = null
    let lastMove = -Infinity
    const onMove = (ev: PointerEvent) => {
      const box = scene.getBoundingClientRect()
      target = { x: ev.clientX - box.left, y: ev.clientY - box.top }
      lastMove = performance.now()
    }
    const onLeave = () => (lastMove = -Infinity)
    scene.addEventListener('pointermove', onMove)
    scene.addEventListener('pointerleave', onLeave)

    let ax = 0
    let raf = 0
    const t0 = performance.now()
    const frame = (now: number) => {
      // Idle: a slow sweep across the flock. Recent pointer: look there.
      const sweepX = W * (0.5 + 0.42 * Math.sin((now - t0) / 2600))
      const idle = { x: still ? W * 0.64 : sweepX, y: H - 90 }
      const goal = now - lastMove < 2200 && target ? target : idle
      const dx = goal.x - ex
      const dy = Math.max(goal.y - ey, 60)
      const want = Math.atan2(dx, dy)
      ax += (want - ax) * (still ? 1 : 0.07)
      const deg = (-ax * 180) / Math.PI
      scene.style.setProperty('--angle', `${deg}deg`)
      // The iris follows the beam, a little.
      const reach = Math.min(1, Math.hypot(dx, dy) / 700)
      scene.style.setProperty('--px', `${Math.sin(ax) * 62 * reach}`)
      scene.style.setProperty('--py', `${Math.cos(ax) * 20 * reach}`)

      let youLit = false
      for (let i = 0; i < sheep.length; i++) {
        const c = centres[i]
        if (!c) continue
        const a = Math.atan2(c.x - ex, c.y - ey)
        const lit = Math.abs(a - ax) < SPREAD * 0.8
        sheep[i].classList.toggle('is-lit', lit)
        if (lit && sheep[i].classList.contains('hero-you')) youLit = true
      }
      if (nobody) {
        nobody.classList.toggle('is-ducking', youLit)
        // Nobody keeps an eye on the eye.
        const n = centres[sheep.indexOf(nobody)]
        if (n) {
          const lx = Math.max(-1, Math.min(1, (ex - n.x) / 300))
          nobody.style.setProperty('--lx', `${lx}`)
          nobody.style.setProperty('--ly', `${youLit ? 0.6 : -0.8}`)
        }
      }
      if (!still) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      scene.removeEventListener('pointermove', onMove)
      scene.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-scene" ref={sceneRef}>
        <svg className="hero-rock" viewBox="0 0 1440 220" preserveAspectRatio="none" aria-hidden="true">
          <path
            className="rock-back"
            d="M0 0H1440V96C1400 120 1376 84 1340 104C1300 128 1290 170 1258 150C1226 130 1220 92 1180 98C1140 104 1132 140 1096 132C1060 124 1066 82 1020 80C974 78 968 118 930 112C892 106 900 70 860 66C820 62 808 98 770 94C732 90 736 58 696 60C656 62 650 104 610 100C570 96 580 52 536 56C492 60 494 112 452 110C410 108 418 64 376 66C334 68 336 120 296 122C256 124 260 74 220 76C180 78 178 130 138 128C98 126 104 72 64 76C34 79 20 104 0 110Z"
          />
          <path
            className="rock-front"
            d="M0 0H1440V52C1414 62 1398 40 1372 50C1346 60 1350 96 1322 92C1294 88 1300 54 1270 52C1240 50 1236 74 1208 70C1180 66 1188 40 1156 40C1124 40 1124 66 1094 64C1064 62 1070 36 1038 36C1006 36 1004 58 974 56C944 54 950 30 918 32C886 34 888 76 856 78C824 80 830 40 798 40C766 40 768 62 738 60C708 58 714 30 682 32C650 34 652 58 622 58C592 58 596 34 566 34C536 34 536 70 504 72C472 74 478 40 446 40C414 40 416 62 386 60C356 58 362 32 330 34C298 36 300 84 266 86C232 88 240 44 206 44C172 44 176 66 146 64C116 62 122 36 90 36C58 36 54 60 26 58C14 57 6 52 0 50Z"
          />
        </svg>

        <div className="hero-beam" aria-hidden="true" />

        <div className="hero-eye" ref={eyeRef}>
          <CyclopsEye />
        </div>

        <div className="hero-copy">
          <h1 id="hero-title" className="display hero-title">
            Your account is anonymous. Is your{' '}
            <span className="circled">
              post?
              <svg viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true">
                <path pathLength={1} d="M34 16C86 0 172 4 190 40C202 72 146 96 92 93C38 90 4 72 10 46C15 26 48 12 104 9" />
              </svg>
            </span>
          </h1>
          <p className="hero-lede">
            Every detail you share rules someone out. OneOfMany sends an AI detective after your draft before anyone else
            reads it, then helps you blend back into the flock.
          </p>
          <div className="hero-cta">
            <button type="button" className="lp-btn lp-btn-gold" onClick={onStart}>
              Check your post
            </button>
            <button type="button" className="lp-btn lp-btn-line" onClick={onPlay}>
              Play: can the eye find you?
            </button>
          </div>
        </div>

        <div className="hero-flock" role="img" aria-label="A flock of sheep in a cave, lit by the beam of a giant eye. One sheep in the front row wears a small violet mask.">
          <svg className="hero-ground" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 40C180 8 360 28 560 22C760 16 940 2 1120 14C1260 24 1360 36 1440 30V120H0Z" />
          </svg>
          {spots
            .filter((s) => s.you)
            .map((s) => (
              <span
                key="note"
                className="hero-note"
                style={{ left: `${s.x * 100}%`, bottom: `calc(${s.y}px * var(--k) + var(--sheep) * 1.02)` }}
                aria-hidden="true"
              >
                <svg viewBox="0 0 150 70">
                  <text x="34" y="22">
                    that’s you
                  </text>
                  <path d="M40 32C26 40 22 52 30 64M30 64L22 54M30 64L38 57" />
                </svg>
              </span>
            ))}
          {spots.map((s, i) => (
            <span
              key={i}
              data-spot=""
              className={`hero-sheep row-${s.row}${s.you ? ' hero-you' : ''}`}
              style={{
                left: `${s.x * 100}%`,
                bottom: `calc(${s.y}px * var(--k))`,
                width: `calc(${s.size} * var(--sheep))`,
              }}
            >
              {s.you ? <Nobody title="Nobody, the sheep in the violet mask. That’s you." /> : <FlockSheep />}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
