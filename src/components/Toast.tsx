import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

interface ToastItem {
  id: number
  message: string
}

const ToastContext = createContext<(message: string) => void>(() => {})

export const useToast = (): ((message: string) => void) => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const push = useCallback((message: string) => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, message }])
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 5000)
  }, [])

  useEffect(() => window.api.onError(push), [push])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed top-12 right-[368px] z-50 flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-red-400 shadow-lg"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
