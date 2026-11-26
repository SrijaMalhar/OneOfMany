import { topKind, type Counts } from '../store'
import { TELL_KIND_LABEL } from '../types'

interface Props {
  share: boolean
  onShare: (v: boolean) => void
  counts: Counts | null
  configured: boolean
}

export function Footer({ share, onShare, counts, configured }: Props) {
  const top = topKind(counts)
  return (
    <footer className="foot">
      <div className="foot-device">
        <p>
          OneOfMany is a privacy check, not a guarantee. It looks at the words only: your timing, account history, metadata and
          writing habits across many posts can still give you away.
        </p>
        <p className="muted">The sample stories describe fictional people and fictional employers.</p>
      </div>
      <div className="foot-seam" aria-hidden="true" />
      <div className="foot-cloud">
        {configured ? (
          <>
            <label className="share">
              <input type="checkbox" checked={share} onChange={(e) => onShare(e.target.checked)} />
              <span>Add the types of my giveaways (never the text) to the community count</span>
            </label>
            <p className="muted small">
              {counts?.runs
                ? `${counts.runs} ${counts.runs === 1 ? 'post' : 'posts'} checked so far${top ? `. Most common giveaway: ${TELL_KIND_LABEL[top.kind].toLowerCase()} (${top.share}%).` : '.'}`
                : 'No shared counts yet.'}
            </p>
          </>
        ) : null}
        <p>
          <a href="#bench">Benchmark: 30 posts, attacked, fixed and attacked again</a>
        </p>
      </div>
    </footer>
  )
}
