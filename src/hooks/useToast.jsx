// ============================================================
// TOAST — Simple notification system
// Usage: const { toast } = useToast(); toast({ title: "Saved!" })
// ============================================================
import { useState, useCallback } from 'react'

let toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState([])

  const toast = useCallback(({ title, description, variant = 'default', duration = 4000 }) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, title, description, variant }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, toast, dismiss }
}

// Toast container component
export function ToastContainer({ toasts, dismiss }) {
  if (!toasts.length) return null

  const colors = {
    default: 'bg-card border-border text-foreground',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`animate-fade-in rounded-xl border shadow-lg p-4 flex items-start gap-3 ${colors[t.variant] || colors.default}`}
        >
          <div className="flex-1 min-w-0">
            {t.title && <p className="text-sm font-semibold">{t.title}</p>}
            {t.description && <p className="text-sm opacity-80 mt-0.5">{t.description}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} className="text-current opacity-50 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      ))}
    </div>
  )
}
