// The front door. A crowd of identical sheep stands for everyone who could
// have written a post. Each detail in the post rules some of them out, until
// only one is left: Nobody, the sheep in the mask. The tool itself stays calm;
// this is the one place with a show.

import { useEffect, useMemo, useRef, useState } from 'react'
import { loadDraft } from '../store'
import { HowItWorks } from './HowItWorks'
import { CloudIcon, CodeIcon, LockIcon, MoonIcon, ShieldIcon, SunIcon } from './icons'
import { Mark } from './Mark'
import { Sheep, SheepDefs } from './Sheep'
import { useTheme } from './theme'

const POST: (string | number)[] = [
  'Since the reorg ',
  0,
  ', our on-call rotation went ',
  1,
  '. I still had to demo at the Friday all-hands in ',
  2,
  '. My CTC is ',
  3,
  ', so should I quit before my bonus vests?',
]

// `keep` is the share of the crowd still standing after each detail.
const CLUES = [
  { text: 'in March', says: 'who went through a reorg in March', keep: 0.52 },
  { text: 'from 8 people to 3', says: 'on a team cut from 8 people to 3', keep: 0.17 },
  { text: 'the Bellandur office', says: 'working from the Bellandur office', keep: 0.035 },
  { text: '24 lakhs', says: 'on 24 lakhs. That’s one person.', keep: 0 },
]

const CROWD = 144
// Lands near the middle of the crowd at every breakpoint (24, 16 and 10 columns).
const YOU = 57
const FIRST_STEP_MS = 900
const STEP_MS = 1700

// A fixed shuffle, so the crowd thins the same way on every visit.
function seeded(n: number) {
  let a = 0x9e3779b9
  return Array.from({ length: n }, () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  })
}

