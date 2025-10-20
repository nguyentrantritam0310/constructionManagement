import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL + '/api'

export const attendanceService = {
  async getAllAttendance() {
    try {
      const response = await axios.get(`${API_URL}/AttendanceData`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  async getAttendanceByDate(date) {
    try {
      const response = await axios.get(`${API_URL}/AttendanceData/employee/date`, {
        params: { date }
      })
      return response.data
    } catch (error) {
      throw error
    }
  },

  async createAttendance(attendanceData) {
    try {
      const response = await axios.post(`${API_URL}/Attendance`, attendanceData)
      return response.data
    } catch (error) {
      throw error
    }
  },

  async updateAttendance(attendanceData) {
    try {
      const response = await axios.put(`${API_URL}/Attendance`, attendanceData)
      return response.data
    } catch (error) {
      throw error
    }
  },

  async deleteAttendanceByEmployeeAndTask(employeeId, taskId) {
    try {
      const response = await axios.delete(`${API_URL}/Attendance/employee/${employeeId}/task/${taskId}`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  async updateAttendanceStatusByEmployee(employeeId, date, status) {
    try {
      const response = await axios.put(`${API_URL}/Attendance/employee/status`, {
        employeeID: employeeId,
        attendanceDate: date,
        status: status
      })
      return response.data
    } catch (error) {
      throw error
    }
  }
}
