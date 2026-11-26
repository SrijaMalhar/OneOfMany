// The vault: who the author really is. It is stored in this browser only and
// is read by Gemini Nano on this device. Values are masked unless shown.

import { useState } from 'react'
import { DEVICE_STATUS_TEXT, type DeviceStatus } from '../ai/device'
import { ATTRIBUTES, ATTRIBUTE_HINT, ATTRIBUTE_LABEL, type Attribute, type Profile } from '../types'
import { DownloadIcon, EyeIcon, EyeOffIcon, LockIcon } from './icons'

interface Props {
  vault: Profile
  onChange: (p: Profile) => void
  device: DeviceStatus
  progress: number | null
  canDownload: boolean
  onDownload: () => void
  onForget: () => void
}

export function Vault({ vault, onChange, device, progress, canDownload, onDownload, onForget }: Props) {
  const [show, setShow] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const filled = ATTRIBUTES.filter((a) => (vault[a] ?? '').trim()).length
  const set = (a: Attribute, v: string) => onChange({ ...vault, [a]: v })

  return (
    <section className={show ? 'vault is-open' : 'vault'} aria-labelledby="vault-title">
      <div className="vault-flap" aria-hidden="true">
        <span className="seal">
          <LockIcon />
        </span>
      </div>
      <header className="vault-head">
        <div>
          <h3 id="vault-title" className="dev-h3">
            <LockIcon /> Who you really are
          </h3>
          <p className="vault-sub">
            Sealed in this browser. Only Gemini Nano on this device reads it, to check the detective’s guesses. {filled} of{' '}
            {ATTRIBUTES.length} filled.
          </p>
        </div>
        <button type="button" className="ghost-btn" onClick={() => setShow((v) => !v)} aria-pressed={show}>
          {show ? <EyeOffIcon /> : <EyeIcon />}
          {show ? 'Seal it' : 'Open'}
        </button>
      </header>

      <div className="vault-grid">
        {ATTRIBUTES.map((a) => (
          <label key={a} className="vault-field">
            <span className="vault-label">{ATTRIBUTE_LABEL[a]}</span>
            <input
              className={show ? 'vault-input' : 'vault-input is-masked'}
              value={vault[a] ?? ''}
              onChange={(e) => set(a, e.target.value)}
              placeholder={ATTRIBUTE_HINT[a]}
              autoComplete="off"
              spellCheck={false}
              data-1p-ignore
              data-lpignore="true"
            />
          </label>
        ))}
      </div>

      <footer className="vault-foot">
        <div className={`nano nano-${device}`}>
          <span className="nano-dot" aria-hidden="true" />
          <span>
            {DEVICE_STATUS_TEXT[device]}
            {device === 'downloading' && progress != null ? ` ${Math.round(progress * 100)}%` : ''}
          </span>
          {(device === 'downloadable' || device === 'downloading') && canDownload ? (
            <button type="button" className="ghost-btn" onClick={onDownload} disabled={device === 'downloading' && progress != null}>
              <DownloadIcon />
              {device === 'downloading' ? 'Resume download' : 'Download on-device model'}
            </button>
          ) : null}
        </div>
        {confirming ? (
          <span className="forget-confirm" role="group" aria-label="Confirm forgetting">
            Erase the vault, draft and settings from this browser?
            <button
              type="button"
              className="danger-btn"
              onClick={() => {
                setConfirming(false)
                onForget()
              }}
            >
              Erase
            </button>
            <button type="button" className="ghost-btn" onClick={() => setConfirming(false)}>
              Keep
            </button>
          </span>
        ) : (
          <button type="button" className="link-btn dev-link" onClick={() => setConfirming(true)}>
            Forget everything
          </button>
        )}
      </footer>
    </section>
  )
}
