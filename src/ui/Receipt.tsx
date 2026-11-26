// The cloud receipt: every AI call this session, where it really ran, and
// exactly what was sent. The totals are re-checked against the vault here,
// independently of the firewall that ran before each request.

import { useEffect, useRef } from 'react'
import type { Audit, CallRecord, Routing } from '../ai/receipt'
import type { FirewallTestResult } from '../ai/tasks'
import { ATTRIBUTE_LABEL, type Attribute } from '../types'
import { SourceBadge } from './Badges'
import { CloseIcon, ShieldIcon } from './icons'

const ROUTING_TEXT: Record<Routing, string> = {
  device_only: 'Device only',
  device_first: 'Device first',
  cloud_only: 'Cloud only',
}

const ROUTING_MODE: Record<Routing, string> = {
  device_only: 'ONLY_ON_DEVICE',
  device_first: 'PREFER_ON_DEVICE',
  cloud_only: 'ONLY_IN_CLOUD',
}

interface Props {
  open: boolean
  onClose: () => void
  records: CallRecord[]
  audit: Audit
  onFirewallTest: () => void
  firewallTest: FirewallTestResult | null
}

export function Receipt({ open, onClose, records, audit, onFirewallTest, firewallTest }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog ref={ref} className="drawer" onClose={onClose} aria-labelledby="receipt-title" onClick={(e) => e.target === ref.current && onClose()}>
      <div className="drawer-body">
        <header className="drawer-head">
          <h2 id="receipt-title" className="cloud-h2">
            Cloud receipt
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </header>
        <p className="muted">Every AI call in this tab, where it actually ran, and exactly what it carried. Nothing here is stored anywhere else.</p>

        <dl className="totals">
          <div>
            <dt>Ran on this device</dt>
            <dd>{audit.onDevice}</dd>
          </div>
          <div>
            <dt>Ran in the cloud</dt>
            <dd>{audit.inCloud}</dd>
          </div>
          <div className={audit.vaultValuesSent ? 'is-bad' : 'is-good'}>
            <dt>Vault values sent</dt>
            <dd>{audit.vaultValuesSent}</dd>
          </div>
          <div>
            <dt>Blocked by firewall</dt>
            <dd>{audit.blocked}</dd>
          </div>
        </dl>

        <div className="fw-test">
          <button type="button" className="ghost-btn on-light" onClick={onFirewallTest}>
            <ShieldIcon />
            Run firewall test
          </button>
          <span className="muted small">
            {firewallTest == null
              ? 'Tries to send one of your vault values through the real firewall, to a stub that can’t reach the network.'
              : firewallTest.outcome === 'blocked'
                ? `Blocked. A request carrying your ${label(firewallTest.field)} never left this device.`
                : firewallTest.outcome === 'nothing_to_test'
                  ? 'Nothing to test: every vault value is already in your post, or the vault is empty.'
                  : `Not blocked. Nothing was sent (the test uses a stub), but please report this.`}
          </span>
        </div>

        {records.length === 0 ? <p className="muted empty">No AI calls yet. Write a draft or load a story to start.</p> : null}

        <ol className="calls">
          {records.map((r) => (
            <li key={r.id} className={`call call-${r.status}`}>
              <div className="call-top">
                <span className="call-task">{r.task}</span>
                <span className={`route route-${r.routing}`} title={ROUTING_MODE[r.routing]}>
                  {ROUTING_TEXT[r.routing]}
                </span>
                {r.source ? <SourceBadge source={r.source} /> : null}
                <span className="call-ms">{r.status === 'running' ? 'running' : r.ms != null ? `${(r.ms / 1000).toFixed(1)} s` : ''}</span>
              </div>
              <div className="call-meta">
                <span>{r.model}</span>
                <span>
                  Firewall:{' '}
                  {r.firewall === 'passed' ? 'checked, no vault values' : r.firewall === 'blocked' ? 'blocked before sending' : 'not needed, device only'}
                </span>
              </div>
              {r.error ? <p className="call-error">{r.error}</p> : null}
              <details className="call-payload">
                <summary>{r.routing === 'device_only' ? 'What stayed on this device' : 'What was sent'}</summary>
                <pre>{r.payload}</pre>
              </details>
            </li>
          ))}
        </ol>
      </div>
    </dialog>
  )
}

function label(field?: string) {
  return field && field in ATTRIBUTE_LABEL ? ATTRIBUTE_LABEL[field as Attribute].toLowerCase() : 'private value'
}
