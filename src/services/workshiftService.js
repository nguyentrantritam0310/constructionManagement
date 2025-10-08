import api from '../api'

export const workshiftService = {
  // Lấy danh sách công trình
  async getAll() {
    const response = await api.get('/WorkShift')
    return response.data
  },
    async create(data) {
    const response = await api.post('/WorkShift', data)
    return response.data
  },
  async update(id, data) {
    const response = await api.put(`/WorkShift/${id}`, data)
    return response.data
  },
  async delete(id) {
    const response = await api.delete(`/WorkShift/${id}`)
    return response.data
  },
}
