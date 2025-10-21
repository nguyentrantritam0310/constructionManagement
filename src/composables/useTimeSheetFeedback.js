import { ref, computed } from 'vue'
import { timeSheetFeedbackService } from '../services/timeSheetFeedbackService'
import { useGlobalMessage } from './useGlobalMessage'

export function useTimeSheetFeedback() {
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
      feedbacks.value = await timeSheetFeedbackService.fetchMyFeedbacks()
    } catch (err) {
      error.value = err
      showMessage('Lỗi khi tải danh sách phản ánh bảng công', 'error')
      console.error('Error fetching timesheet feedbacks:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchFeedbackById = async (timeSheetId) => {
    try {
      return await timeSheetFeedbackService.fetchFeedbackById(timeSheetId)
    } catch (err) {
      showMessage('Lỗi khi tải phản ánh bảng công', 'error')
      console.error('Error fetching timesheet feedback:', err)
      throw err
    }
  }

  const createFeedback = async (feedbackData) => {
    loading.value = true
    try {
      const newFeedback = await timeSheetFeedbackService.createFeedback(feedbackData)
      // Thêm vào đầu danh sách
      feedbacks.value.unshift(newFeedback)
      showMessage('Tạo phản ánh bảng công thành công', 'success')
      return newFeedback
    } catch (err) {
      showMessage('Lỗi khi tạo phản ánh bảng công', 'error')
      console.error('Error creating timesheet feedback:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateFeedback = async (timeSheetId, feedbackData) => {
    loading.value = true
    try {
      const updatedFeedback = await timeSheetFeedbackService.updateFeedback(timeSheetId, feedbackData)
      // Cập nhật trong danh sách
      const index = feedbacks.value.findIndex(f => f.timeSheetID === timeSheetId)
      if (index !== -1) {
        feedbacks.value[index] = updatedFeedback
      }
      showMessage('Cập nhật phản ánh bảng công thành công', 'success')
      return updatedFeedback
    } catch (err) {
      showMessage('Lỗi khi cập nhật phản ánh bảng công', 'error')
      console.error('Error updating timesheet feedback:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteFeedback = async (timeSheetId) => {
    loading.value = true
    try {
      await timeSheetFeedbackService.deleteFeedback(timeSheetId)
      // Xóa khỏi danh sách
      const index = feedbacks.value.findIndex(f => f.timeSheetID === timeSheetId)
      if (index !== -1) {
        feedbacks.value.splice(index, 1)
      }
      showMessage('Xóa phản ánh bảng công thành công', 'success')
    } catch (err) {
      showMessage('Lỗi khi xóa phản ánh bảng công', 'error')
      console.error('Error deleting timesheet feedback:', err)
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