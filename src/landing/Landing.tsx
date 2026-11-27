// The landing page, told as the story the name comes from. In the Odyssey,
// Odysseus tells the one-eyed Cyclops his name is Nobody, then walks out of
// the cave hidden in the flock. Here the Cyclops is the AI detective, and
// Nobody is you.

import './landing.css'
import { useRef, useState } from 'react'
import { HowItWorks } from '../ui/HowItWorks'
import { CodeIcon } from '../ui/icons'
import { SheepDefs } from '../ui/Sheep'
import { Nobody } from './art'
import { Daylight } from './Daylight'
import { Hero } from './Hero'
import { HideGame } from './HideGame'
import { Story } from './Story'

export default function Landing({ onStart }: { onStart: () => void }) {
  const [howOpen, setHowOpen] = useState(false)
  const gameRef = useRef<HTMLElement>(null)
  const storyRef = useRef<HTMLElement>(null)
  const go = (el: HTMLElement | null) => el?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="lp">
      <SheepDefs />
      <a className="lp-skip" href="#check">
        Skip to the tool
      </a>
      <header className="lp-nav">
        <a className="lp-brand" href="#" aria-label="OneOfMany home">
          <Nobody className="lp-brand-mark" look={{ x: 0.4, y: -0.3 }} />
          <span>OneOfMany</span>
        </a>
        <nav className="lp-links" aria-label="Page">
          <button type="button" onClick={() => go(gameRef.current)}>
            Play
          </button>
          <button type="button" onClick={() => go(storyRef.current)}>
            How it works
          </button>
          <a href="#bench">Benchmark</a>
          <a
            className="lp-icon"
            href="https://github.com/SrijaMalhar/OneOfMany"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Source code on GitHub"
          >
            <CodeIcon />
          </a>
          <button type="button" className="lp-btn lp-btn-wool lp-btn-sm" onClick={onStart}>
            Open the tool
          </button>
        </nav>
      </header>

      <Hero onStart={onStart} onPlay={() => go(gameRef.current)} />

      <section className="lp-play" ref={gameRef} aria-labelledby="play-title">
        <div className="lp-wrap">
          <h2 id="play-title" className="display lp-h2">
            Can the eye find you?
          </h2>
          <p className="lp-sub">
            Write the way you would on a forum. Rules on this device mark each giveaway as you type, and every one shrinks
            the flock you’re hiding in. Nothing you type here leaves your browser.
          </p>
          <HideGame onStart={onStart} />
        </div>
      </section>
      <section className="lp-story" ref={storyRef} aria-labelledby="story-title">
        <div className="lp-wrap">
          <h2 id="story-title" className="display lp-h2">
            How it works, as told on the cave wall
          </h2>
          <p className="lp-sub">
            Three steps. You can do the first one offline, and the detective never sees who you are.{' '}
            <button type="button" className="lp-inline" onClick={() => setHowOpen(true)}>
              Read the details
            </button>
          </p>
          <Story />
        </div>
      </section>

      <Daylight onStart={onStart} />

      <HowItWorks open={howOpen} onClose={() => setHowOpen(false)} />
    </div>
  )
}
