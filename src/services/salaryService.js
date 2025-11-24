import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const salaryService = {
  // Lấy tổng hợp lương của tất cả nhân viên theo tháng/năm
  async getSalarySummary(year, month) {
    try {
      const response = await axios.get(`${API_BASE_URL}/salary/summary`, {
        params: { year, month }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching salary summary:', error)
      throw error
    }
  },

  // Lấy chi tiết lương của một nhân viên
  async getEmployeeSalary(employeeId, year, month) {
    try {
      const response = await axios.get(`${API_BASE_URL}/salary/employee/${employeeId}`, {
        params: { year, month }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching employee salary:', error)
      throw error
    }
  },

  // Lấy bảng lương theo tháng
  async getSalaryTable(year, month) {
    try {
      const response = await axios.get(`${API_BASE_URL}/salary/table`, {
        params: { year, month }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching salary table:', error)
      throw error
    }
  },

  // Lấy bảng bảo hiểm theo tháng
  async getInsuranceTable(year, month) {
    try {
      const response = await axios.get(`${API_BASE_URL}/salary/insurance`, {
        params: { year, month }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching insurance table:', error)
      throw error
    }
  },

  // Lấy bảng thuế TNCN theo tháng
  async getTaxTable(year, month) {
    try {
      const response = await axios.get(`${API_BASE_URL}/salary/tax`, {
        params: { year, month }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching tax table:', error)
      throw error
    }
  },

  // Lấy bảng quyết toán thuế TNCN theo năm
  async getTaxFinalizationTable(year) {
    try {
      const response = await axios.get(`${API_BASE_URL}/salary/tax-finalization`, {
        params: { year }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching tax finalization table:', error)
      throw error
    }
  },

  // Tính toán lại lương cho một nhân viên
  async recalculateSalary(employeeId, year, month) {
    try {
      const response = await axios.post(`${API_BASE_URL}/salary/recalculate`, {
        employeeId,
        year,
        month
      })
      return response.data
    } catch (error) {
      console.error('Error recalculating salary:', error)
      throw error
    }
  },

  // Tính toán lại lương cho tất cả nhân viên
  async recalculateAllSalaries(year, month) {
    try {
      const response = await axios.post(`${API_BASE_URL}/salary/recalculate-all`, {
        year,
        month
      })
      return response.data
    } catch (error) {
      console.error('Error recalculating all salaries:', error)
      throw error
    }
  },

  // Xuất bảng lương ra Excel
  async exportSalaryToExcel(year, month, type = 'salary') {
    try {
      const response = await axios.get(`${API_BASE_URL}/salary/export`, {
        params: { year, month, type },
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      // Only log non-network errors (network errors will be handled by client-side fallback)
      const isNetworkError = error?.code === 'ERR_NETWORK' || 
                            error?.message?.includes('Network Error') ||
                            error?.message?.includes('ERR_CONNECTION_REFUSED')
      
      if (!isNetworkError) {
        console.error('Error exporting salary to Excel:', error)
      }
      throw error
    }
  },

  // Lấy cấu hình lương (hệ số, phụ cấp, etc.)
  async getSalaryConfig() {
    try {
      const response = await axios.get(`${API_BASE_URL}/salary/config`)
      return response.data
    } catch (error) {
      console.error('Error fetching salary config:', error)
      throw error
    }
  },

  // Cập nhật cấu hình lương
  async updateSalaryConfig(config) {
    try {
      const response = await axios.put(`${API_BASE_URL}/salary/config`, config)
      return response.data
    } catch (error) {
      console.error('Error updating salary config:', error)
      throw error
    }
  }
}

export { salaryService }
