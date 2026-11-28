// The words are only part of it. A checklist for everything this app can't
// see, printed like a till receipt: timing, devices, accounts and photo
// metadata, plus what matters on the site you're about to post to.

import { useState } from 'react'
import { CheckIcon, CopyIcon } from './icons'
import type { Platform } from './platform'


const PLATFORMS: { id: Platform; label: string }[] = [
  { id: 'reddit', label: 'Reddit' },
  { id: 'glassdoor', label: 'Glassdoor' },
  { id: 'blind', label: 'Blind' },
  { id: 'internal', label: 'Work forum or Slack' },
  { id: 'other', label: 'Somewhere else' },
]

const FOR: Record<Platform, string[]> = {
  reddit: [
    'Post from a new account. Anyone can open a profile and read every post it has ever made.',
    'Don’t use the same account in your city’s or your employer’s subreddit.',
  ],
  glassdoor: [
    'Review forms ask for things like job title, location and how long you were there. Pick the broadest options that are still true.',
    'Sign up with an email that isn’t your work address.',
  ],
  blind: [
    'Blind checks your work email and shows your company next to the post, so readers already know where you work. Team, level and project details narrow it from there.',
    'Don’t sign up or post from a work device or the office network.',
  ],
  internal: [
    'Find out what admins can see. Workplace tools can log who posted, even in channels called anonymous.',
    'Your colleagues know how you write. Check the style section of your notebook before you post.',
  ],
  other: [],
}

const ALWAYS = [
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
  /** Where the post is headed, if a sample says so. */
  initialPlatform?: Platform
  /** From the receipt's audit: vault values that reached the cloud. */
  vaultValuesSent: number
}

export function BeforeYouPost({ score, onCopy, copied, initialPlatform = 'reddit', vaultValuesSent }: Props) {
  const [platform, setPlatform] = useState<Platform>(initialPlatform)
  const [done, setDone] = useState<Set<string>>(() => new Set())
  const tips = [...FOR[platform], ...ALWAYS]
  const ticked = tips.filter((t) => done.has(t)).length
  const ready = score != null && score < 25
  const cleared = ready && ticked === tips.length
  const toggle = (t: string) =>
    setDone((d) => {
      const next = new Set(d)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })

  return (
    <section className="before" aria-labelledby="before-title">
      <div className="before-head">
        <h2 id="before-title" className="before-title">
          Before you post
        </h2>
        {cleared ? (
          <span className="badge badge-good">
            <CheckIcon /> Ready to post
          </span>
        ) : (
          <span className="before-count tnum">
            {ticked}/{tips.length}
          </span>
        )}
      </div>
      <p className="before-sub">
        {score == null
          ? 'You’ve changed the post since the last run. Send the detective again to check this version.'
          : ready
            ? `The words are ${score}% exposed. These are the things the detective can’t see.`
            : `The post is still ${score}% exposed. Rewrite the giveaways first, then come back to this list.`}
      </p>
      <div className="segmented before-where" role="group" aria-label="Where you’re posting">
        {PLATFORMS.map((p) => (
          <button key={p.id} type="button" aria-pressed={platform === p.id} onClick={() => setPlatform(p.id)}>
            {p.label}
          </button>
        ))}
      </div>
      <ul className="tips">
        {tips.map((tip, i) => (
          <li key={tip} className={i < FOR[platform].length ? 'is-site' : undefined}>
            <label>
              <input type="checkbox" checked={done.has(tip)} onChange={() => toggle(tip)} />
              <span>{tip}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className={`before-total${vaultValuesSent ? ' is-bad' : ''}`}>
        <span>Vault values sent to the cloud</span>
        <b className="tnum">{vaultValuesSent}</b>
      </div>
      <div className="actions">
        <button type="button" className="btn" onClick={onCopy}>
          <CopyIcon />
          {copied ? 'Copied' : 'Copy the post'}
        </button>
      </div>
    </section>
  )
}
