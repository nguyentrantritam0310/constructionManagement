import api from '../api'

export const payrollFeedbackService = {
  // Lấy danh sách phản ánh bảng lương của nhân viên hiện tại
  async fetchMyFeedbacks() {
    try {
      const response = await api.get('/PayrollFeedback/my-feedbacks')
      return response.data
    } catch (error) {
      console.error('Error fetching my payroll feedbacks:', error)
      throw error
    }
  },

  // Lấy phản ánh bảng lương theo ID
  async fetchFeedbackById(payrollId) {
    try {
      const response = await api.get(`/PayrollFeedback/${payrollId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching payroll feedback:', error)
      throw error
    }
  },

  // Tạo phản ánh bảng lương mới
  async createFeedback(feedbackData) {
    try {
      const response = await api.post('/PayrollFeedback', feedbackData)
      return response.data
    } catch (error) {
      console.error('Error creating payroll feedback:', error)
      throw error
    }
  },

  // Cập nhật phản ánh bảng lương
  async updateFeedback(payrollId, feedbackData) {
    try {
      const response = await api.put(`/PayrollFeedback/${payrollId}`, feedbackData)
      return response.data
    } catch (error) {
      console.error('Error updating payroll feedback:', error)
      throw error
    }
  },

  // Xóa phản ánh bảng lương
  async deleteFeedback(payrollId) {
    try {
      const response = await api.delete(`/PayrollFeedback/${payrollId}`)
      return response.data
    } catch (error) {
      console.error('Error deleting payroll feedback:', error)
      throw error
    }
  }
}