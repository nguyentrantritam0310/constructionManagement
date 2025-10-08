import { ref, computed } from 'vue'
import leaveRequestService from '../services/leaveRequestService.js'
import { useGlobalMessage } from './useGlobalMessage.js'

export function useLeaveRequest() {
  const { showMessage } = useGlobalMessage()
  
  // State
  const leaveRequests = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Computed
  const leaveRequestsCount = computed(() => leaveRequests.value.length)

  // Actions
  const fetchLeaveRequests = async () => {
    try {
      loading.value = true
      error.value = null
      const data = await leaveRequestService.getAllLeaveRequests()
      leaveRequests.value = data
      return data
    } catch (err) {
      error.value = err.message || 'Có lỗi xảy ra khi tải danh sách đơn nghỉ phép'
      showMessage('error', error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getLeaveRequestById = async (voucherCode) => {
    try {
      loading.value = true
      error.value = null
      const data = await leaveRequestService.getLeaveRequestById(voucherCode)
      return data
    } catch (err) {
      error.value = err.message || 'Có lỗi xảy ra khi tải thông tin đơn nghỉ phép'
      showMessage('error', error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  const createLeaveRequest = async (leaveRequestData) => {
    try {
      loading.value = true
      error.value = null
      const data = await leaveRequestService.createLeaveRequest(leaveRequestData)
      leaveRequests.value.unshift(data) // Thêm vào đầu danh sách
      showMessage('success', 'Tạo đơn nghỉ phép thành công')
      return data
    } catch (err) {
      error.value = err.message || 'Có lỗi xảy ra khi tạo đơn nghỉ phép'
      showMessage('error', error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateLeaveRequest = async (voucherCode, leaveRequestData) => {
    try {
      loading.value = true
      error.value = null
      const data = await leaveRequestService.updateLeaveRequest(voucherCode, leaveRequestData)
      
      // Cập nhật trong danh sách
      const index = leaveRequests.value.findIndex(item => item.voucherCode === voucherCode)
      if (index !== -1) {
        leaveRequests.value[index] = data
      }
      
      showMessage('success', 'Cập nhật đơn nghỉ phép thành công')
      return data
    } catch (err) {
      error.value = err.message || 'Có lỗi xảy ra khi cập nhật đơn nghỉ phép'
      showMessage('error', error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteLeaveRequest = async (voucherCode) => {
    try {
      loading.value = true
      error.value = null
      await leaveRequestService.deleteLeaveRequest(voucherCode)
      
      // Xóa khỏi danh sách
      const index = leaveRequests.value.findIndex(item => item.voucherCode === voucherCode)
      if (index !== -1) {
        leaveRequests.value.splice(index, 1)
      }
      
      showMessage('success', 'Xóa đơn nghỉ phép thành công')
    } catch (err) {
      error.value = err.message || 'Có lỗi xảy ra khi xóa đơn nghỉ phép'
      showMessage('error', error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    leaveRequests,
    loading,
    error,
    
    // Computed
    leaveRequestsCount,
    
    // Actions
    fetchLeaveRequests,
    getLeaveRequestById,
    createLeaveRequest,
    updateLeaveRequest,
    deleteLeaveRequest,
    clearError
  }
}
