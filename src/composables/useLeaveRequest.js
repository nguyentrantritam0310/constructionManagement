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

  const submitLeaveRequestForApproval = async (voucherCode, notes) => {
    try {
      loading.value = true
      error.value = null
      const data = await leaveRequestService.submitLeaveRequestForApproval(voucherCode, notes)
      
      // Cập nhật trong danh sách
      const index = leaveRequests.value.findIndex(item => item.voucherCode === voucherCode)
      if (index !== -1) {
        leaveRequests.value[index] = data
      }
      
      showMessage('success', 'Gửi duyệt thành công')
      return data
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi gửi duyệt'
      showMessage('error', error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  const approveLeaveRequest = async (voucherCode, notes) => {
    try {
      loading.value = true
      error.value = null
      const data = await leaveRequestService.approveLeaveRequest(voucherCode, notes)
      
      // Cập nhật trong danh sách
      const index = leaveRequests.value.findIndex(item => item.voucherCode === voucherCode)
      if (index !== -1) {
        leaveRequests.value[index] = data
      }
      
      showMessage('success', 'Duyệt đơn thành công')
      return data
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi duyệt đơn'
      showMessage('error', error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  const rejectLeaveRequest = async (voucherCode, notes) => {
    try {
      loading.value = true
      error.value = null
      const data = await leaveRequestService.rejectLeaveRequest(voucherCode, notes)
      
      // Cập nhật trong danh sách
      const index = leaveRequests.value.findIndex(item => item.voucherCode === voucherCode)
      if (index !== -1) {
        leaveRequests.value[index] = data
      }
      
      showMessage('success', 'Từ chối đơn thành công')
      return data
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi từ chối đơn'
      showMessage('error', error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  const returnLeaveRequest = async (voucherCode, notes) => {
    try {
      loading.value = true
      error.value = null
      const data = await leaveRequestService.returnLeaveRequest(voucherCode, notes)
      
      // Cập nhật trong danh sách
      const index = leaveRequests.value.findIndex(item => item.voucherCode === voucherCode)
      if (index !== -1) {
        leaveRequests.value[index] = data
      }
      
      showMessage('success', 'Trả lại đơn thành công')
      return data
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi trả lại đơn'
      showMessage('error', error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  const createMultipleLeaveRequests = async (leaveRequestsToCreate) => {
    let successCount = 0
    let failureCount = 0
    const errors = []

    for (const leaveRequestData of leaveRequestsToCreate) {
      try {
        await createLeaveRequest(leaveRequestData)
        successCount++
      } catch (err) {
        failureCount++
        const errorMsg = err.response?.data?.message || err.message || 'Lỗi không xác định'
        errors.push(`Dòng ${leaveRequestsToCreate.indexOf(leaveRequestData) + 1}: ${errorMsg}`)
      }
    }

    if (successCount > 0) {
      showMessage(`Đã tạo thành công ${successCount} đơn nghỉ phép${failureCount > 0 ? `, thất bại ${failureCount} đơn` : ''}`, 'success')
    }

    if (errors.length > 0) {
      const errorMessage = `Có ${errors.length} đơn không thể tạo:\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? `\n... và ${errors.length - 10} lỗi khác` : ''}`
      showMessage(errorMessage, 'error')
    }

    if (successCount === 0 && failureCount > 0) {
      throw new Error('Không thể tạo đơn nghỉ phép nào')
    }

    await fetchLeaveRequests()
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
    createMultipleLeaveRequests,
    updateLeaveRequest,
    deleteLeaveRequest,
    submitLeaveRequestForApproval,
    approveLeaveRequest,
    rejectLeaveRequest,
    returnLeaveRequest,
    clearError
  }
}
