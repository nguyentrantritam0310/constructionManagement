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
  }
}