export function Intro({ onStart }: { onStart: () => void }) {
  const [theme, setTheme] = useTheme()
  const [howOpen, setHowOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [run, setRun] = useState(0)
  const hasDraft = useMemo(() => loadDraft().trim().length > 0, [])
  const odds = useMemo(() => seeded(CROWD), [])
  const jitter = useMemo(() => seeded(CROWD * 2).slice(CROWD), [])
  const done = step === CLUES.length

  // Start when the crowd is on screen: on a phone it sits below the fold.
  const stageRef = useRef<HTMLElement>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = stageRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return setSeen(true)
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold: 0.45 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (done || !seen) return
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? FIRST_STEP_MS : STEP_MS)
    return () => clearTimeout(t)
  }, [step, run, done, seen])

  const replay = () => {
    setStep(0)
    setRun((r) => r + 1)
  }

  const keep = step === 0 ? 1 : CLUES[step - 1].keep
  const caption = step === 0 ? 'Everyone who could have written this.' : `…${CLUES[step - 1].says}`
  const next = theme === 'dark' ? 'light' : 'dark'

  return (
    <div className="door">
      <SheepDefs />
      <header className="topbar door-bar">
        <a className="brand" href="#" aria-label="OneOfMany home">
          <Mark size={20} />
          <span>OneOfMany</span>
        </a>
        <nav className="topbar-actions" aria-label="Site">
          <button type="button" className="btn btn-ghost btn-sm hide-sm" onClick={() => setHowOpen(true)}>
            How it works
          </button>
          <a
            className="btn btn-ghost btn-sm btn-icon"
            href="https://github.com/SrijaMalhar/OneOfMany"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Source code on GitHub"
            data-tip="Source code"
            data-tip-side="bottom"
          >
            <CodeIcon />
          </a>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-icon"
            onClick={() => setTheme(next)}
            aria-label={`Switch to ${next} theme`}
            data-tip={`${next === 'dark' ? 'Dark' : 'Light'} theme`}
            data-tip-side="bottom"
            data-tip-align="end"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </nav>
      </header>

      <main className="door-main">
        <section className="door-hero" aria-labelledby="door-title">
          <div className="door-copy">
            <h1 id="door-title" className="door-title">
              Your account is anonymous. Is your post?
            </h1>
            <p className="door-lede">
              Every detail you share rules people out. OneOfMany sends an AI detective after your draft before anyone else
              reads it, and shows you which details give you away.
            </p>
          </div>
          <div className="door-cta">
            <button type="button" className="btn btn-primary btn-lg" onClick={onStart}>
              {hasDraft ? 'Continue with your draft' : 'Check a post'}
            </button>
            <button type="button" className="btn btn-lg" onClick={() => setHowOpen(true)}>
              How it works
            </button>
          </div>
        </section>

        <figure className="stage" aria-labelledby="stage-caption" ref={stageRef}>
          <div
            className={`crowd${done ? ' is-done' : ''}`}
            role="img"
            aria-label="A crowd of identical sheep. As each detail in the post below is highlighted, most of the crowd fades, until one sheep in a violet mask is left."
          >
            {odds.map((r, i) => {
              const you = i === YOU
              const out = you ? false : done || r >= keep
              // A little jitter, so it reads as a flock rather than a grid of icons.
              const j = jitter[i]
              return (
                <span
                  key={i}
                  className={`crowd-cell${out ? ' is-out' : ''}${you ? ' is-you' : ''}${you && done ? ' is-found' : ''}`}
                  style={{
                    ['--d' as string]: `${Math.round(r * 420)}ms`,
                    ['--x' as string]: `${(j - 0.5) * 6}px`,
                    ['--y' as string]: `${(((j * 7) % 1) - 0.5) * 6}px`,
                    ['--s' as string]: you ? 1 : 0.9 + ((j * 13) % 1) * 0.16,
                  }}
                >
                  <span className="crowd-sheep">
                    <Sheep masked={you} />
                  </span>
                  {you ? <span className="crowd-tag">You</span> : null}
                </span>
              )
            })}
          </div>

          <div className="stage-foot">
            <blockquote className="stage-post">
              {POST.map((part, i) =>
                typeof part === 'string' ? (
                  <span key={i}>{part}</span>
                ) : (
                  <mark
                    key={i}
                    className={`heat ${step > part ? (step === part + 1 ? 'heat-hottest' : 'heat-hot') : 'heat-none'}`}
                  >
                    {CLUES[part].text}
                  </mark>
                ),
              )}
            </blockquote>
            <figcaption id="stage-caption" className="stage-caption">
              <span key={`${run}-${step}`} className="stage-says">
                {caption}
              </span>
              {/* Always laid out, so the stage doesn't jump when it appears. */}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={replay}
                hidden={!done}
                style={done ? undefined : { display: 'inline-flex', visibility: 'hidden' }}
              >
                Watch again
              </button>
            </figcaption>
          </div>
        </figure>

        <ul className="door-facts">
          <li>
            <span className="door-fact-icon tone-device">
              <LockIcon />
            </span>
            <span>
              <b>Who you are stays in this browser.</b> Your real details are kept on your device and used there to check the
              detective’s guesses.
            </span>
          </li>
          <li>
            <span className="door-fact-icon tone-cloud">
              <CloudIcon />
            </span>
            <span>
              <b>The detective reads only your post.</b> A Gemini model in the cloud works out what it can, the way a stranger
              would.
            </span>
          </li>
          <li>
            <span className="door-fact-icon">
              <ShieldIcon />
            </span>
            <span>
              <b>Every AI call is checked before it leaves.</b> A receipt lists each one, and shows none of your details went
              out.
            </span>
          </li>
        </ul>
      </main>

      <footer className="door-foot">
        <span>Open source, Apache-2.0</span>
        <a href="https://github.com/SrijaMalhar/OneOfMany" target="_blank" rel="noreferrer noopener">
          Source on GitHub
        </a>
        <a href="#bench">Benchmark</a>
      </footer>

      <HowItWorks open={howOpen} onClose={() => setHowOpen(false)} />
    </div>
  )
}
