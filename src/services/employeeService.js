import api from '../api'

export const employeeService = {
  // Get all employees
  async getAllEmployees() {
    try {
      const response = await api.get('/ApplicationUser/employees')
      console.log('Employees API response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching employees:', error)
      throw error
    }
  },

  // Get all roles
  async getAllRoles() {
    try {
      const response = await api.get('/ApplicationUser/roles')
      console.log('Roles API response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching roles:', error)
      throw error
    }
  },

  // Get employee by ID
  async getEmployeeById(id) {
    try {
      const response = await api.get(`/ApplicationUser/employee/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching employee:', error)
      throw error
    }
  },

  // Create new employee
  async createEmployee(employeeData) {
    try {
      const response = await api.post('/ApplicationUser/employee', employeeData)
      return response.data
    } catch (error) {
      console.error('Error creating employee:', error)
      throw error
    }
  },

  // Update employee
  async updateEmployee(employeeData) {
    try {
      const response = await api.put('/ApplicationUser/employee', employeeData)
      return response.data
    } catch (error) {
      console.error('Error updating employee:', error)
      throw error
    }
  },

  // Delete employee
  async deleteEmployee(id) {
    try {
      await api.delete(`/ApplicationUser/employee/${id}`)
      return true
    } catch (error) {
      console.error('Error deleting employee:', error)
      throw error
    }
  },

  // Get all users (legacy method)
  async getAll() {
    console.log('Calling API: /ApplicationUser')
    const response = await api.get('/ApplicationUser')
    console.log('API Response:', response.data)
    return response.data
  },
}
