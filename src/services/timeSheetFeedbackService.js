import api from '../api'

export const timeSheetFeedbackService = {
  // Lấy danh sách phản ánh bảng công của nhân viên hiện tại
  async fetchMyFeedbacks() {
    try {
      const response = await api.get('/TimeSheetFeedback/my-feedbacks')
      return response.data
    } catch (error) {
      console.error('Error fetching my timesheet feedbacks:', error)
      throw error
    }
  },

  // Lấy phản ánh bảng công theo ID
  async fetchFeedbackById(timeSheetId) {
    try {
      const response = await api.get(`/TimeSheetFeedback/${timeSheetId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching timesheet feedback:', error)
      throw error
    }
  },

  // Tạo phản ánh bảng công mới
  async createFeedback(feedbackData) {
    try {
      const response = await api.post('/TimeSheetFeedback', feedbackData)
      return response.data
    } catch (error) {
      console.error('Error creating timesheet feedback:', error)
      throw error
    }
  },

  // Cập nhật phản ánh bảng công
  async updateFeedback(timeSheetId, feedbackData) {
    try {
      const response = await api.put(`/TimeSheetFeedback/${timeSheetId}`, feedbackData)
      return response.data
    } catch (error) {
      console.error('Error updating timesheet feedback:', error)
      throw error
    }
  },

  // Xóa phản ánh bảng công
  async deleteFeedback(timeSheetId) {
    try {
      const response = await api.delete(`/TimeSheetFeedback/${timeSheetId}`)
      return response.data
    } catch (error) {
      console.error('Error deleting timesheet feedback:', error)
      throw error
    }
  }
}