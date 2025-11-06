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
  },

  // Gửi đơn nghỉ phép để duyệt
  async submitLeaveRequestForApproval(voucherCode, notes) {
    try {
      const response = await api.put(`/EmployeeRequest/leave/${voucherCode}/submit`, {
        notes: notes || null
      })
      return response.data
    } catch (error) {
      console.error('Error submitting leave request for approval:', error)
      throw error
    }
  },

  // Duyệt đơn nghỉ phép
  async approveLeaveRequest(voucherCode, notes) {
    try {
      const response = await api.put(`/EmployeeRequest/leave/${voucherCode}/approve`, {
        notes: notes || null
      })
      return response.data
    } catch (error) {
      console.error('Error approving leave request:', error)
      throw error
    }
  },

  // Từ chối đơn nghỉ phép
  async rejectLeaveRequest(voucherCode, notes) {
    try {
      const response = await api.put(`/EmployeeRequest/leave/${voucherCode}/reject`, {
        notes: notes || null
      })
      return response.data
    } catch (error) {
      console.error('Error rejecting leave request:', error)
      throw error
    }
  },

  // Trả lại đơn nghỉ phép
  async returnLeaveRequest(voucherCode, notes) {
    try {
      const response = await api.put(`/EmployeeRequest/leave/${voucherCode}/return`, {
        notes: notes || null
      })
      return response.data
    } catch (error) {
      console.error('Error returning leave request:', error)
      throw error
    }
  }
}

export default leaveRequestService
