import axios from 'axios'

const API_URL = 'http://localhost:5244/api'

export const materialNormService = {
  // Lấy định lượng vật tư theo ID công trình
  getMaterialNormsByConstructionId: async (constructionId) => {
    try {
      const response = await axios.get(`${API_URL}/MaterialNorm/${constructionId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching material norms:', error)
      throw error
    }
  },

  // Lấy định lượng vật tư theo ID hạng mục
  getMaterialNormsByConstructionItemId: async (constructionItemId) => {
    try {
      const response = await axios.get(`${API_URL}/MaterialNorm/item/${constructionItemId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching material norms by item:', error)
      throw error
    }
  }
}
