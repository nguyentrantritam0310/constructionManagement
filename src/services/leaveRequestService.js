import api from '../api.js'

const leaveRequestService = {
  // Lấy danh sách tất cả đơn nghỉ phép
  async getAllLeaveRequests() {
    try {
      const response = await api.get('/EmployeeRequest/leave')
      return response.data
    } catch (error) {
      console.error('Error fetching leave requests:', error)
      throw error
    }
  },

  // Lấy đơn nghỉ phép theo mã phiếu
  async getLeaveRequestById(voucherCode) {
    try {
      const response = await api.get(`/EmployeeRequest/leave/${voucherCode}`)
      return response.data
    } catch (error) {
      console.error('Error fetching leave request:', error)
      throw error
    }
  },

  // Tạo đơn nghỉ phép mới
  async createLeaveRequest(leaveRequestData) {
    try {
      const response = await api.post('/EmployeeRequest/leave', leaveRequestData)
      return response.data
    } catch (error) {
      console.error('Error creating leave request:', error)
      throw error
    }
  },

  // Cập nhật đơn nghỉ phép
  async updateLeaveRequest(voucherCode, leaveRequestData) {
    try {
      const response = await api.put(`/EmployeeRequest/leave/${voucherCode}`, leaveRequestData)
      return response.data
    } catch (error) {
      console.error('Error updating leave request:', error)
      throw error
    }
  },

  // Xóa đơn nghỉ phép
  async deleteLeaveRequest(voucherCode) {
    try {
      const response = await api.delete(`/EmployeeRequest/leave/${voucherCode}`)
      return response.data
    } catch (error) {
      console.error('Error deleting leave request:', error)
      throw error
    }
  }
}

export default leaveRequestService
