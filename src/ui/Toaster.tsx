import { useSyncExternalStore } from 'react'
import { CloseIcon } from './icons'
import { dismiss, snapshot, subscribe } from './toasts'

export function Toaster() {
  const items = useSyncExternalStore(subscribe, snapshot, snapshot)
  return (
    <ol className="toaster" aria-live="polite" aria-label="Notifications">
      {items.map((t) => (
        <li key={t.id} className="toast" role="status">
          <span className="toast-msg">{t.message}</span>
          {t.action ? (
            <button
              type="button"
              className="toast-action"
              onClick={() => {
                t.action?.run()
                dismiss(t.id)
              }}
            >
              {t.action.label}
            </button>
          ) : null}
          <button type="button" className="toast-close" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
            <CloseIcon />
          </button>
        </li>
      ))}
    </ol>
  )
}
