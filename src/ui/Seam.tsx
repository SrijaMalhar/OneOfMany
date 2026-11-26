// The line between this device and the cloud. Only public text crosses it;
// the counter is an independent audit of everything that actually did.

import { ShieldIcon } from './icons'

interface Props {
  vaultValuesSent: number
  blocked: number
  crossing: 'out' | 'back' | null
  onOpenReceipt: () => void
}

export function Seam({ vaultValuesSent, blocked, crossing, onOpenReceipt }: Props) {
  return (
    <div className="seam" aria-label="Firewall between your device and the cloud">
      <button type="button" className="seam-pill" onClick={onOpenReceipt} title="Open the cloud receipt">
        <ShieldIcon />
        <span className="seam-text">
          <span className="seam-n">{vaultValuesSent}</span> vault values crossed
          {blocked ? <span className="seam-blocked">, {blocked} blocked</span> : null}
        </span>
      </button>
      {crossing ? (
        <span className={`packet packet-${crossing}`} aria-hidden="true">
          {crossing === 'out' ? 'post' : 'guesses'}
        </span>
      ) : null}
    </div>
  )
}
