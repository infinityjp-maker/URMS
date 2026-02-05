import { createContext, useContext, useState, useCallback, useEffect } from 'react'

type ToastItem = { id: number; message: string }

const ToastContext = createContext<{ show(message: string): void } | null>(null)

export function ToastProvider({ children }: { children: any }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const show = useCallback((message: string) => {
    const id = Date.now()
    setToasts((t) => [...t, { id, message }])
    setTimeout(() => setToasts((t) => t.filter(x => x.id !== id)), 3500)
  }, [])

  // listen for fallback window events to show toast from non-react code
  useEffect(() => {
    const handler = (e: any) => {
      if (e && e.detail && e.detail.message) show(e.detail.message)
    }
    window.addEventListener('urms:toast', handler as EventListener)
    return () => window.removeEventListener('urms:toast', handler as EventListener)
  }, [show])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 9999 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '8px 12px', borderRadius: 6, marginTop: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export default ToastProvider
