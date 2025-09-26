import api from '../api'

export const workshiftService = {
  // Lấy danh sách công trình
  async getAll() {
    const response = await api.get('/WorkShift')
    return response.data
  }
}
