import { ref } from 'vue'
import leaveTypeService from '../services/leaveTypeService.js'
import { useGlobalMessage } from './useGlobalMessage.js'

export function useLeaveType() {
  const leaveTypes = ref([])
  const loading = ref(false)
  const error = ref(null)
  const { showMessage } = useGlobalMessage()

  const fetchLeaveTypes = async () => {
    try {
      loading.value = true
      error.value = null
      const data = await leaveTypeService.getAllLeaveTypes()
      leaveTypes.value = data
      console.log('LeaveTypes loaded:', data)
    } catch (err) {
      console.error('Error in fetchLeaveTypes:', err)
      error.value = 'Không thể tải danh sách loại nghỉ phép'
      showMessage(error.value, 'error')
    } finally {
      loading.value = false
    }
  }

  const getLeaveTypeById = async (id) => {
    try {
      loading.value = true
      error.value = null
      const data = await leaveTypeService.getLeaveTypeById(id)
      return data
    } catch (err) {
      console.error('Error in getLeaveTypeById:', err)
      error.value = 'Không thể tải thông tin loại nghỉ phép'
      showMessage(error.value, 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    leaveTypes,
    loading,
    error,
    fetchLeaveTypes,
    getLeaveTypeById,
    clearError
  }
}
