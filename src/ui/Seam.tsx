// The line between this device and the cloud, drawn as police tape. Only
// public text crosses it. The pin on the tape opens the receipt, an
// independent audit of every call.

import { ShieldIcon } from './icons'

interface Props {
  vaultValuesSent: number
  blocked: number
  crossing: 'out' | 'back' | null
  onOpenReceipt: () => void
}

// Long enough to run the full height of the workspace on any screen.
const TAPE = Array.from({ length: 48 }, () => 'FIREWALL • YOUR VAULT STAYS ON THIS SIDE • ').join('')

export function Seam({ vaultValuesSent, blocked, crossing, onOpenReceipt }: Props) {
  const state = crossing ? 'is-crossing' : vaultValuesSent ? 'is-bad' : ''
  const text = crossing
    ? crossing === 'out'
      ? 'Your post is crossing to the cloud'
      : 'Guesses are coming back'
    : `Firewall: ${vaultValuesSent} vault ${vaultValuesSent === 1 ? 'value' : 'values'} sent${blocked ? `, ${blocked} blocked` : ''}`
  return (
    <div className="seam">
      <span className="seam-tape" aria-hidden="true">
        {TAPE}
      </span>
      <button type="button" className={`seam-node ${state}`} onClick={onOpenReceipt} aria-label={`${text}. Open the receipt.`} data-tip={text} data-tip-side="bottom">
        {crossing ? <span className="spinner" aria-hidden="true" /> : <ShieldIcon />}
      </button>
    </div>
  )
}
