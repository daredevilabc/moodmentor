import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

let toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, showToast, removeToast }
}

export default function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  }

  const colors = {
    success: 'border-green-500/50 bg-green-500/10 text-green-400',
    error: 'border-red-500/50 bg-red-500/10 text-red-400',
    info: 'border-primary-500/50 bg-primary-500/10 text-primary-400',
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3" aria-live="polite">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ duration: 0.25, type: 'spring', stiffness: 200 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-lg cursor-pointer ${colors[toast.type] || colors.info}`}
            onClick={() => onRemove(toast.id)}
            role="alert"
          >
            <span className="text-lg font-bold">{icons[toast.type] || icons.info}</span>
            <p className="text-sm font-medium">{toast.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
