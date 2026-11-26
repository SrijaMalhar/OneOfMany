// Optional: posts the same anonymous account already published. One post can
// look safe on its own and still give you away next to the others.

import { ChevronDownIcon } from './icons'

const MAX = 3

export function EarlierPosts({ posts, onChange }: { posts: string[]; onChange: (p: string[]) => void }) {
  const filled = posts.filter((p) => p.trim()).length
  const slots = Array.from({ length: MAX }, (_, i) => posts[i] ?? '')
  return (
    <details className="disclosure" open={filled > 0 || undefined}>
      <summary>
        <span className="section-title">Earlier posts from this account</span>
        <span className="disclosure-meta">{filled ? `${filled} added` : 'Optional'}</span>
        <ChevronDownIcon className="chev" />
      </summary>
      <div className="disclosure-body">
        <p className="section-sub">
          Clues add up across posts. Paste up to three posts this account already published, and the detective tests your draft
          alone and with them. They’re public already, so they may go to the cloud.
        </p>
        {slots.map((value, i) => (
          <textarea
            key={i}
            className="textarea"
            value={value}
            rows={3}
            placeholder={`Earlier post ${i + 1}`}
            onChange={(e) => {
              const next = [...slots]
              next[i] = e.target.value
              onChange(next)
            }}
            aria-label={`Earlier post ${i + 1}`}
          />
        ))}
      </div>
    </details>
  )
}
