// The words are only part of it. A short checklist for everything this app
// can't see: timing, devices, accounts and photo metadata.

import { useState } from 'react'
import { CheckIcon, CopyIcon } from './icons'

const TIPS = [
  'Post from a device and network you don’t use for work.',
  'Wait a while. Posting right after an incident narrows down the timing.',
  'Use a fresh username, with no photo or bio that matches your other accounts.',
  'Remove location and camera data from any photo before you attach it.',
  'Don’t reply in the thread to people who know you.',
]

interface Props {
  /** Exposure of the latest run, if the post hasn't changed since. */
  score: number | null
  onCopy: () => void
  copied: boolean
}

export function BeforeYouPost({ score, onCopy, copied }: Props) {
  const [done, setDone] = useState<boolean[]>(() => TIPS.map(() => false))
  const ready = score != null && score < 25
  const cleared = ready && done.every(Boolean)
  return (
    <section className="panel before" aria-labelledby="before-title">
      <div className="section-head">
        <h2 id="before-title" className="section-title">
          Before you post
        </h2>
        {cleared ? (
          <span className="badge badge-good">
            <CheckIcon /> Ready to post
          </span>
        ) : (
          <span className="small muted tnum">
            {done.filter(Boolean).length} of {TIPS.length}
          </span>
        )}
      </div>
      <p className="section-sub">
        {score == null
          ? 'You’ve changed the post since the last run. Send the detective again to check this version.'
          : ready
            ? `The words are ${score}% exposed. These are the things the detective can’t see.`
            : `The post is still ${score}% exposed. Rewrite the giveaways first, then come back to this list.`}
      </p>
      <ul className="tips">
        {TIPS.map((tip, i) => (
          <li key={tip}>
            <label>
              <input type="checkbox" checked={done[i]} onChange={() => setDone((d) => d.map((x, j) => (j === i ? !x : x)))} />
              <span>{tip}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="actions">
        <button type="button" className="btn" onClick={onCopy}>
          <CopyIcon />
          {copied ? 'Copied' : 'Copy the post'}
        </button>
      </div>
    </section>
  )
}
