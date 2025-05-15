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

  // Cập nhật công trình (hỗ trợ upload file)
  async update(id, data) {
    let formData = new FormData();
    for (const key in data) {
      if (key === 'constructionItems') {
        formData.append(key, JSON.stringify(data[key]))
      } else if (key === 'designBlueprint' && data[key]) {
        formData.append('designBlueprint', data[key])
      } else {
        formData.append(key, data[key])
      }
    }
    const response = await api.put(`/Constructions/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  // Cập nhật trạng thái công trình
  async updateStatus(id, newStatus) {
    const response = await api.patch(`/Constructions/${id}/status`, { status: newStatus })
    return response.data
  },

  // Tạo công trình mới (hỗ trợ upload file)
  async create(data) {
    let formData = new FormData();
    for (const key in data) {
      if (key === 'constructionItems') {
        formData.append(key, JSON.stringify(data[key]))
      } else if (key === 'designBlueprint' && data[key]) {
        formData.append('designBlueprint', data[key])
      } else {
        formData.append(key, data[key])
      }
    }
    const response = await api.post('/Constructions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
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
