import { ref, computed } from 'vue'
import { useAuth } from './useAuth.js'
import { useGlobalMessage } from './useGlobalMessage.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5244/api'

export function useClosing() {
  const { currentUser } = useAuth()
  const { showMessage } = useGlobalMessage()
  
  // State
  const closingStatus = ref({
    isTimeSheetClosed: false,
    isPayrollClosed: false,
    isOvertimeSheetClosed: false,
    timeSheetClosedAt: null,
    payrollClosedAt: null,
    overtimeSheetClosedAt: null,
    timeSheetClosedBy: null,
    payrollClosedBy: null,
    overtimeSheetClosedBy: null
  })
  
  const loading = ref(false)
  const error = ref(null)

  // Computed
  const isAnySheetClosed = computed(() => {
    return closingStatus.value.isTimeSheetClosed || 
           closingStatus.value.isPayrollClosed || 
           closingStatus.value.isOvertimeSheetClosed
  })

  const isAllSheetsClosed = computed(() => {
    return closingStatus.value.isTimeSheetClosed && 
           closingStatus.value.isPayrollClosed && 
           closingStatus.value.isOvertimeSheetClosed
  })

  const canCloseSheets = computed(() => {
    return currentUser.value && !isAllSheetsClosed.value
  })

  // Methods
  const fetchClosingStatus = async (year, month) => {
    if (!currentUser.value) return

    const token = localStorage.getItem('token')
    if (!token) {
      console.error('No authentication token found')
      showMessage('Vui lòng đăng nhập lại', 'error')
      return
    }

    try {
      loading.value = true
      error.value = null

      const response = await fetch(
        `${API_BASE_URL}/closing/status/${currentUser.value.id}/${year}/${month}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Authentication failed - token may be expired')
          showMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error')
          // Clear invalid token
          localStorage.removeItem('token')
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      closingStatus.value = data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching closing status:', err)
      if (err.message.includes('401')) {
        showMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error')
      }
    } finally {
      loading.value = false
    }
  }

  const closeTimeSheet = async (year, month) => {
    if (!currentUser.value) return false

    const token = localStorage.getItem('token')
    if (!token) {
      showMessage('Vui lòng đăng nhập lại', 'error')
      return false
    }

    try {
      loading.value = true
      error.value = null

      const response = await fetch(
        `${API_BASE_URL}/closing/timesheet/${currentUser.value.id}/${year}/${month}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          showMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error')
          localStorage.removeItem('token')
          return false
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        showMessage('Chốt bảng công thành công!', 'success')
        await fetchClosingStatus(year, month)
        return true
      } else {
        showMessage(result.message || 'Chốt bảng công thất bại', 'error')
        return false
      }
    } catch (err) {
      error.value = err.message
      showMessage(`Lỗi khi chốt bảng công: ${err.message}`, 'error')
      return false
    } finally {
      loading.value = false
    }
  }

  const closePayroll = async (year, month) => {
    if (!currentUser.value) return false

    try {
      loading.value = true
      error.value = null

      const response = await fetch(
        `${API_BASE_URL}/closing/payroll/${currentUser.value.id}/${year}/${month}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const result = await response.json()

      if (result.success) {
        showMessage('Chốt bảng lương thành công!', 'success')
        await fetchClosingStatus(year, month)
        return true
      } else {
        showMessage(result.message || 'Chốt bảng lương thất bại', 'error')
        return false
      }
    } catch (err) {
      error.value = err.message
      showMessage(`Lỗi khi chốt bảng lương: ${err.message}`, 'error')
      return false
    } finally {
      loading.value = false
    }
  }

  const testEndpoint = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/closing/test`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const result = await response.json()
      console.log('Test endpoint result:', result)
      return result
    } catch (err) {
      console.error('Test endpoint error:', err)
      return null
    }
  }

  const closeAllPayrolls = async (year, month) => {
    if (!currentUser.value) return false

    try {
      loading.value = true
      error.value = null

      // Test endpoint first
      console.log('Testing endpoint first...')
      const testResult = await testEndpoint()
      if (!testResult) {
        showMessage('Không thể kết nối đến server', 'error')
        return false
      }

      const response = await fetch(
        `${API_BASE_URL}/closing/payroll/all/${year}/${month}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const result = await response.json()

      if (result.success) {
        showMessage('Chốt lương hàng loạt thành công!', 'success')
        await fetchClosingStatus(year, month)
        return true
      } else {
        showMessage(result.message || 'Chốt lương hàng loạt thất bại', 'error')
        return false
      }
    } catch (err) {
      error.value = err.message
      showMessage(`Lỗi khi chốt lương hàng loạt: ${err.message}`, 'error')
      return false
    } finally {
      loading.value = false
    }
  }

  const closeOvertimeSheet = async (year, month) => {
    if (!currentUser.value) return false

    try {
      loading.value = true
      error.value = null

      const response = await fetch(
        `${API_BASE_URL}/closing/overtime/${currentUser.value.id}/${year}/${month}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const result = await response.json()

      if (result.success) {
        showMessage('Chốt bảng tăng ca thành công!', 'success')
        await fetchClosingStatus(year, month)
        return true
      } else {
        showMessage(result.message || 'Chốt bảng tăng ca thất bại', 'error')
        return false
      }
    } catch (err) {
      error.value = err.message
      showMessage(`Lỗi khi chốt bảng tăng ca: ${err.message}`, 'error')
      return false
    } finally {
      loading.value = false
    }
  }

  const closeAllSheets = async (year, month) => {
    if (!currentUser.value) return false

    try {
      loading.value = true
      error.value = null

      const response = await fetch(
        `${API_BASE_URL}/closing/all/${currentUser.value.id}/${year}/${month}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const result = await response.json()

      if (result.success) {
        showMessage('Chốt tất cả bảng thành công!', 'success')
        await fetchClosingStatus(year, month)
        return true
      } else {
        showMessage(result.message || 'Chốt bảng thất bại', 'error')
        if (result.details) {
          result.details.forEach(detail => {
            console.log(detail)
          })
        }
        return false
      }
    } catch (err) {
      error.value = err.message
      showMessage(`Lỗi khi chốt bảng: ${err.message}`, 'error')
      return false
    } finally {
      loading.value = false
    }
  }

  const getClosedTimeSheets = async (year, month) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/closing/closed/timesheets/${year}/${month}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (err) {
      console.error('Error fetching closed time sheets:', err)
      throw err
    }
  }

  const getClosedPayrolls = async (year, month) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/closing/closed/payrolls/${year}/${month}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (err) {
      console.error('Error fetching closed payrolls:', err)
      throw err
    }
  }

  const getClosedOvertimeSheets = async (year, month) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/closing/closed/overtimesheets/${year}/${month}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (err) {
      console.error('Error fetching closed overtime sheets:', err)
      throw err
    }
  }

  const formatClosingDate = (dateString) => {
    if (!dateString) return 'Chưa chốt'
    const date = new Date(dateString)
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getClosingStatusText = () => {
    if (isAllSheetsClosed.value) {
      return 'Đã chốt'
    } else if (isAnySheetClosed.value) {
      return 'Đã chốt'
    } else {
      return 'Chưa chốt'
    }
  }

  const getClosingStatusColor = () => {
    if (isAllSheetsClosed.value) {
      return 'success'
    } else if (isAnySheetClosed.value) {
      return 'warning'
    } else {
      return 'info'
    }
  }

  // Lịch sử chốt công
  const closingHistory = ref(null)
  const historyLoading = ref(false)
  const historyError = ref(null)

  const fetchClosingHistory = async (year, month) => {
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('No authentication token found')
      showMessage('Vui lòng đăng nhập lại', 'error')
      return
    }

    try {
      historyLoading.value = true
      historyError.value = null

      const response = await fetch(
        `${API_BASE_URL}/closing/history?year=${year}&month=${month}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Authentication failed - token may be expired')
          showMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error')
          localStorage.removeItem('token')
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      closingHistory.value = data
    } catch (err) {
      historyError.value = err.message
      console.error('Error fetching closing history:', err)
      if (err.message.includes('401')) {
        showMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error')
      }
    } finally {
      historyLoading.value = false
    }
  }

  return {
    // State
    closingStatus,
    loading,
    error,
    closingHistory,
    historyLoading,
    historyError,
    
    // Computed
    isAnySheetClosed,
    isAllSheetsClosed,
    canCloseSheets,
    
    // Methods
    fetchClosingStatus,
    closeTimeSheet,
    closePayroll,
    closeAllPayrolls,
    closeOvertimeSheet,
    closeAllSheets,
    getClosedTimeSheets,
    getClosedPayrolls,
    getClosedOvertimeSheets,
    formatClosingDate,
    getClosingStatusText,
    getClosingStatusColor,
    fetchClosingHistory,
    testEndpoint
  }
}
