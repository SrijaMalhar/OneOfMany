// The vault: who the author really is. It is stored in this browser only and
// is read on this device. Sealed values show as redaction bars; focusing a
// field lifts its bar so it can be edited.

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
    <section className="panel" aria-labelledby="vault-title">
      <header className="vault-head">
        <div>
          <h2 id="vault-title" className="section-title">
            <LockIcon /> Who you really are
          </h2>
          <p className="section-sub">
            Stored in this browser only, and read only on this device to check the detective’s guesses.{' '}
            <span className="tnum">
              {filled} of {ATTRIBUTES.length}
            </span>{' '}
            filled.
          </p>
        </div>
        <button type="button" className="btn btn-sm" onClick={() => setShow((v) => !v)} aria-pressed={show}>
          {show ? <EyeOffIcon /> : <EyeIcon />}
          {show ? 'Hide' : 'Show'}
        </button>
      </header>

      <div className="vault-grid">
        {ATTRIBUTES.map((a) => {
          const value = vault[a] ?? ''
          const sealed = !show && value.length > 0
          return (
            <label key={a} className="field">
              <span className="field-label">{ATTRIBUTE_LABEL[a]}</span>
              <span className="field-control">
                <input
                  className={sealed ? 'input is-sealed' : 'input'}
                  value={value}
                  onChange={(e) => set(a, e.target.value)}
                  placeholder={ATTRIBUTE_HINT[a]}
                  autoComplete="off"
                  spellCheck={false}
                  data-1p-ignore
                  data-lpignore="true"
                />
                {sealed ? <span className="redaction" style={{ ['--len' as string]: Math.min(value.length, 40) }} aria-hidden="true" /> : null}
              </span>
            </label>
          )
        })}
      </div>

      <footer className="vault-foot">
        <span className={`nano nano-${device}`}>
          <span className="dot" aria-hidden="true" />
          {DEVICE_STATUS_TEXT[device]}
          {device === 'downloading' && progress != null ? <span className="tnum"> {Math.round(progress * 100)}%</span> : null}
          {(device === 'downloadable' || device === 'downloading') && canDownload ? (
            <button type="button" className="btn btn-sm" onClick={onDownload} disabled={device === 'downloading' && progress != null}>
              <DownloadIcon />
              {device === 'downloading' ? 'Resume download' : 'Download Gemini Nano'}
            </button>
          ) : null}
        </span>
        {confirming ? (
          <span className="confirm-inline" role="group" aria-label="Confirm erasing">
            Erase the vault, draft and settings from this browser?
            <button
              type="button"
              className="btn btn-sm btn-danger btn-solid"
              onClick={() => {
                setConfirming(false)
                onForget()
              }}
            >
              Erase
            </button>
            <button type="button" className="btn btn-sm" onClick={() => setConfirming(false)}>
              Keep
            </button>
          </span>
        ) : (
          <button type="button" className="btn btn-ghost btn-sm btn-danger" onClick={() => setConfirming(true)}>
            Forget everything
          </button>
        )}
      </footer>
    </section>
  )
}
