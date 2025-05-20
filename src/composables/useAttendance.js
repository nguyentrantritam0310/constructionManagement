import { ref, computed } from 'vue'
import { attendanceService } from '../services/attendanceService'
import { useGlobalMessage } from './useGlobalMessage'
import axios from 'axios'

const API_URL = 'http://localhost:5244/api'

export function useAttendance() {
  const { showMessage } = useGlobalMessage()
  const attendanceList = ref([])
  const loading = ref(false)
  const error = ref(null)
  const selectedDate = ref(new Date().toISOString().split('T')[0])
  const isAttendanceTabActive = ref(false)

  // Group attendance by date
  const attendanceByDate = computed(() => {
    const grouped = {}
    attendanceList.value.forEach(record => {
      // Format date to match selectedDate format (YYYY-MM-DD)
      const recordDate = new Date(record.attendanceDate)
      recordDate.setHours(recordDate.getHours() + 7) // Adjust for Vietnam timezone
      const date = recordDate.toISOString().split('T')[0]
      console.log('Grouping record:', {
        originalDate: record.attendanceDate,
        adjustedDate: date,
        record
      })

      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(record)
    })
    return grouped
  })

  // Get attendance for selected date
  const currentDateAttendance = computed(() => {
    console.log('Computing attendance for selected date:', selectedDate.value)
    const attendance = attendanceByDate.value[selectedDate.value] || []
    console.log('Found attendance records for date:', selectedDate.value, attendance.map(record => ({
      employeeId: record.employeeID,
      originalDate: record.attendanceDate,
      adjustedDate: new Date(record.attendanceDate).toISOString().split('T')[0],
      status: record.status
    })))
    return attendance
  })

  // Format date to match API requirement (YYYY-MM-DDTHH:mm:ss.sssZ)
  const formatDateToVietnamTimezone = (date) => {
    console.log('Input date:', date)
    const d = new Date(date)
    console.log('After new Date:', d.toISOString())

    // Set to start of day in Vietnam timezone (UTC+7)
    d.setHours(0, 0, 0, 0)
    console.log('After setHours(0,0,0,0):', d.toISOString())

    // Add 7 hours to match Vietnam timezone
    d.setHours(d.getHours() + 7)
    console.log('After adding 7 hours:', d.toISOString())

    // Add milliseconds to match API format
    d.setMilliseconds(386)
    console.log('Final formatted date:', d.toISOString())

    return d.toISOString()
  }

  // Fetch all attendance records
  const fetchAttendance = async (force = false) => {
    if (isAttendanceTabActive.value && !force) {
      return
    }

    try {
      loading.value = true
      error.value = null
      const data = await attendanceService.getAllAttendance()
      attendanceList.value = data
    } catch (err) {
      error.value = 'Không thể tải dữ liệu chấm công'
      showMessage(error.value, 'error')
      console.error('Error fetching attendance:', err)
    } finally {
      loading.value = false
    }
  }

  // Set tab state
  const setAttendanceTabActive = (active) => {
    isAttendanceTabActive.value = active
    if (active) {
      fetchAttendance(true)
    }
  }

  // Create attendance records for a worker
  const createAttendance = async (workerId, taskId, startDate, endDate) => {
    let createdRecords = []
    try {
      loading.value = true
      error.value = null

      // Parse dates and set to start of day in Vietnam timezone
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      start.setHours(start.getHours() + 7)

      const end = new Date(endDate)
      end.setHours(0, 0, 0, 0)
      end.setHours(end.getHours() + 7)

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date format')
      }

      if (start > end) {
        throw new Error('Start date must be before end date')
      }

      const currentDate = new Date(start)
      while (currentDate <= end) {
        const formattedDate = formatDateToVietnamTimezone(currentDate)

        try {
          const record = {
            employeeID: workerId,
            constructionTaskID: taskId,
            attendanceDate: formattedDate,
            status: "Có mặt"
          }

          const response = await attendanceService.createAttendance(record)
          createdRecords.push(response)
        } catch (recordError) {
          const errorDetail = recordError.response?.data?.message || recordError.message

          if (errorDetail.includes('duplicate') || errorDetail.includes('already exists')) {
            console.warn('Skipping duplicate record for date:', formattedDate)
            currentDate.setDate(currentDate.getDate() + 1)
            continue
          }

          for (const record of createdRecords) {
            try {
              await axios.delete(`${API_URL}/Attendance`, {
                data: {
                  employeeID: record.employeeID,
                  constructionTaskID: record.constructionTaskID,
                  attendanceDate: record.attendanceDate
                }
              })
            } catch (deleteError) {
              console.error('Error during rollback:', deleteError)
            }
          }

          throw new Error(`Lỗi khi tạo chấm công: ${errorDetail}`)
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }

      if (createdRecords.length === 0) {
        throw new Error('Không thể tạo bất kỳ chấm công nào')
      }

      attendanceList.value.push(...createdRecords)
      showMessage('Tạo chấm công thành công', 'success')
      return createdRecords

    } catch (err) {
      error.value = err.message
      showMessage(error.value, 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  // Create attendance for multiple workers
  const createAttendanceForWorkers = async (workers, taskId, startDate, endDate) => {
    try {
      loading.value = true
      error.value = null

      const results = await Promise.all(
        workers.map(worker =>
          createAttendance(worker.id, taskId, startDate, endDate)
            .catch(err => {
              console.error(`Error for worker ${worker.employeeName}:`, err)
              throw err
            })
        )
      )

      showMessage('Tạo chấm công cho tất cả công nhân thành công', 'success')
      return results
    } catch (err) {
      error.value = 'Không thể tạo chấm công cho một số công nhân'
      showMessage(error.value, 'error')
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update attendance status directly
  const updateEmployeeAttendanceStatus = async (employeeId, status) => {
    try {
      loading.value = true
      console.log('Updating status for date:', selectedDate.value)
      const formattedDate = formatDateToVietnamTimezone(selectedDate.value)
      console.log('Formatted date for API:', formattedDate)

      await attendanceService.updateAttendanceStatusByEmployee(employeeId, formattedDate, status)

      // Update local state
      attendanceList.value = attendanceList.value.map(record => {
        const recordDate = new Date(record.attendanceDate)
        recordDate.setHours(recordDate.getHours() + 7)
        const recordDateStr = recordDate.toISOString().split('T')[0]

        console.log('Comparing dates in update:', {
          recordDateStr,
          selectedDate: selectedDate.value,
          originalRecordDate: record.attendanceDate,
          adjustedRecordDate: recordDateStr,
          matches: recordDateStr === selectedDate.value
        })

        if (record.employeeID === employeeId && recordDateStr === selectedDate.value) {
          return { ...record, status }
        }
        return record
      })

      // Force refresh attendance data
      await fetchAttendance(true)
      showMessage('Cập nhật chấm công thành công', 'success')
    } catch (error) {
      console.error('Error updating attendance status:', error)
      showMessage('Không thể cập nhật chấm công: ' + (error.response?.data?.message || error.message), 'error')
    } finally {
      loading.value = false
    }
  }

  // Get unique dates from attendance records
  const availableDates = computed(() => {
    return Object.keys(attendanceByDate.value).sort((a, b) => new Date(b) - new Date(a))
  })

  // Get assigned workers for a task
  const getAssignedWorkersForTask = (taskId) => {
    const taskAttendance = attendanceList.value.filter(
      record => record.constructionTaskID === taskId
    )

    const uniqueWorkers = new Map()
    taskAttendance.forEach(record => {
      if (!uniqueWorkers.has(record.employeeID)) {
        uniqueWorkers.set(record.employeeID, {
          id: record.employeeID,
          name: record.employeeName,
          email: record.email,
          assignedDate: new Date(record.attendanceDate).toISOString().split('T')[0]
        })
      }
    })

    return Array.from(uniqueWorkers.values())
  }

  // Delete attendance for a worker from a task
  const deleteAttendanceByEmployeeAndTask = async (employeeId, taskId) => {
    try {
      loading.value = true
      error.value = null

      await attendanceService.deleteAttendanceByEmployeeAndTask(employeeId, taskId)

      attendanceList.value = attendanceList.value.filter(
        record => !(record.employeeID === employeeId && record.constructionTaskID === taskId)
      )

      showMessage('Xóa phân công công nhân thành công', 'success')
    } catch (err) {
      error.value = 'Không thể xóa phân công công nhân'
      showMessage(error.value, 'error')
      console.error('Error deleting attendance:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    attendanceList,
    attendanceByDate,
    currentDateAttendance,
    loading,
    error,
    selectedDate,
    availableDates,
    isAttendanceTabActive,
    fetchAttendance,
    setAttendanceTabActive,
    createAttendance,
    createAttendanceForWorkers,
    updateEmployeeAttendanceStatus,
    getAssignedWorkersForTask,
    deleteAttendanceByEmployeeAndTask
  }
}
