import * as React from 'react'

type ToastVariant = 'default' | 'destructive' | 'success'
interface ToastData {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  open: boolean
  onOpenChange: (open: boolean) => void
}
type Toast = Omit<ToastData, 'id' | 'open' | 'onOpenChange'>

const listeners: Array<(toasts: ToastData[]) => void> = []
let toasts: ToastData[] = []
let count = 0

function dispatch(toast: ToastData) {
  toasts = [toast, ...toasts].slice(0, 3)
  listeners.forEach((l) => l([...toasts]))
}

const REMOVE_DELAY = 4000

export function toast(data: Toast) {
  const id = String(++count)
  const remove = () => {
    toasts = toasts.map((t) => (t.id === id ? { ...t, open: false } : t))
    listeners.forEach((l) => l([...toasts]))
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id)
      listeners.forEach((l) => l([...toasts]))
    }, 300)
  }
  dispatch({
    ...data,
    id,
    open: true,
    onOpenChange: (open) => { if (!open) remove() },
  })
  setTimeout(remove, REMOVE_DELAY)
  return { id, dismiss: remove }
}

export function useToast() {
  const [state, setState] = React.useState<ToastData[]>(toasts)
  React.useEffect(() => {
    listeners.push(setState)
    return () => { const i = listeners.indexOf(setState); if (i > -1) listeners.splice(i, 1) }
  }, [])
  return { toasts: state, toast }
}
