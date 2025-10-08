import api from '../api'

export const shiftAssignmentService = {
  // Get all shift assignments
  async getAllShiftAssignments() {
    try {
      const response = await api.get('/ShiftAssignment')
      return response.data
    } catch (error) {
      console.error('Error fetching shift assignments:', error)
      throw error
    }
  },

  // Get shift assignment by ID
  async getShiftAssignmentById(id) {
    try {
      const response = await api.get(`/ShiftAssignment/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching shift assignment:', error)
      throw error
    }
  },

  // Get shift assignments by employee ID
  async getShiftAssignmentsByEmployeeId(employeeId) {
    try {
      const response = await api.get(`/ShiftAssignment/employee/${employeeId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching shift assignments by employee:', error)
      throw error
    }
  },

  // Get shift assignments by date
  async getShiftAssignmentsByDate(date) {
    try {
      const response = await api.get(`/ShiftAssignment/date/${date}`)
      return response.data
    } catch (error) {
      console.error('Error fetching shift assignments by date:', error)
      throw error
    }
  },

  // Get shift assignments by date range
  async getShiftAssignmentsByDateRange(startDate, endDate) {
    try {
      const response = await api.get(`/ShiftAssignment/daterange?startDate=${startDate}&endDate=${endDate}`)
      return response.data
    } catch (error) {
      console.error('Error fetching shift assignments by date range:', error)
      throw error
    }
  },

  // Get shift schedule by week
  async getShiftScheduleByWeek(weekStartDate) {
    try {
      const response = await api.get(`/ShiftAssignment/schedule/week?weekStartDate=${weekStartDate}`)
      return response.data
    } catch (error) {
      console.error('Error fetching shift schedule by week:', error)
      throw error
    }
  },

  // Create new shift assignment
  async createShiftAssignment(shiftAssignmentData) {
    try {
      const response = await api.post('/ShiftAssignment', shiftAssignmentData)
      return response.data
    } catch (error) {
      console.error('Error creating shift assignment:', error)
      throw error
    }
  },

  // Update shift assignment
  async updateShiftAssignment(shiftAssignmentData) {
    try {
      const response = await api.put('/ShiftAssignment', shiftAssignmentData)
      return response.data
    } catch (error) {
      console.error('Error updating shift assignment:', error)
      throw error
    }
  },

  // Delete shift assignment
  async deleteShiftAssignment(id) {
    try {
      await api.delete(`/ShiftAssignment/${id}`)
      return true
    } catch (error) {
      console.error('Error deleting shift assignment:', error)
      throw error
    }
  }
}

