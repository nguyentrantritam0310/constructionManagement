import api from '../api'

export const payrollAdjustmentService = {
  async getAll() {
    const response = await api.get('/PayrollAdjustment')
    return response.data
  },
  async create(data) {
    const response = await api.post('/PayrollAdjustment', data)
    return response.data
  },
  async update(id, data) {
    const response = await api.put(`/PayrollAdjustment/${id}`, data)
    return response.data
  },
  async deleteById(id) {
    const response = await api.delete(`/PayrollAdjustment/${id}`)
    return response.data
  },

  // Gửi khoản cộng/trừ để duyệt
  async submitForApproval(voucherNo, notes) {
    const response = await api.put(`/PayrollAdjustment/${voucherNo}/submit`, {
      notes: notes || null
    })
    return response.data
  },

  // Duyệt khoản cộng/trừ
  async approve(voucherNo, notes) {
    const response = await api.put(`/PayrollAdjustment/${voucherNo}/approve`, {
      notes: notes || null
    })
    return response.data
  },

  // Từ chối khoản cộng/trừ
  async reject(voucherNo, notes) {
    const response = await api.put(`/PayrollAdjustment/${voucherNo}/reject`, {
      notes: notes || null
    })
    return response.data
  },

  // Trả lại khoản cộng/trừ
  async return(voucherNo, notes) {
    const response = await api.put(`/PayrollAdjustment/${voucherNo}/return`, {
      notes: notes || null
    })
    return response.data
  }
}
