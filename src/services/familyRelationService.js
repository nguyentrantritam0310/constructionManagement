import api from '../api'

export const familyRelationService = {
  // Get all family relations
  async getAllFamilyRelations() {
    try {
      const response = await api.get('/FamilyRelation')
      return response.data
    } catch (error) {
      console.error('Error fetching family relations:', error)
      throw error
    }
  },

  // Get family relations by employee ID
  async getFamilyRelationsByEmployeeId(employeeId) {
    try {
      const response = await api.get(`/FamilyRelation/employee/${employeeId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching family relations by employee ID:', error)
      throw error
    }
  },

  // Get family relation by ID
  async getFamilyRelationById(id) {
    try {
      const response = await api.get(`/FamilyRelation/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching family relation:', error)
      throw error
    }
  },

  // Create new family relation
  async createFamilyRelation(familyRelationData) {
    try {
      const response = await api.post('/FamilyRelation', familyRelationData)
      return response.data
    } catch (error) {
      console.error('Error creating family relation:', error)
      throw error
    }
  },

  // Update family relation
  async updateFamilyRelation(familyRelationData) {
    try {
      const response = await api.put('/FamilyRelation', familyRelationData)
      return response.data
    } catch (error) {
      console.error('Error updating family relation:', error)
      throw error
    }
  },

  // Delete family relation
  async deleteFamilyRelation(id) {
    try {
      await api.delete(`/FamilyRelation/${id}`)
      return true
    } catch (error) {
      console.error('Error deleting family relation:', error)
      throw error
    }
  }
}
