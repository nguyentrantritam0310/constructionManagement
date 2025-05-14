import { ref } from 'vue'

export const toasts = ref([])

export const removeToast = (id) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index !== -1) {
        toasts.value.splice(index, 1)
    }
}