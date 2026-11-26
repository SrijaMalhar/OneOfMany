// The words are only part of it. A short checklist for everything this app
// can't see: timing, devices, accounts and photo metadata.

import { useState } from 'react'
import { CopyIcon } from './icons'

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
    <section className="before" aria-labelledby="before-title">
      {cleared ? (
        <span className="stamp stamp-cleared" aria-hidden="true">
          Cleared
        </span>
      ) : null}
      <h3 id="before-title" className="cloud-h3 small-h3">
        Before you post
      </h3>
      <p className="muted">
        {score == null
          ? 'You’ve changed the post since the last run. Send the detective again to check the new version.'
          : ready
            ? `The post is ${score}% exposed. The words look fine; these are the things the detective can’t see.`
            : `The post is still ${score}% exposed. Cool down the giveaways first, then come back to this list.`}
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
      <button type="button" className="ghost-btn on-light" onClick={onCopy}>
        <CopyIcon />
        {copied ? 'Copied' : 'Copy the post'}
      </button>
    </section>
  )
}
