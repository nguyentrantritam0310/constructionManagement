import api from '../api'

export const exportOrderService = {
  async getAll() {
    const response = await api.get('/ExportOrder')
    return response.data
  },

  async getById(id) {
    const response = await api.get(`/ExportOrder/${id}`)
    return response.data
  },

  async update(id, data) {
    const response = await api.put(`/ExportOrder/${id}`, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response.data
  },

  async updateStatus(id, statusId) {
    const response = await api.patch(`/ExportOrder/${id}/status`, {
      status: statusId
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response.data
  },

  async create(data) {
    const response = await api.post('/ExportOrder', data, {
      headers: { 'Content-Type': 'application/json' }
    })
    return response.data
  },

  async delete(id) {
    const response = await api.delete(`/ExportOrder/${id}`)
    return response.data
  }
}
