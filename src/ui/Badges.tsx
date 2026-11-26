// Small badges that say where a piece of work actually ran. The label always
// comes from what the SDK reported (`inferenceSource`), never from a guess.

import type { Origin } from '../types'
import { ChipIcon, CloudIcon, RulerIcon } from './icons'

const TEXT: Record<Origin, string> = {
  on_device: 'On this device',
  in_cloud: 'In the cloud',
  rule: 'Rules on this device',
}

export function SourceBadge({ source, label }: { source: Origin; label?: string }) {
  const Icon = source === 'on_device' ? ChipIcon : source === 'in_cloud' ? CloudIcon : RulerIcon
  return (
    <span className={`badge badge-${source}`}>
      <Icon />
      {label ?? TEXT[source]}
    </span>
  )
}
