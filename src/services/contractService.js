import api from '../api'

export const contractService = {
  // Get all contracts
  async getAllContracts() {
    try {
      const response = await api.get('/Contract')
      return response.data
    } catch (error) {
      console.error('Error fetching contracts:', error)
      throw error
    }
  },

  // Get contract by ID
  async getContractById(id) {
    try {
      const response = await api.get(`/Contract/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching contract:', error)
      throw error
    }
  },

  // Create new contract
  async createContract(contractData) {
    try {
      console.log('Sending contract data:', contractData) // Debug log
      const response = await api.post('/Contract', contractData)
      return response.data
    } catch (error) {
      console.error('Error creating contract:', error)
      console.error('Request data:', contractData) // Debug log
      throw error
    }
  },

  // Update contract
  async updateContract(contractData) {
    try {
      console.log('Updating contract data:', contractData) // Debug log
      const response = await api.put('/Contract', contractData)
      return response.data
    } catch (error) {
      console.error('Error updating contract:', error)
      console.error('Update request data:', contractData) // Debug log
      throw error
    }
  },

  // Delete contract
  async deleteContract(id) {
    try {
      await api.delete(`/Contract/${id}`)
      return true
    } catch (error) {
      console.error('Error deleting contract:', error)
      throw error
    }
  },

  // Get contract types
  async getContractTypes() {
    try {
      const response = await api.get('/Contract/contract-types')
      return response.data
    } catch (error) {
      console.error('Error fetching contract types:', error)
      throw error
    }
  },


  // Get allowances
  async getAllowances() {
    try {
      const response = await api.get('/Contract/allowances')
      return response.data
    } catch (error) {
      console.error('Error fetching allowances:', error)
      throw error
    }
  },

  // Get employees without contract
  async getEmployeesWithoutContract() {
    try {
      const response = await api.get('/Contract/employees-without-contract')
      return response.data
    } catch (error) {
      console.error('Error fetching employees without contract:', error)
      throw error
    }
  }
}