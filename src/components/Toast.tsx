import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { animateToastEnter, animateToastExit } from '../lib/motion'

interface ToastItem {
  id: number
  message: string
}

const ToastContext = createContext<(message: string) => void>(() => {})

export const useToast = (): ((message: string) => void) => useContext(ToastContext)

function ToastEntry({ message, onExpire }: { message: string; onExpire: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) animateToastEnter(ref.current)
    const exitTimer = setTimeout(() => {
      if (ref.current) animateToastExit(ref.current, onExpire)
    }, 4700)
    return () => clearTimeout(exitTimer)
  }, [onExpire])

  return (
    <div
      ref={ref}
      className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-red-400 shadow-lg"
    >
      {message}
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const push = useCallback((message: string) => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, message }])
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  useEffect(() => window.api.onError(push), [push])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed top-12 right-[368px] z-50 flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <ToastEntry key={t.id} message={t.message} onExpire={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
