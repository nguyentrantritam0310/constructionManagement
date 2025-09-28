import api from '../api'

export const employeeRequestService = {
  async getAll() {
    const response = await api.get('/EmployeeRequest')
    return response.data
  },
  async create(data) {
    const response = await api.post('/EmployeeRequest', data)
    return response.data
  },
  async update(id, data) {
    const response = await api.put(`/EmployeeRequest/${id}`, data)
    return response.data
  },
  async deleteById(id) {
    const response = await api.delete(`/EmployeeRequest/${id}`)
    return response.data
  }
}
