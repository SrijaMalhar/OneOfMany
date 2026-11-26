import { DEVICE_STATUS_TEXT, type DeviceStatus } from '../ai/device'
import { CodeIcon, MoonIcon, ReceiptIcon, ShieldIcon, SunIcon } from './icons'
import { Mark } from './Mark'
import type { Theme } from './theme'

interface Props {
  online: boolean
  device: DeviceStatus
  cloudCalls: number
  vaultValuesSent: number
  theme: Theme
  onTheme: (t: Theme) => void
  onHowItWorks: () => void
  onReceipt: () => void
}

const DEVICE_SHORT: Record<DeviceStatus, string> = {
  checking: 'Checking',
  unsupported: 'Not in this browser',
  unavailable: 'Not available',
  downloadable: 'Ready to download',
  downloading: 'Downloading',
  available: 'Ready',
}

const DEVICE_TONE: Record<DeviceStatus, string> = {
  checking: 'tone-busy',
  unsupported: '',
  unavailable: '',
  downloadable: 'tone-warn',
  downloading: 'tone-busy',
  available: 'tone-device',
}

export function Header({ online, device, cloudCalls, vaultValuesSent, theme, onTheme, onHowItWorks, onReceipt }: Props) {
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <header className="topbar">
      <a className="brand" href="#" aria-label="OneOfMany home">
        <Mark size={20} />
        <span>OneOfMany</span>
      </a>
      <div className="topbar-status">
        <span className={`status ${DEVICE_TONE[device]}`} data-tip={DEVICE_STATUS_TEXT[device]} data-tip-side="bottom" tabIndex={0}>
          <span className="dot" aria-hidden="true" />
          <span>
            <span className="hide-sm">Gemini Nano: </span>
            {DEVICE_SHORT[device]}
          </span>
        </span>
        <span
          className={`status hide-md ${vaultValuesSent ? 'tone-bad' : 'tone-good'}`}
          data-tip="Every AI call is checked for your vault values before it leaves, and audited again after. The receipt lists them."
          data-tip-side="bottom"
          tabIndex={0}
        >
          <ShieldIcon />
          <span className="tnum">{vaultValuesSent}</span> vault values sent
        </span>
        <span className={`status hide-sm ${online ? 'tone-good' : 'tone-bad'}`}>
          <span className="dot" aria-hidden="true" />
          {online ? 'Online' : 'Offline'}
        </span>
      </div>
      <nav className="topbar-actions" aria-label="App">
        <button type="button" className="btn btn-ghost btn-sm hide-sm" onClick={onHowItWorks}>
          How it works
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onReceipt} aria-label="Receipt of every AI call">
          <ReceiptIcon />
          <span className="hide-sm">Receipt</span>
          <span className="count" aria-label={`${cloudCalls} cloud calls`}>
            {cloudCalls}
          </span>
        </button>
        <a
          className="btn btn-ghost btn-sm btn-icon hide-sm"
          href="https://github.com/SrijaMalhar/OneOfMany"
          target="_blank"
          rel="noreferrer noopener"
          aria-label="Source code on GitHub"
          data-tip="Source code"
          data-tip-side="bottom"
        >
          <CodeIcon />
        </a>
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-icon"
          onClick={() => onTheme(next)}
          aria-label={`Switch to ${next} theme`}
          data-tip={`${next === 'dark' ? 'Dark' : 'Light'} theme`}
          data-tip-side="bottom"
          data-tip-align="end"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </nav>
    </header>
  )
}
