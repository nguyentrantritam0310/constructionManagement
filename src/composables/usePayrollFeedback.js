import { ref, computed } from 'vue'
import { payrollFeedbackService } from '../services/payrollFeedbackService'
import { useGlobalMessage } from './useGlobalMessage'

export function usePayrollFeedback() {
  const feedbacks = ref([])
  const loading = ref(false)
  const error = ref(null)
  const { showMessage } = useGlobalMessage()

  // Computed
  const hasFeedbacks = computed(() => feedbacks.value.length > 0)

  // Methods
  const fetchMyFeedbacks = async () => {
    loading.value = true
    error.value = null
    try {
      feedbacks.value = await payrollFeedbackService.fetchMyFeedbacks()
    } catch (err) {
      error.value = err
      showMessage('Lỗi khi tải danh sách phản ánh bảng lương', 'error')
      console.error('Error fetching payroll feedbacks:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchFeedbackById = async (payrollId) => {
    try {
      return await payrollFeedbackService.fetchFeedbackById(payrollId)
    } catch (err) {
      showMessage('Lỗi khi tải phản ánh bảng lương', 'error')
      console.error('Error fetching payroll feedback:', err)
      throw err
    }
  }

  const createFeedback = async (feedbackData) => {
    loading.value = true
    try {
      const newFeedback = await payrollFeedbackService.createFeedback(feedbackData)
      // Thêm vào đầu danh sách
      feedbacks.value.unshift(newFeedback)
      showMessage('Tạo phản ánh bảng lương thành công', 'success')
      return newFeedback
    } catch (err) {
      showMessage('Lỗi khi tạo phản ánh bảng lương', 'error')
      console.error('Error creating payroll feedback:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateFeedback = async (payrollId, feedbackData) => {
    loading.value = true
    try {
      const updatedFeedback = await payrollFeedbackService.updateFeedback(payrollId, feedbackData)
      // Cập nhật trong danh sách
      const index = feedbacks.value.findIndex(f => f.payrollID === payrollId)
      if (index !== -1) {
        feedbacks.value[index] = updatedFeedback
      }
      showMessage('Cập nhật phản ánh bảng lương thành công', 'success')
      return updatedFeedback
    } catch (err) {
      showMessage('Lỗi khi cập nhật phản ánh bảng lương', 'error')
      console.error('Error updating payroll feedback:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteFeedback = async (payrollId) => {
    loading.value = true
    try {
      await payrollFeedbackService.deleteFeedback(payrollId)
      // Xóa khỏi danh sách
      const index = feedbacks.value.findIndex(f => f.payrollID === payrollId)
      if (index !== -1) {
        feedbacks.value.splice(index, 1)
      }
      showMessage('Xóa phản ánh bảng lương thành công', 'success')
    } catch (err) {
      showMessage('Lỗi khi xóa phản ánh bảng lương', 'error')
      console.error('Error deleting payroll feedback:', err)
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
    feedbacks,
    loading,
    error,
    
    // Computed
    hasFeedbacks,
    
    // Methods
    fetchMyFeedbacks,
    fetchFeedbackById,
    createFeedback,
    updateFeedback,
    deleteFeedback,
    clearError
  }
}