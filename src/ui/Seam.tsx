// The line between this device and the cloud. Only public text crosses it.
// The node on the line opens the receipt, an independent audit of every call.

import { ShieldIcon } from './icons'

interface Props {
  vaultValuesSent: number
  blocked: number
  crossing: 'out' | 'back' | null
  onOpenReceipt: () => void
}

export function Seam({ vaultValuesSent, blocked, crossing, onOpenReceipt }: Props) {
  const state = crossing ? 'is-crossing' : vaultValuesSent ? 'is-bad' : ''
  const text = crossing
    ? crossing === 'out'
      ? 'Your post is crossing to the cloud'
      : 'Guesses are coming back'
    : `Firewall: ${vaultValuesSent} vault ${vaultValuesSent === 1 ? 'value' : 'values'} sent${blocked ? `, ${blocked} blocked` : ''}`
  return (
    <div className="seam">
      <button type="button" className={`seam-node ${state}`} onClick={onOpenReceipt} aria-label={`${text}. Open the receipt.`} data-tip={text} data-tip-side="bottom">
        {crossing ? <span className="spinner" aria-hidden="true" /> : <ShieldIcon />}
      </button>
    </div>
  )
}
