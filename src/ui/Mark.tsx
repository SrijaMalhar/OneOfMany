// The OneOfMany mark: Nobody, the sheep in the violet mask.

import { Nobody } from '../landing/art'

export function Mark({ size = 20 }: { size?: number }) {
  return (
    <span className="mark mark-nobody" style={{ width: size + 6, height: size + 6 }} aria-hidden="true">
      <Nobody look={{ x: 0.3, y: -0.2 }} />
    </span>
  )
}
