import { ref } from 'vue'
import { workshiftService } from '../services/workshiftService'
import { useGlobalMessage } from './useGlobalMessage'

export function useWorkShift() {
  const workshifts = ref([])
  const loading = ref(false)
  const error = ref(null)
  const { showMessage } = useGlobalMessage()

  const fetchWorkShifts = async () => {
    try {
      loading.value = true
      error.value = null
      workshifts.value = await workshiftService.getAll()
    } catch (err) {
      console.error('Error in fetchWorkShifts:', err)
      error.value = 'Không thể tải danh sách ca làm '
      showMessage(error.value, 'error')
    } finally {
      loading.value = false
    }
  }

  return {
    workshifts,
    loading,
    error,
    fetchWorkShifts
  }
}
