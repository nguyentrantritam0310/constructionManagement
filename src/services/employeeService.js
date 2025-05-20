import axios from 'axios'

const API_URL = 'http://localhost:5244/api/ApplicationUser'

export const employeeService = {
  async getAllEmployees() {
    try {
      const response = await axios.get(`${API_URL}/employee`)
      return response.data
    } catch (error) {
      console.error('Error fetching employees:', error)
      throw error
    }
  }
}
