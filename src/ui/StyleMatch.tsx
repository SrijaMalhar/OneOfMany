// Does it sound like you? The habits in your draft that could link it to
// your other accounts and, if you paste something you wrote under your real
// name, how alike the two read. All of it runs on this device, with rules:
// the sample is never sent anywhere, not even to Gemini Nano.

import { useMemo } from 'react'
import { habits, MIN_WORDS, styleMatch, wordCount, type Habit } from '../engine/style'
import { ChevronDownIcon, LockIcon } from './icons'

interface Props {
  draft: string
  known: string
  onKnown: (k: string) => void
}

const VERDICT = {
  strong: 'These read like the same person wrote them. Anyone who knows your writing could make the link.',
  some: 'Some of your habits come through. Worth smoothing the ones they share.',
  weak: 'Not much of your usual voice comes through in the draft.',
}

export function StyleMatch({ draft, known, onKnown }: Props) {
  const found = useMemo(() => habits(draft), [draft])
  const knownWords = wordCount(known)
  const ready = knownWords >= MIN_WORDS && wordCount(draft) >= 15
  const match = useMemo(() => (ready ? styleMatch(draft, known) : null), [ready, draft, known])

  return (
    <details className="disclosure style" open={known.trim() ? true : undefined}>
      <summary>
        <span className="section-title">Does it sound like you?</span>
        <span className={`disclosure-meta${found.length ? ' is-alert' : ''}`}>
          {found.length ? `${found.length} writing ${found.length === 1 ? 'habit' : 'habits'} in your draft` : 'Writing style'}
        </span>
        <ChevronDownIcon className="chev" />
      </summary>
      <div className="disclosure-body">
        <p className="section-sub">
          Accounts are often linked by how someone writes, not what they say. These habits in your draft work like a fingerprint
          across everything you post.
        </p>
        {found.length ? <Habits items={found} /> : <p className="note">No strong habits in this draft so far.</p>}

        <label className="style-known">
          <span className="field-label">Something you wrote under your real name</span>
          <textarea
            className="textarea"
            rows={4}
            value={known}
            onChange={(e) => onKnown(e.target.value)}
            placeholder="An email, a LinkedIn post, a message to your team…"
            spellCheck={false}
          />
          <span className="style-private">
            <LockIcon /> Compared with rules on this device. It’s never sent anywhere, not even to Gemini Nano.
          </span>
        </label>

        {known.trim() && !ready ? (
          <p className="note">
            {knownWords < MIN_WORDS
              ? `Paste at least ${MIN_WORDS} words for a fair comparison (${knownWords} so far).`
              : 'Write a little more of the draft to compare.'}
          </p>
        ) : null}

        {match ? (
          <div className={`panel style-result style-${match.level}`}>
            <div className="meaning-top">
              <span className="meaning-label">Style match</span>
              <span className="meaning-score">{match.score}%</span>
              <span className="small muted">a rough guide, not proof</span>
            </div>
            <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={match.score} aria-label="Style match">
              <span style={{ width: `${Math.max(2, match.score)}%` }} />
            </div>
            <p className="meaning-verdict">
              {match.bland ? 'Neither piece has a distinctive habit, so there’s little for anyone to match on. That’s good.' : VERDICT[match.level]}
            </p>
            {match.shared.length ? (
              <>
                <h4 className="style-h">Habits both share, which could link them</h4>
                <Habits items={match.shared} />
              </>
            ) : null}
            {match.avoided.length ? (
              <p className="small muted">
                Already left out of the draft: {match.avoided.map((h) => h.label.toLowerCase()).join(', ')}.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </details>
  )
}

function Habits({ items }: { items: Habit[] }) {
  return (
    <ul className="habits">
      {items.map((h) => (
        <li key={h.id}>
          <span className="habit-label">
            {h.label}
            {h.count > 1 ? <span className="habit-n"> ×{h.count}</span> : null}
          </span>
          <span className="habit-tip">{h.tip}</span>
        </li>
      ))}
    </ul>
  )
}
