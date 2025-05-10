import { ref } from 'vue'

export function useToast() {
  const toasts = ref([])
  const defaultDuration = 3000 // 3 seconds

  const showToast = (message, type = 'success', duration = defaultDuration) => {
    const id = Date.now()
    toasts.value.push({
      id,
      message,
      type,
      duration
    })

    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  const removeToast = (id) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  const showSuccess = (message, duration) => {
    showToast(message, 'success', duration)
  }

  const showError = (message, duration) => {
    showToast(message, 'error', duration)
  }

  const showWarning = (message, duration) => {
    showToast(message, 'warning', duration)
  }

  const showInfo = (message, duration) => {
    showToast(message, 'info', duration)
  }

  return {
    toasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast
  }
}
