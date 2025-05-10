import api from '../api'

export const planService = {
  // Lấy danh sách kế hoạch
  async getAll() {
    const response = await api.get('/ConstructionPlan')
    return response.data
  },

  // Lấy chi tiết kế hoạch
  async getById(id) {
    const response = await api.get(`/ConstructionPlan/${id}`)
    return response.data
  },

  // Cập nhật kế hoạch
  async update(id, data) {
    const response = await api.put(`/ConstructionPlan/${id}`, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response.data
  },

  // Cập nhật trạng thái kế hoạch
  async updateStatus(id, statusId) {
    const response = await api.patch(`/ConstructionPlan/${id}/status`, {
      status: statusId
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response.data
  },

  // Cập nhật khối lượng thực tế
  async updateVolume(id, volume) {
    const response = await api.put(`/ConstructionPlan/${id}/volume`, { volume }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response.data
  },

  // Tạo kế hoạch mới
  async create(data) {
    const response = await api.post('/ConstructionPlan', data, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response.data
  },

  // Xóa kế hoạch
  async delete(id) {
    const response = await api.delete(`/ConstructionPlan/${id}`)
    return response.data
  }
}
