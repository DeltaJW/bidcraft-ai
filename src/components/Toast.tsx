import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react'

interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

let toastId = 0
const listeners = new Set<(msg: ToastMessage) => void>()

export function toast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  const msg: ToastMessage = { id: ++toastId, type, message }
  listeners.forEach((fn) => fn(msg))
}

const ICONS = {
  success: CheckCircle,
  error: AlertTriangle,
  info: Info,
}

const STYLES = {
  success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  error: 'bg-red-500/15 border-red-500/30 text-red-400',
  info: 'bg-accent/15 border-accent/30 text-accent',
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((msg: ToastMessage) => {
    setToasts((prev) => [...prev, msg])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== msg.id))
    }, 3000)
  }, [])

  useEffect(() => {
    listeners.add(addToast)
    return () => { listeners.delete(addToast) }
  }, [addToast])

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 no-print">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.type]
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-lg ${STYLES[t.type]}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="p-0.5 opacity-60 hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer text-current"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
