import api from '../api'

export const workshiftService = {
  // Get all work shifts
  async getAll() {
    try {
      const response = await api.get('/WorkShift')
      return response.data
    } catch (error) {
      console.error('Error fetching work shifts:', error)
      throw error
    }
  },

  // Get work shift by ID
  async getById(id) {
    try {
      const response = await api.get(`/WorkShift/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching work shift by ID:', error)
      throw error
    }
  },

  // Create new work shift
  async create(data) {
    try {
      const response = await api.post('/WorkShift', data)
      return response.data
    } catch (error) {
      console.error('Error creating work shift:', error)
      throw error
    }
  },

  // Update work shift
  async update(id, data) {
    try {
      const response = await api.put(`/WorkShift/${id}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating work shift:', error)
      throw error
    }
  },

  // Delete work shift
  async delete(id) {
    try {
      const response = await api.delete(`/WorkShift/${id}`)
      return response.data
    } catch (error) {
      console.error('Error deleting work shift:', error)
      throw error
    }
  },

  // Get work shift details by shift name (keeping original method for backward compatibility)
  async getWorkShiftByName(shiftName) {
    try {
      const response = await api.get('/WorkShift')
      const shifts = response.data
      
      // Find shift by name (case insensitive)
      const shift = shifts.find(s => 
        s.shiftName.toLowerCase().includes(shiftName.toLowerCase()) ||
        shiftName.toLowerCase().includes(s.shiftName.toLowerCase())
      )
      
      return shift || null
    } catch (error) {
      console.error('Error fetching work shift by name:', error)
      throw error
    }
  }
}