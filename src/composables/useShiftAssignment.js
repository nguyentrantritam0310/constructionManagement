import { ref } from 'vue'
import { shiftAssignmentService } from '../services/shiftAssignmentService'

export function useShiftAssignment() {
  const shiftAssignments = ref([])
  const shiftSchedule = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Fetch all shift assignments
  const fetchAllShiftAssignments = async () => {
    try {
      loading.value = true
      error.value = null
      const shiftAssignmentsData = await shiftAssignmentService.getAllShiftAssignments()
      shiftAssignments.value = shiftAssignmentsData
      console.log('Shift assignments loaded:', shiftAssignments.value)
    } catch (err) {
      error.value = err.response?.data?.message || 'Có lỗi xảy ra khi tải danh sách phân ca'
      console.error('Error fetching shift assignments:', err)
    } finally {
      loading.value = false
    }
  }

  // Get shift assignment by ID
  const getShiftAssignmentById = async (id) => {
    try {
      loading.value = true
      error.value = null
      return await shiftAssignmentService.getShiftAssignmentById(id)
    } catch (err) {
      error.value = err.response?.data?.message || 'Có lỗi xảy ra khi tải thông tin phân ca'
      console.error('Error fetching shift assignment:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Get shift assignments by employee ID
  const getShiftAssignmentsByEmployeeId = async (employeeId) => {
    try {
      loading.value = true
      error.value = null
      const data = await shiftAssignmentService.getShiftAssignmentsByEmployeeId(employeeId)
      return data
    } catch (err) {
      error.value = err.response?.data?.message || 'Có lỗi xảy ra khi tải phân ca của nhân viên'
      console.error('Error fetching shift assignments by employee:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  // Get shift assignments by date
  const getShiftAssignmentsByDate = async (date) => {
    try {
      loading.value = true
      error.value = null
      const data = await shiftAssignmentService.getShiftAssignmentsByDate(date)
      return data
    } catch (err) {
      error.value = err.response?.data?.message || 'Có lỗi xảy ra khi tải phân ca theo ngày'
      console.error('Error fetching shift assignments by date:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  // Get shift assignments by date range
  const getShiftAssignmentsByDateRange = async (startDate, endDate) => {
    try {
      loading.value = true
      error.value = null
      const data = await shiftAssignmentService.getShiftAssignmentsByDateRange(startDate, endDate)
      return data
    } catch (err) {
      error.value = err.response?.data?.message || 'Có lỗi xảy ra khi tải phân ca theo khoảng thời gian'
      console.error('Error fetching shift assignments by date range:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  // Get shift schedule by week
  const getShiftScheduleByWeek = async (weekStartDate) => {
    try {
      loading.value = true
      error.value = null
      const data = await shiftAssignmentService.getShiftScheduleByWeek(weekStartDate)
      shiftSchedule.value = data || []
      console.log('Shift schedule loaded:', shiftSchedule.value)
      return shiftSchedule.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Có lỗi xảy ra khi tải lịch phân ca theo tuần'
      console.error('Error fetching shift schedule:', err)
      shiftSchedule.value = [] // Ensure we have an empty array on error
      return []
    } finally {
      loading.value = false
    }
  }

  // Create new shift assignment
  const createShiftAssignment = async (shiftAssignmentData) => {
    try {
      loading.value = true
      error.value = null
      const result = await shiftAssignmentService.createShiftAssignment(shiftAssignmentData)
      // Refresh the shift assignments list
      await fetchAllShiftAssignments()
      return result
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.title || 'Có lỗi xảy ra khi tạo phân ca mới'
      error.value = errorMessage
      console.error('Error creating shift assignment:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // Update shift assignment
  const updateShiftAssignment = async (shiftAssignmentData) => {
    try {
      loading.value = true
      error.value = null
      const result = await shiftAssignmentService.updateShiftAssignment(shiftAssignmentData)
      // Refresh the shift assignments list
      await fetchAllShiftAssignments()
      return result
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.title || 'Có lỗi xảy ra khi cập nhật phân ca'
      error.value = errorMessage
      console.error('Error updating shift assignment:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // Delete shift assignment
  const deleteShiftAssignment = async (id) => {
    try {
      loading.value = true
      error.value = null
      await shiftAssignmentService.deleteShiftAssignment(id)
      // Refresh the shift assignments list
      await fetchAllShiftAssignments()
      return true
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.title || 'Có lỗi xảy ra khi xóa phân ca'
      error.value = errorMessage
      console.error('Error deleting shift assignment:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // Format shift assignment data for form submission
  const formatShiftAssignmentForSubmit = (shiftAssignmentData) => {
    console.log('Formatting shift assignment data for submit:', shiftAssignmentData)
    const formattedData = {
      employeeID: shiftAssignmentData.employeeID,
      workShiftID: parseInt(shiftAssignmentData.workShiftID),
      workDate: new Date(shiftAssignmentData.workDate).toISOString()
    }
    
    // Include ID for update operations
    if (shiftAssignmentData.id) {
      formattedData.id = shiftAssignmentData.id
    }
    
    console.log('Formatted data:', formattedData)
    return formattedData
  }

  // Format shift assignment data for display
  const formatShiftAssignmentData = (shiftAssignment) => {
    return {
      ...shiftAssignment,
      workDate: new Date(shiftAssignment.workDate).toLocaleDateString('vi-VN'),
      id: shiftAssignment.id
    }
  }

  // Convert shift schedule to display format for ShiftAssignmentView
  const formatShiftScheduleForDisplay = (scheduleData) => {
    if (!scheduleData || !Array.isArray(scheduleData)) {
      return []
    }
    
    return scheduleData.map(employee => {
      const formattedEmployee = {
        empId: employee.employeeCode || employee.employeeID,
        empName: employee.employeeName,
        title: employee.roleName,
        day1: [],
        day2: [],
        day3: [],
        day4: [],
        day5: [],
        day6: [],
        day7: []
      }

      // Convert week shifts to day format
      employee.weekShifts.forEach((dayShift, index) => {
        const dayKey = `day${index + 1}`
        if (dayShift.shifts && dayShift.shifts.length > 0) {
          formattedEmployee[dayKey] = dayShift.shifts.map(shift => ({
            in: shift.startTime,
            out: shift.endTime,
            shiftId: shift.workShiftID,
            assignmentId: shift.shiftAssignmentID
          }))
        }
      })

      return formattedEmployee
    })
  }

  return {
    shiftAssignments,
    shiftSchedule,
    loading,
    error,
    fetchAllShiftAssignments,
    getShiftAssignmentById,
    getShiftAssignmentsByEmployeeId,
    getShiftAssignmentsByDate,
    getShiftAssignmentsByDateRange,
    getShiftScheduleByWeek,
    createShiftAssignment,
    updateShiftAssignment,
    deleteShiftAssignment,
    formatShiftAssignmentData,
    formatShiftAssignmentForSubmit,
    formatShiftScheduleForDisplay
  }
}

