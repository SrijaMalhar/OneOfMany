// Threads: a detective's string board drawn across the firewall. Each thread
// runs from words in your draft to the fact the detective worked out from
// them. Positions are measured from the DOM, relative to the split layout.

import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import type { FactStatus } from '../engine/grade'
import type { Attribute } from '../types'

export interface Link {
  attribute: Attribute
  status: FactStatus
}

interface Line {
  key: string
  attribute: Attribute
  status: FactStatus
  d: string
  x1: number
  y1: number
  x2: number
  y2: number
}

interface Props {
  container: RefObject<HTMLElement | null>
  links: Link[]
  active: Attribute | null
  /** Anything that can move the endpoints: the draft, the run, the scope. */
  version: string
}

export function Threads({ container, links, active, version }: Props) {
  const [lines, setLines] = useState<Line[]>([])
  const [size, setSize] = useState({ w: 0, h: 0 })
  const linksRef = useRef(links)
  useLayoutEffect(() => {
    linksRef.current = links
  })
  const linksKey = links.map((l) => `${l.attribute}:${l.status}`).join(',')

  useLayoutEffect(() => {
    const root = container.current
    if (!root) return
    let frame = 0

    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const box = root.getBoundingClientRect()
        // The split stacks into one column on small screens; threads would
        // only tangle there.
        const links = linksRef.current
        if (!links.length || box.width < 1040) {
          setLines([])
          return
        }
        const out: Line[] = []
        for (const link of links) {
          const row = root.querySelector<HTMLElement>(`.file .dz-row[data-attr="${link.attribute}"]`)
          const frame = root.querySelector<HTMLElement>('.vf-frame')
          if (!row || !frame) continue
          const t = row.getBoundingClientRect()
          const x2 = t.left - box.left + 1
          const y2 = t.top - box.top + 22
          // Threads leave from the edge of the draft frame, level with the
          // words, so they never cross the text you're reading.
          const port = frame.getBoundingClientRect().right - box.left - 3
          root.querySelectorAll<HTMLElement>('.vf-mirror mark[data-attrs]').forEach((mark, i) => {
            if (!(mark.dataset.attrs ?? '').split(' ').includes(link.attribute)) return
            const rects = mark.getClientRects()
            const r = rects[rects.length - 1]
            if (!r) return
            const x1 = port
            const y1 = r.top - box.top + r.height / 2
            const dx = Math.max(60, (x2 - x1) * 0.5)
            out.push({
              key: `${link.attribute}-${i}`,
              attribute: link.attribute,
              status: link.status,
              d: `M${x1.toFixed(1)} ${y1.toFixed(1)} C${(x1 + dx).toFixed(1)} ${y1.toFixed(1)} ${(x2 - dx).toFixed(1)} ${y2.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`,
              x1,
              y1,
              x2,
              y2,
            })
          })
        }
        setSize({ w: box.width, h: box.height })
        setLines(out)
      })
    }

    measure()
    // Tiles settle after their entrance animation.
    const late = setTimeout(measure, 900)
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    addEventListener('resize', measure)
    document.fonts?.ready.then(measure)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(late)
      ro.disconnect()
      removeEventListener('resize', measure)
    }
  }, [container, linksKey, version])

  if (!lines.length) return null
  return (
    <svg className={active ? 'threads has-active' : 'threads'} width={size.w} height={size.h} aria-hidden="true">
      {lines.map((l, i) => (
        <g key={`${version}-${l.key}`} className={`thread thread-${l.status}${active === l.attribute ? ' is-active' : ''}`} style={{ ['--i' as string]: i }}>
          <path d={l.d} pathLength={1} />
          <circle className="pin" cx={l.x1} cy={l.y1} r="3.5" />
          <circle className="pin" cx={l.x2} cy={l.y2} r="4" />
        </g>
      ))}
    </svg>
  )
}
