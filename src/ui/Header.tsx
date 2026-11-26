import { DEVICE_STATUS_TEXT, type DeviceStatus } from '../ai/device'
import { Mark } from './Mark'
import { ReceiptIcon } from './icons'

interface Props {
  online: boolean
  device: DeviceStatus
  cloudCalls: number
  onHowItWorks: () => void
  onReceipt: () => void
}

export function Header({ online, device, cloudCalls, onHowItWorks, onReceipt }: Props) {
  return (
    <header className="top">
      <div className="top-device">
        <a className="brand" href="#" aria-label="OneOfMany home">
          <Mark size={30} />
          <span className="brand-name">OneOfMany</span>
        </a>
        <span className={`chip nano-chip nano-${device}`}>
          <span className="nano-dot" aria-hidden="true" />
          {DEVICE_STATUS_TEXT[device]}
        </span>
      </div>
      <div className="top-seam" aria-hidden="true" />
      <div className="top-cloud">
        <span className={online ? 'chip net is-online' : 'chip net is-offline'}>
          <span className="net-dot" aria-hidden="true" />
          {online ? 'Online' : 'Offline'}
        </span>
        <button type="button" className="top-btn" onClick={onHowItWorks}>
          How it works
        </button>
        <button type="button" className="top-btn" onClick={onReceipt}>
          <ReceiptIcon />
          Cloud receipt
          <span className="count" aria-label={`${cloudCalls} calls`}>
            {cloudCalls}
          </span>
        </button>
      </div>
    </header>
  )
}
