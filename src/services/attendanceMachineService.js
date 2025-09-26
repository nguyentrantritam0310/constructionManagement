import api from '../api'

export const attendanceMachineService = {
  async getAll() {
    const response = await api.get('/AttendanceMachine')
    return response.data
  },
  async create(data) {
    const response = await api.post('/AttendanceMachine', data)
    return response.data
  },
  async update(id, data) {
    const response = await api.put(`/AttendanceMachine/${id}`, data)
    return response.data
  },
  async deleteById(id) {
    const response = await api.delete(`/AttendanceMachine/${id}`)
    return response.data
  }
}
