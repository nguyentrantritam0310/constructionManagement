import api from '../api'

export const materialPlanService = {
  async create(data) {
    const response = await api.post('/MaterialPlan', data, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response.data
  },
  // Thêm hàm lấy MaterialPlan theo importOrderID
  async getByImportOrderID(importOrderID) {
    const response = await api.get(`/MaterialPlan/${importOrderID}`)
    return response.data
  },
  async updateQuantityAndNote(data) {
    // data: { importOrderID, materialID, constructionItemID, importQuantity, note }
    const response = await api.post('/MaterialPlan/update-quantity-note', data, {
      headers: { 'Content-Type': 'application/json' }
    })
    return response.data
  }
}