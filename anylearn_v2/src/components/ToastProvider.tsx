'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const TOAST_DURATION_MS = 4000

type ToastMessage = { kind: 'success' | 'error'; text: string }
type ToastEntry = ToastMessage & { id: number }

const ToastContext = createContext<(toast: ToastMessage) => void>(() => {})

export const useToast = () => useContext(ToastContext)

function ToastItem({ toast, onDone }: { toast: ToastEntry; onDone: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDone(toast.id), TOAST_DURATION_MS)
    return () => clearTimeout(timer)
  }, [toast.id, onDone])

  // light tones so a toast stands apart from the solid green buttons and bars it may sit next to
  const colorClass = toast.kind === 'success' ? 'bg-green-soft text-green-dark ring-green-line' : 'bg-red-soft text-red ring-red-line'
  return (
    <button
      type="button"
      onClick={() => onDone(toast.id)}
      className={`pointer-events-auto w-full cursor-pointer rounded-xl border-0 px-4 py-3 text-left text-sm font-bold shadow-lg ring-1 ${colorClass}`}
    >
      {toast.text}
    </button>
  )
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([])

  const show = useCallback((toast: ToastMessage) => {
    setToasts((current) => [...current, { ...toast, id: Date.now() + Math.random() }])
  }, [])
  const dismiss = useCallback((id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)), [])
  const contextValue = useMemo(() => show, [show])

  return (
    <ToastContext value={contextValue}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--app-tabs-h)+var(--compare-bar-h,0px)+var(--fixed-bar-h,0px)+0.5rem)] z-[60] mx-auto flex max-w-[480px] flex-col gap-2 px-3 lg:bottom-[calc(var(--fixed-bar-h,0px)+1.5rem)]"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDone={dismiss} />
        ))}
      </div>
    </ToastContext>
  )
}
