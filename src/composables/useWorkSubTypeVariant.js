import { ref } from 'vue'
import api from '../api'

export function useWorkSubTypeVariant() {
  const variants = ref([])
  const loading = ref(false)
  const error = ref(null)

  const loadVariants = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/WorkSubTypeVariant')
      variants.value = response.data
    } catch (err) {
      console.error('Error loading work sub type variants:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  return {
    variants,
    loading,
    error,
    loadVariants
  }
}
