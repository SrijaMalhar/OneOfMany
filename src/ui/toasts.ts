// A tiny store for toasts: things that just happened, with an optional
// action such as Undo. Kept outside React state so any handler can call it.

export interface Toast {
  id: number
  message: string
  action?: { label: string; run: () => void }
}

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export function toast(message: string, action?: Toast['action'], ms = action ? 7000 : 3500) {
  const id = nextId++
  toasts = [...toasts, { id, message, action }].slice(-3)
  emit()
  setTimeout(() => dismiss(id), ms)
  return id
}

export function dismiss(id: number) {
  if (!toasts.some((t) => t.id === id)) return
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function snapshot() {
  return toasts
}
