// A handful of 16px line icons, drawn for this app.

import type { ReactNode } from 'react'

type P = { className?: string; title?: string }

function Svg({ className, title, children }: P & { children: ReactNode }) {
  return (
    <svg
      className={className ? `icon ${className}` : 'icon'}
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}

export const LockIcon = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="7" width="10" height="7" rx="1.5" />
    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
  </Svg>
)

export const ChipIcon = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="4" width="8" height="8" rx="1.5" />
    <path d="M6.5 1.5v2M9.5 1.5v2M6.5 12.5v2M9.5 12.5v2M1.5 6.5h2M1.5 9.5h2M12.5 6.5h2M12.5 9.5h2" />
  </Svg>
)

export const CloudIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 12.5h7a3 3 0 0 0 .4-5.97A4 4 0 0 0 4.2 7.6 2.5 2.5 0 0 0 4.5 12.5Z" />
  </Svg>
)

export const ShieldIcon = (p: P) => (
  <Svg {...p}>
    <path d="M8 1.75 3 3.5v4.25c0 3 2.2 5.4 5 6.5 2.8-1.1 5-3.5 5-6.5V3.5L8 1.75Z" />
  </Svg>
)

export const RulerIcon = (p: P) => (
  <Svg {...p}>
    <path d="M2 11 11 2l3 3-9 9-3-3Z" />
    <path d="M5 8l1.5 1.5M7 6l1 1M9 4l1.5 1.5" />
  </Svg>
)

export const EyeIcon = (p: P) => (
  <Svg {...p}>
    <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" />
    <circle cx="8" cy="8" r="2" />
  </Svg>
)

export const EyeOffIcon = (p: P) => (
  <Svg {...p}>
    <path d="M6.2 3.8A6.6 6.6 0 0 1 8 3.5C12 3.5 14.5 8 14.5 8a11 11 0 0 1-1.7 2.2M10.1 12a6.3 6.3 0 0 1-2.1.5C4 12.5 1.5 8 1.5 8a11.5 11.5 0 0 1 2.6-3.1" />
    <path d="M2 2l12 12" />
  </Svg>
)

export const CopyIcon = (p: P) => (
  <Svg {...p}>
    <rect x="5" y="5" width="8.5" height="8.5" rx="1.5" />
    <path d="M10.5 5V3.5A1.5 1.5 0 0 0 9 2H3.5A1.5 1.5 0 0 0 2 3.5V9A1.5 1.5 0 0 0 3.5 10.5H5" />
  </Svg>
)

export const CloseIcon = (p: P) => (
  <Svg {...p}>
    <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
  </Svg>
)

export const SearchIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5 14 14" />
  </Svg>
)

export const DownloadIcon = (p: P) => (
  <Svg {...p}>
    <path d="M8 2v8M4.5 7 8 10.5 11.5 7M2.5 13.5h11" />
  </Svg>
)

export const ReceiptIcon = (p: P) => (
  <Svg {...p}>
    <path d="M3.5 1.75h9v12.5l-1.5-1-1.5 1-1.5-1-1.5 1-1.5-1-1.5 1V1.75Z" />
    <path d="M6 5h4M6 7.75h4M6 10.5h2" />
  </Svg>
)

export const ArrowUpRightIcon = (p: P) => (
  <Svg {...p}>
    <path d="M5 11 11 5M6 5h5v5" />
  </Svg>
)

export const InfoIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 7.25v3.5M8 5.25v.01" />
  </Svg>
)

export const SunIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="2.75" />
    <path d="M8 1.75v1.5M8 12.75v1.5M1.75 8h1.5M12.75 8h1.5M3.6 3.6l1.05 1.05M11.35 11.35l1.05 1.05M3.6 12.4l1.05-1.05M11.35 4.65l1.05-1.05" />
  </Svg>
)

export const MoonIcon = (p: P) => (
  <Svg {...p}>
    <path d="M13.25 9.5A5.5 5.5 0 0 1 6.5 2.75a5.5 5.5 0 1 0 6.75 6.75Z" />
  </Svg>
)

export const ChevronDownIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 6l4 4 4-4" />
  </Svg>
)

export const CodeIcon = (p: P) => (
  <Svg {...p}>
    <path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5" />
  </Svg>
)

export const CheckIcon = (p: P) => (
  <Svg {...p}>
    <path d="M3 8.5 6.5 12 13 4.5" />
  </Svg>
)
