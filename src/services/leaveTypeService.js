import api from '../api.js'

const leaveTypeService = {
  // Lấy danh sách tất cả loại nghỉ phép
  async getAllLeaveTypes() {
    try {
      const response = await api.get('/LeaveType')
      return response.data
    } catch (error) {
      console.error('Error fetching leave types:', error)
      throw error
    }
  },

  // Lấy loại nghỉ phép theo ID
  async getLeaveTypeById(id) {
    try {
      const response = await api.get(`/LeaveType/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching leave type:', error)
      throw error
    }
  }
}

export default leaveTypeService
