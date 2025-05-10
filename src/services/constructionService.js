import api from '../api'

export const constructionService = {
  // Lấy danh sách công trình
  async getAll() {
    const response = await api.get('/Constructions')
    return response.data
  },

  // Lấy chi tiết công trình
  async getById(id) {
    const response = await api.get(`/Constructions/${id}`)
    return response.data
  },

  // Cập nhật công trình
  async update(id, data) {
    const response = await api.put(`/Constructions/${id}`, data)
    return response.data
  },

  // Cập nhật trạng thái công trình
  async updateStatus(id, newStatus) {
    const response = await api.patch(`/Constructions/${id}/status`, { status: newStatus })
    return response.data
  },

  // Tạo công trình mới
  async create(data) {
    const response = await api.post('/Constructions', data)
    return response.data
  },

  // Xóa công trình
  async delete(id) {
    const response = await api.delete(`/Constructions/${id}`)
    return response.data
  },

  // Lấy danh sách hạng mục công trình
  async getItems(constructionId) {
    const response = await api.get(`/Constructions/${constructionId}/items`)
    return response.data
  }
}
