// Optional: posts the same anonymous account already published. One post can
// look safe on its own and still give you away next to the others.

const MAX = 3

export function EarlierPosts({ posts, onChange }: { posts: string[]; onChange: (p: string[]) => void }) {
  const filled = posts.filter((p) => p.trim()).length
  const slots = Array.from({ length: MAX }, (_, i) => posts[i] ?? '')
  return (
    <details className="earlier" open={filled > 0 || undefined}>
      <summary>
        <span className="dev-h3">Earlier posts from this account</span>
        <span className="earlier-count">{filled ? `${filled} added` : 'Optional'}</span>
      </summary>
      <p className="earlier-sub">
        Clues add up across posts. Paste up to three posts this account already published, and the detective will test your
        draft alone and together with them. They’re public already, so they may go to the cloud.
      </p>
      {slots.map((value, i) => (
        <textarea
          key={i}
          className="earlier-input"
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
    </details>
  )
}
