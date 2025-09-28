import axios from 'axios'
import api from '../api'

const API_URL = import.meta.env.VITE_API_URL + '/api/ApplicationUser'

export const employeeService = {
  async getAllEmployees() {
    try {
      const response = await axios.get(`${API_URL}/employee`)
      return response.data
    } catch (error) {
      console.error('Error fetching employees:', error)
      throw error
    }
  },
    async getAll() {
    const response = await api.get('/ApplicationUser')
    return response.data
  },
}
