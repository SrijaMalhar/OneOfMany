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
      <div className="foot-inner">
        <div className="foot-copy">
          <p>
            OneOfMany is a privacy check, not a guarantee. It looks at your words and writing habits: your timing, account history
            and metadata can still give you away.
          </p>
          <p>The sample stories describe fictional people and fictional employers.</p>
        </div>
        <div className="foot-side">
          {configured ? (
            <>
              <label className="share">
                <input type="checkbox" checked={share} onChange={(e) => onShare(e.target.checked)} />
                <span>Add the types of my giveaways, never the text, to the community count</span>
              </label>
              <p>
                {counts?.runs
                  ? `${counts.runs} ${counts.runs === 1 ? 'post' : 'posts'} checked so far${top ? `. Most common giveaway: ${TELL_KIND_LABEL[top.kind].toLowerCase()} (${top.share}%).` : '.'}`
                  : 'No shared counts yet.'}
              </p>
            </>
          ) : null}
          <a href="#bench">Benchmark: 30 posts, attacked, rewritten and attacked again</a>
        </div>
      </div>
    </footer>
  )
}
