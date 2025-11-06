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
      const response = await api.post('/Contract', contractData)
      return response.data
    } catch (error) {
      console.error('Error creating contract:', error)
      throw error
    }
  },

  // Update contract
  async updateContract(contractData) {
    try {
      console.log('=== UPDATE CONTRACT API CALL DEBUG ===')
      console.log('Data being sent to API:', contractData)
      console.log('Data keys:', Object.keys(contractData))
      console.log('StartDate type:', typeof contractData.startDate, 'value:', contractData.startDate)
      console.log('EndDate type:', typeof contractData.endDate, 'value:', contractData.endDate)
      console.log('ID type:', typeof contractData.id, 'value:', contractData.id)
      console.log('=== END UPDATE CONTRACT API CALL DEBUG ===')
      
      const response = await api.put('/Contract', contractData)
      return response.data
    } catch (error) {
      console.error('Error updating contract:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
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
  },

  // Gửi hợp đồng để duyệt
  async submitContractForApproval(contractId, notes) {
    try {
      const response = await api.put(`/Contract/${contractId}/submit`, {
        notes: notes || null
      })
      return response.data
    } catch (error) {
      console.error('Error submitting contract for approval:', error)
      throw error
    }
  },

  // Duyệt hợp đồng
  async approveContract(contractId, notes) {
    try {
      const response = await api.put(`/Contract/${contractId}/approve`, {
        notes: notes || null
      })
      return response.data
    } catch (error) {
      console.error('Error approving contract:', error)
      throw error
    }
  },

  // Từ chối hợp đồng
  async rejectContract(contractId, notes) {
    try {
      const response = await api.put(`/Contract/${contractId}/reject`, {
        notes: notes || null
      })
      return response.data
    } catch (error) {
      console.error('Error rejecting contract:', error)
      throw error
    }
  },

  // Trả lại hợp đồng
  async returnContract(contractId, notes) {
    try {
      const response = await api.put(`/Contract/${contractId}/return`, {
        notes: notes || null
      })
      return response.data
    } catch (error) {
      console.error('Error returning contract:', error)
      throw error
    }
  }
}