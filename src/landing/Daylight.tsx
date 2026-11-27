// Out of the cave: what stays on your device and what leaves, the receipt
// that proves it, what's in the tool, and a last look at Nobody.

import { CloudIcon, LockIcon } from '../ui/icons'
import { FlockSheep, Nobody } from './art'

const KIT = [
  { name: 'The detective', body: 'A Gemini model reads your post the way a stranger would and works out what it can: city, team, employer, age.' },
  { name: 'The detective’s file', body: 'Every guess, checked against your vault on your device and stamped Found, Close or Missed.' },
  { name: 'Deep scan', body: 'An AI pass for the subtle giveaways simple rules miss. It runs on Gemini Nano in Chrome when it can, in the cloud when it can’t.' },
  { name: 'Earlier posts', body: 'Paste what this account posted before. The detective links them, the way a real investigator would.' },
  { name: 'Rewrites that keep your meaning', body: 'Each fix is checked on your device, so your post still says what you meant.' },
  { name: 'A firewall for your vault', body: 'Any AI call carrying a detail from your vault is stopped before it leaves. Test it yourself.' },
  { name: 'A receipt', body: 'Every AI call, where it ran, and how many of your details went out. It should always say zero.' },
  { name: 'A public benchmark', body: '30 fictional posts, attacked, rewritten and attacked again, so anyone can check the numbers.' },
]

export function Daylight({ onStart }: { onStart: () => void }) {
  return (
    <>
      <div className="mouth" aria-hidden="true">
        <svg viewBox="0 0 1440 200" preserveAspectRatio="none">
          <path d="M0 0H1440V200C1380 160 1340 96 1260 70C1120 26 900 16 720 16C540 16 320 26 180 70C100 96 60 160 0 200Z" />
        </svg>
      </div>

      <section className="day" aria-labelledby="day-title">
        <div className="lp-wrap">
          <h2 id="day-title" className="display lp-h2 day-h2">
            Your post goes out. You stay in.
          </h2>
          <p className="lp-sub day-sub">
            The detective has to earn every guess from your words alone. Who you really are never leaves this browser, and the
            receipt shows it.
          </p>

          <div className="split">
            <div className="split-col split-device">
              <span className="split-icon">
                <LockIcon />
              </span>
              <h3 className="display">Stays on this device</h3>
              <ul>
                <li>Your vault: employer, city, team, age, and the rest</li>
                <li>The rules that mark giveaways as you type</li>
                <li>Grading the detective’s guesses against your vault</li>
                <li>Deep scans, rewrites and the meaning check, with Gemini Nano when your Chrome has it</li>
              </ul>
            </div>
            <div className="split-col split-cloud">
              <span className="split-icon">
                <CloudIcon />
              </span>
              <h3 className="display">Goes to the cloud</h3>
              <ul>
                <li>Your post, and only your post, for the detective</li>
                <li>Deep scans and rewrites too, when Gemini Nano isn’t available</li>
                <li>Every call checked for your vault before it leaves, and logged on the receipt</li>
              </ul>
            </div>
            <figure className="receipt" aria-label="An example receipt">
              <p className="receipt-head">AI calls, this session</p>
              <dl>
                <div>
                  <dt>Find giveaways</dt>
                  <dd>device</dd>
                </div>
                <div>
                  <dt>Detective</dt>
                  <dd>cloud</dd>
                </div>
                <div>
                  <dt>Private grading</dt>
                  <dd>device</dd>
                </div>
                <div>
                  <dt>Rewrite giveaways</dt>
                  <dd>device</dd>
                </div>
                <div>
                  <dt>Meaning kept</dt>
                  <dd>device</dd>
                </div>
              </dl>
              <p className="receipt-total">
                <span>Vault values sent</span>
                <b>0</b>
              </p>
              <figcaption>An example. Yours is one click away in the tool.</figcaption>
            </figure>
          </div>

          <h2 className="display lp-h2 day-h2 kit-h2">Everything in the tool</h2>
          <ul className="kit">
            {KIT.map((k) => (
              <li key={k.name}>
                <h3>{k.name}</h3>
                <p>{k.body}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="finale">
          <div className="finale-hill" aria-hidden="true">
            {[0.2, 0.29, 0.7, 0.78, 0.86].map((x) => {
              // Stand on the curve of the hill: x is a share of the hill's width.
              const y = 220 * (1 - Math.sqrt(1 - (2 * x - 1) ** 2))
              return (
                <span key={x} className="finale-sheep" style={{ left: `${x * 100}%`, ['--y' as string]: `${y - 2}px` }}>
                  <FlockSheep />
                </span>
              )
            })}
          </div>
          <div className="finale-inner">
            <Nobody className="finale-nobody" wave look={{ x: -0.3, y: -0.4 }} title="Nobody, waving" />
            <h2 className="display finale-title">Ready to be one of many?</h2>
            <button type="button" className="lp-btn lp-btn-ink" onClick={onStart}>
              Check your post
            </button>
          </div>
        </div>
      </section>

      <footer className="lp-foot">
        <p>
          In the Odyssey, Odysseus tells the one-eyed Cyclops his name is Nobody, then slips out of the cave hidden in the flock.
          OneOfMany does the same for your post.
        </p>
        <nav aria-label="Footer">
          <a href="#check">Open the tool</a>
          <a href="#bench">Benchmark</a>
          <a href="https://github.com/SrijaMalhar/OneOfMany" target="_blank" rel="noreferrer noopener">
            Source on GitHub
          </a>
          <span>Apache-2.0</span>
        </nav>
      </footer>
    </>
  )
}
