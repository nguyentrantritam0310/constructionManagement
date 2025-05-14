import { toasts, removeToast } from './toastStore'

const defaultDuration = 3000

const showToast = (message, type = 'success', duration = defaultDuration) => {
  const id = Date.now() + Math.random()
  toasts.value.push({ id, message, type, duration })
  setTimeout(() => {
    removeToast(id)
  }, duration)
}

export function useToast() {
  return {
    toasts,
    showSuccess: (msg, duration) => showToast(msg, 'success', duration),
    showError: (msg, duration) => showToast(msg, 'error', duration),
    showWarning: (msg, duration) => showToast(msg, 'warning', duration),
    showInfo: (msg, duration) => showToast(msg, 'info', duration),
    removeToast
  }
}
