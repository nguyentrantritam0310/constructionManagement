import api from '../api.js'

const approvalHistoryService = {
  // Lấy lịch sử duyệt
  async getApprovalHistory(requestType, requestId) {
    try {
      const response = await api.get(`/ApprovalHistory/${requestType}/${requestId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching approval history:', error)
      throw error
    }
  },

  // Hoàn tác lịch sử gần nhất
  async undoLatestHistory(requestType, requestId) {
    try {
      const response = await api.delete(`/ApprovalHistory/${requestType}/${requestId}/undo`)
      return response.data
    } catch (error) {
      console.error('Error undoing approval history:', error)
      throw error
    }
  }
}

export default approvalHistoryService

