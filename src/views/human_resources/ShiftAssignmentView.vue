<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import TimeFilter from '../../components/common/TimeFilter.vue'
import { useWorkShift } from '../../composables/useWorkShift'
import { useShiftAssignment } from '../../composables/useShiftAssignment'
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import { useEmployee } from '../../composables/useEmployee'
import { useAttendance } from '../../composables/useAttendance'
import { useLeaveRequest } from '../../composables/useLeaveRequest'
import { attendanceService } from '../../services/attendanceService'
import UpdateButton from '@/components/common/UpdateButton.vue'
import ChangeStatusButton from '@/components/common/ChangeStatusButton.vue'
import ActionButton from '@/components/common/ActionButton.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import TourGuide from '@/components/common/TourGuide.vue'

const {
  workshifts,
  fetchWorkShifts,
} = useWorkShift()

const { showMessage } = useGlobalMessage()

const {
  employees,
  fetchAllEmployees
} = useEmployee()

const {
  shiftAssignments,
  loading: shiftLoading,
  error: shiftError,
  fetchAllShiftAssignments,
  createShiftAssignment,
  updateShiftAssignment,
  deleteShiftAssignment
} = useShiftAssignment()

const { attendanceList, fetchAttendance } = useAttendance()
const { leaveRequests, fetchLeaveRequests } = useLeaveRequest()

const activeTab = ref('shift')
const tabs = [
  { key: 'shift', label: 'Ca làm việc' },
  { key: 'schedule', label: 'Xếp lịch' },
  { key: 'history', label: 'Lịch sử phân ca' },
  { key: 'unassigned', label: 'Nhân viên chưa phân ca' }
]
// Utility function to format date consistently
const formatDateForAPI = (date) => {
  if (typeof date === 'string') {
    // If it's already a string, return as is
    return date
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Format date for display (DD/MM/YYYY)
const formatDateForDisplay = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

const normalizeDate = (date) => {
  const normalizedDate = new Date(date)
  normalizedDate.setHours(0, 0, 0, 0)
  return normalizedDate
}

const getEmployeeId = (employee) => {
  return employee.employeeID || employee.id || employee.Id || employee.employeeId || employee.userId
}

const getWorkShiftId = (shift) => {
  return shift.code || shift.id || shift.workShiftID || shift.ID
}

// Kiểm tra xem nhân viên đã được phân ca này chưa và lấy thông tin ngày
const getEmployeeShiftAssignmentInfo = (employee, shiftId) => {
  if (!employee || !shiftId || !selectedShiftForBulk) {
    return null
  }
  
  const employeeId = getEmployeeId(employee)
  // Chuẩn hóa shiftId để so sánh (có thể là số hoặc chuỗi)
  const normalizedShiftId = typeof shiftId === 'string' ? parseInt(shiftId) : shiftId
  
  const assignments = shiftAssignments.value.filter(assignment => {
    const assignmentEmployeeId = assignment.employeeID
    const assignmentShiftId = typeof assignment.workShiftID === 'string' 
      ? parseInt(assignment.workShiftID) 
      : assignment.workShiftID
    return assignmentEmployeeId === employeeId && assignmentShiftId === normalizedShiftId
  })
  
  if (assignments.length === 0) {
    return null
  }
  
  // Sắp xếp theo ngày và lấy ngày đầu và cuối
  const sortedDates = assignments
    .map(a => new Date(a.workDate))
    .sort((a, b) => a - b)
  
  return {
    hasAssignment: true,
    startDate: sortedDates[0],
    endDate: sortedDates[sortedDates.length - 1],
    totalDays: sortedDates.length
  }
}

onMounted(async () => {
  await fetchWorkShifts()
  await fetchAllShiftAssignments()
  await fetchAllEmployees()
  await fetchAttendance(true)
  await fetchLeaveRequests()
  loadCurrentWeekSchedule()
})

const currentWeekStart = ref(new Date())
const selectedDate = ref(new Date())

const showQuickAddModal = ref(false)
const quickAddEmployee = ref(null)
const quickAddDate = ref(null)
const quickAddShiftId = ref('')
const quickAddLoading = ref(false)

const showViewDetailsModal = ref(false)
const selectedShiftDetails = ref(null)
const isUpdatingShift = ref(false)

const showDeleteModal = ref(false)
const shiftToDelete = ref(null)
const showDeleteWarningModal = ref(false)
const deleteWarningData = ref({
  attendanceRecords: [],
  leaveRequests: [],
  workDate: '',
  employeeName: ''
})

const showBulkAssignModal = ref(false)
const selectedShiftForBulk = ref(null)
const selectedEmployees = ref([])
const bulkStartDate = ref('')
const bulkEndDate = ref('')
const bulkAssignLoading = ref(false)
const employeeSearchTerm = ref('')
const selectedRole = ref('')
const selectedGender = ref('')
const applyToAll = ref(true)
const employeeDateRanges = ref({})

const showChangeShiftModal = ref(false)
const selectedHistoryItem = ref(null)
const newStartDate = ref('')
const newEndDate = ref('')
const newShiftId = ref('')
const changeShiftLoading = ref(false)
const showTourGuide = ref(false)

// Search filters for each tab
const scheduleSearchTerm = ref('')
const historySearchTerm = ref('')
const unassignedSearchTerm = ref('')

const initCurrentWeekStart = () => {
  const today = new Date()
  const monday = new Date(today)
  const dayOfWeek = today.getDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  monday.setDate(today.getDate() - daysToMonday)
  monday.setHours(0, 0, 0, 0)
  currentWeekStart.value = monday
}

const loadCurrentWeekSchedule = () => {
  initCurrentWeekStart()
}

const goToPreviousWeek = () => {
  const newWeekStart = new Date(currentWeekStart.value)
  newWeekStart.setDate(newWeekStart.getDate() - 7)
  currentWeekStart.value = newWeekStart
}

const goToNextWeek = () => {
  const newWeekStart = new Date(currentWeekStart.value)
  newWeekStart.setDate(newWeekStart.getDate() + 7)
  currentWeekStart.value = newWeekStart
}

const goToSpecificDate = (date) => {
  const monday = new Date(date)
  const dayOfWeek = monday.getDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  monday.setDate(monday.getDate() - daysToMonday)
  monday.setHours(0, 0, 0, 0)
  currentWeekStart.value = monday
}

// Format week display
const weekDisplayText = computed(() => {
  const start = new Date(currentWeekStart.value)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  
  return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`
})

const openQuickAddModal = (employee, date) => {
  quickAddEmployee.value = employee
  quickAddDate.value = date
  quickAddShiftId.value = ''
  showQuickAddModal.value = true
}

const closeQuickAddModal = () => {
  showQuickAddModal.value = false
  quickAddEmployee.value = null
  quickAddDate.value = null
  quickAddShiftId.value = ''
}

const handleQuickAddShift = async () => {
  if (!quickAddShiftId.value) {
    showMessage('Vui lòng chọn ca làm việc', 'warning')
    return
  }

  try {
    quickAddLoading.value = true
    
    const shiftData = {
      employeeID: quickAddEmployee.value.empId,
      workShiftID: parseInt(quickAddShiftId.value),
      workDate: formatDateForAPI(quickAddDate.value)
    }
    
    await createShiftAssignment(shiftData)
    
    // Refresh data
    await fetchAllShiftAssignments()
    
    closeQuickAddModal()
    showMessage('Phân ca thành công!', 'success')
  } catch (error) {
    showMessage('Có lỗi xảy ra khi phân ca', 'error')
  } finally {
    quickAddLoading.value = false
  }
}

const getDateFromDayIndex = (dayIndex) => {
  const monday = new Date(currentWeekStart.value)
  const targetDate = new Date(monday)
  targetDate.setDate(monday.getDate() + (dayIndex - 1))
  return targetDate
}

// Computed property để lọc các ca làm việc chưa được phân cho nhân viên trong ngày
const availableShiftsForQuickAdd = computed(() => {
  if (!quickAddEmployee.value || !quickAddDate.value) {
    return workshifts.value || []
  }
  
  const employeeId = quickAddEmployee.value.empId
  const workDate = formatDateForAPI(quickAddDate.value)
  const workDateNormalized = normalizeDate(new Date(workDate))
  
  // Lấy danh sách các ca đã được phân cho nhân viên trong ngày đó
  const assignedShiftIds = shiftAssignments.value
    .filter(assignment => {
      const assignmentEmployeeId = assignment.employeeID
      const assignmentDate = normalizeDate(new Date(assignment.workDate))
      return assignmentEmployeeId === employeeId && 
             assignmentDate.getTime() === workDateNormalized.getTime()
    })
    .map(assignment => assignment.workShiftID)
  
  // Lấy thứ trong tuần của ngày được chọn
  const selectedDate = new Date(quickAddDate.value)
  const dayOfWeek = selectedDate.getDay()
  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
  const selectedDayName = dayNames[dayOfWeek]
  
  // Lọc các ca chưa được phân VÀ có shiftDetail cho ngày đó
  return (workshifts.value || []).filter(shift => {
    const shiftId = shift.id || shift.code
    
    // Kiểm tra xem ca đã được phân chưa
    if (assignedShiftIds.includes(shiftId)) {
      return false
    }
    
    // Kiểm tra xem ca có shiftDetail cho ngày được chọn không
    if (!shift.shiftDetails || !Array.isArray(shift.shiftDetails)) {
      return false
    }
    
    const dayShiftDetail = shift.shiftDetails.find(detail => detail.dayOfWeek === selectedDayName)
    
    // Chỉ hiển thị nếu có shiftDetail cho ngày này và startTime/endTime không phải '00:00:00'
    if (!dayShiftDetail) {
      return false
    }
    
    if (dayShiftDetail.startTime === '00:00:00' || dayShiftDetail.endTime === '00:00:00') {
      return false
    }
    
    return true
  })
})

const openViewDetailsModal = (shift) => {
  selectedShiftDetails.value = shift
  newShiftId.value = '' // Reset selection
  isUpdatingShift.value = false
  showViewDetailsModal.value = true
}

const closeViewDetailsModal = () => {
  showViewDetailsModal.value = false
  selectedShiftDetails.value = null
  newShiftId.value = ''
  isUpdatingShift.value = false
}

const handleUpdateShift = async () => {
  if (!selectedShiftDetails.value || !newShiftId.value) {
    showMessage('Vui lòng chọn ca làm việc mới', 'warning')
    return
  }

  if (newShiftId.value == selectedShiftDetails.value.shiftId) {
    showMessage('Ca làm việc mới phải khác ca hiện tại', 'warning')
    return
  }

  try {
    isUpdatingShift.value = true
    
    const newShift = workshifts.value.find(s => s.id == newShiftId.value)
    if (!newShift) {
      showMessage('Không tìm thấy thông tin ca làm việc', 'error')
      return
    }

    const updateData = {
      id: selectedShiftDetails.value.id,
      employeeID: selectedShiftDetails.value.employeeID,
      workShiftID: parseInt(newShiftId.value),
      workDate: formatDateForAPI(selectedShiftDetails.value.workDate)
    }
    
    await updateShiftAssignment(updateData)
    await fetchAllShiftAssignments()
    
    selectedShiftDetails.value = {
      ...selectedShiftDetails.value,
      shiftId: newShift.id,
      shiftName: newShift.shiftName,
      workShiftID: newShift.id,
      workShiftName: newShift.shiftName,
      startTime: newShift.shiftDetails?.[0]?.startTime || '',
      endTime: newShift.shiftDetails?.[0]?.endTime || ''
    }
    
    newShiftId.value = ''
    showMessage('Đổi ca thành công!', 'success')
  } catch (error) {
    showMessage('Có lỗi xảy ra khi đổi ca', 'error')
  } finally {
    isUpdatingShift.value = false
  }
}

const openDeleteModal = (shift) => {
  shiftToDelete.value = shift
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  shiftToDelete.value = null
}

const handleDeleteShift = async () => {
  if (!shiftToDelete.value) return

  try {
    // Kiểm tra xem có chấm công hoặc đơn nghỉ phép không
    const employeeID = shiftToDelete.value.employeeID
    const workDate = shiftToDelete.value.workDate
    const workShiftID = shiftToDelete.value.workShiftID || shiftToDelete.value.shiftId
    const employeeName = shiftToDelete.value.employeeName || 'N/A'

    // Format workDate để so sánh (YYYY-MM-DD)
    const workDateFormatted = formatDateForAPI(new Date(workDate))
    const workDateObj = new Date(workDate)
    workDateObj.setHours(0, 0, 0, 0)

    const attendanceRecords = []
    const leaveRequestRecords = []

    // 1. Kiểm tra chấm công
    try {
      const attendanceData = await attendanceService.getAttendanceByDate(workDateFormatted)
      const matchingAttendance = attendanceData && attendanceData.filter(att => {
        const attEmployeeId = att.employeeID || att.employeeId || att.employeeCode
        const attDate = new Date(att.attendanceDate || att.workDate)
        attDate.setHours(0, 0, 0, 0)
        return attEmployeeId === employeeID && attDate.getTime() === workDateObj.getTime()
      })

      if (matchingAttendance && matchingAttendance.length > 0) {
        matchingAttendance.forEach((att, index) => {
          attendanceRecords.push({
            stt: index + 1,
            checkInTime: att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
            checkOutTime: att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
            status: att.status || 'N/A',
            location: att.location || 'N/A'
          })
        })
      }
    } catch (attError) {
      console.error('Error checking attendance:', attError)
      // Nếu lỗi khi kiểm tra, vẫn cho phép xóa (không chặn)
    }

    // 2. Kiểm tra đơn nghỉ phép
    // Refresh leave requests để đảm bảo có dữ liệu mới nhất
    await fetchLeaveRequests()
    
    const matchingLeaveRequests = leaveRequests.value && leaveRequests.value.filter(leave => {
      // Kiểm tra cùng nhân viên
      if (leave.employeeID !== employeeID) return false
      
      // Kiểm tra cùng ca làm việc (nếu có)
      if (workShiftID && leave.workShiftID && leave.workShiftID !== workShiftID) return false
      
      // Kiểm tra ngày làm việc có nằm trong khoảng nghỉ phép không
      const leaveStart = new Date(leave.startDateTime)
      const leaveEnd = new Date(leave.endDateTime)
      leaveStart.setHours(0, 0, 0, 0)
      leaveEnd.setHours(0, 0, 0, 0)
      
      return workDateObj >= leaveStart && workDateObj <= leaveEnd
    })

    if (matchingLeaveRequests && matchingLeaveRequests.length > 0) {
      matchingLeaveRequests.forEach((leave, index) => {
        const startDateTime = new Date(leave.startDateTime)
        const endDateTime = new Date(leave.endDateTime)
        leaveRequestRecords.push({
          stt: index + 1,
          voucherCode: leave.voucherCode || leave.id || 'N/A',
          leaveType: leave.leaveTypeName || 'N/A',
          startDateTime: `${startDateTime.toLocaleDateString('vi-VN')} ${startDateTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
          endDateTime: `${endDateTime.toLocaleDateString('vi-VN')} ${endDateTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
          status: leave.approveStatus || 'N/A',
          reason: leave.reason || 'N/A'
        })
      })
    }

    // Nếu có chấm công hoặc đơn nghỉ phép, hiển thị modal cảnh báo
    if (attendanceRecords.length > 0 || leaveRequestRecords.length > 0) {
      deleteWarningData.value = {
        attendanceRecords,
        leaveRequests: leaveRequestRecords,
        workDate: formatDateForDisplay(workDate),
        employeeName
      }
      closeDeleteModal() // Đóng modal xác nhận xóa
      showDeleteWarningModal.value = true
      return
    }

    // Nếu không có chấm công và đơn nghỉ phép, cho phép xóa
    await deleteShiftAssignment(shiftToDelete.value.id)
    await fetchAllShiftAssignments()
    closeDeleteModal()
    closeViewDetailsModal()
    showMessage('Xóa phân ca thành công!', 'success')
  } catch (error) {
    console.error('Error deleting shift assignment:', error)
    showMessage('Có lỗi xảy ra khi xóa phân ca', 'error')
  }
}

const closeDeleteWarningModal = () => {
  showDeleteWarningModal.value = false
  deleteWarningData.value = {
    attendanceRecords: [],
    leaveRequests: [],
    workDate: '',
    employeeName: ''
  }
}

// Columns cho bảng chấm công
const attendanceColumns = [
  { key: 'stt', label: 'STT' },
  { key: 'checkInTime', label: 'Giờ vào' },
  { key: 'checkOutTime', label: 'Giờ ra' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'location', label: 'Vị trí' }
]

// Columns cho bảng đơn nghỉ phép
const leaveRequestColumns = [
  { key: 'stt', label: 'STT' },
  { key: 'voucherCode', label: 'Mã phiếu' },
  { key: 'leaveType', label: 'Loại nghỉ phép' },
  { key: 'startDateTime', label: 'Từ ngày/giờ' },
  { key: 'endDateTime', label: 'Đến ngày/giờ' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'reason', label: 'Lý do' }
]

const goToToday = () => {
  const today = new Date()
  goToSpecificDate(today)
}

const openBulkAssignModal = (shift) => {
  selectedShiftForBulk.value = shift
  selectedEmployees.value = []
  bulkStartDate.value = ''
  bulkEndDate.value = ''
  employeeSearchTerm.value = ''
  selectedRole.value = ''
  selectedGender.value = ''
  applyToAll.value = true
  employeeDateRanges.value = {}
  showBulkAssignModal.value = true
}

const closeBulkAssignModal = () => {
  showBulkAssignModal.value = false
  selectedShiftForBulk.value = null
  selectedEmployees.value = []
  bulkStartDate.value = ''
  bulkEndDate.value = ''
  employeeSearchTerm.value = ''
  selectedRole.value = ''
  selectedGender.value = ''
  applyToAll.value = true
  employeeDateRanges.value = {}
}

const openChangeShiftModal = (historyItem) => {
  selectedHistoryItem.value = historyItem
  // Điền sẵn thời gian hiện tại
  newStartDate.value = historyItem.startDate ? convertDisplayDateToInput(historyItem.startDate) : ''
  newEndDate.value = historyItem.endDate ? convertDisplayDateToInput(historyItem.endDate) : ''
  // Không cần set newShiftId vì không cho đổi ca làm việc
  showChangeShiftModal.value = true
}

const convertDisplayDateToInput = (displayDate) => {
  if (!displayDate || displayDate === 'N/A') return ''
  const [day, month, year] = displayDate.split('/')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

const closeChangeShiftModal = () => {
  showChangeShiftModal.value = false
  selectedHistoryItem.value = null
  newStartDate.value = ''
  newEndDate.value = ''
  newShiftId.value = ''
}

const handleChangeShift = async () => {
  if (!selectedHistoryItem.value) {
    showMessage('Không tìm thấy thông tin phân ca', 'error')
    return
  }

  if (!newStartDate.value || !newEndDate.value) {
    showMessage('Vui lòng chọn ngày bắt đầu và ngày kết thúc', 'warning')
    return
  }

  try {
    changeShiftLoading.value = true

    // Sử dụng ca làm việc hiện tại từ selectedHistoryItem, không cho đổi ca
    const currentWorkShiftID = selectedHistoryItem.value.workShiftID

    const oldAssignments = shiftAssignments.value.filter(assignment => 
      assignment.employeeID === selectedHistoryItem.value.employeeID &&
      assignment.workShiftID === currentWorkShiftID
    )

    await Promise.all(oldAssignments.map(assignment => deleteShiftAssignment(assignment.id)))

    const startDate = new Date(newStartDate.value)
    const endDate = new Date(newEndDate.value)
    const dates = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    const newAssignments = dates.map(date => ({
      employeeID: selectedHistoryItem.value.employeeID,
      workShiftID: currentWorkShiftID,
      workDate: formatDateForAPI(date)
    }))

    await Promise.all(newAssignments.map(assignment => createShiftAssignment(assignment)))
    await fetchAllShiftAssignments()

    closeChangeShiftModal()
    showMessage('Cập nhật khoảng thời gian thành công!', 'success')
  } catch (error) {
    showMessage('Có lỗi xảy ra khi cập nhật khoảng thời gian', 'error')
  } finally {
    changeShiftLoading.value = false
  }
}

const filteredEmployees = computed(() => {
  if (!employees.value || !Array.isArray(employees.value)) {
    return []
  }

  return employees.value.filter(emp => {
    const matchesSearch = !employeeSearchTerm.value || 
      emp.employeeName?.toLowerCase().includes(employeeSearchTerm.value.toLowerCase()) ||
      emp.employeeCode?.toLowerCase().includes(employeeSearchTerm.value.toLowerCase())
    
    const matchesRole = !selectedRole.value || emp.roleName === selectedRole.value
    const matchesGender = !selectedGender.value || emp.gender === selectedGender.value
    
    return matchesSearch && matchesRole && matchesGender
  })
})

const uniqueRoles = computed(() => {
  if (!employees.value || !Array.isArray(employees.value)) {
    return []
  }
  const roles = [...new Set(employees.value.map(emp => emp.roleName).filter(Boolean))]
  return roles
})

const uniqueGenders = computed(() => {
  if (!employees.value || !Array.isArray(employees.value)) {
    return []
  }
  const genders = [...new Set(employees.value.map(emp => emp.gender).filter(Boolean))]
  return genders
})

const handleEmployeeClick = (employee) => {
  toggleEmployeeSelection(employee)
}

const handleCheckboxChange = (employee, event) => {
  event.stopPropagation()
  toggleEmployeeSelection(employee)
}

const toggleEmployeeSelection = (employee) => {
  const employeeId = getEmployeeId(employee)
  
  const index = selectedEmployees.value.findIndex(emp => getEmployeeId(emp) === employeeId)
  
  if (index > -1) {
    selectedEmployees.value.splice(index, 1)
    delete employeeDateRanges.value[employeeId]
  } else {
    selectedEmployees.value.push(employee)
    if (!employeeDateRanges.value[employeeId]) {
      employeeDateRanges.value[employeeId] = {
        startDate: '',
        endDate: ''
      }
    }
  }
}

const isEmployeeSelected = (employee) => {
  const employeeId = getEmployeeId(employee)
  return selectedEmployees.value.some(emp => getEmployeeId(emp) === employeeId)
}

const selectAllFiltered = () => {
  selectedEmployees.value = [...filteredEmployees.value]
  filteredEmployees.value.forEach(emp => {
    const employeeId = getEmployeeId(emp)
    if (!employeeDateRanges.value[employeeId]) {
      employeeDateRanges.value[employeeId] = {
        startDate: '',
        endDate: ''
      }
    }
  })
}

const deselectAll = () => {
  selectedEmployees.value = []
  employeeDateRanges.value = {}
}

const handleBulkAssign = async () => {
  if (!selectedShiftForBulk.value) {
    showMessage('Vui lòng chọn ca làm việc', 'warning')
    return
  }

  if (selectedEmployees.value.length === 0) {
    showMessage('Vui lòng chọn ít nhất một nhân viên', 'warning')
    return
  }

  try {
    bulkAssignLoading.value = true

    const assignments = []

    if (applyToAll.value) {
      // Apply same date range to all employees
      if (!bulkStartDate.value || !bulkEndDate.value) {
        showMessage('Vui lòng chọn ngày bắt đầu và ngày kết thúc', 'warning')
        return
      }

      const startDate = new Date(bulkStartDate.value)
      const endDate = new Date(bulkEndDate.value)

      if (startDate > endDate) {
        showMessage('Ngày bắt đầu phải trước ngày kết thúc', 'warning')
        return
      }

      // Generate all dates between start and end date
      const dates = []
      const currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 1)
      }

        for (const employee of selectedEmployees.value) {
          const employeeId = getEmployeeId(employee)
          const workShiftId = getWorkShiftId(selectedShiftForBulk.value)
          
          for (const date of dates) {
            assignments.push({
              employeeID: employeeId,
              workShiftID: workShiftId,
              workDate: formatDateForAPI(date)
            })
          }
        }
    } else {
      for (const employee of selectedEmployees.value) {
        const employeeId = getEmployeeId(employee)
        const dateRange = employeeDateRanges.value[employeeId]
        
        if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
          showMessage(`Vui lòng chọn khoảng thời gian cho nhân viên ${employee.employeeName}`, 'warning')
          return
        }

        const startDate = new Date(dateRange.startDate)
        const endDate = new Date(dateRange.endDate)

        if (startDate > endDate) {
          showMessage(`Ngày bắt đầu phải trước ngày kết thúc cho nhân viên ${employee.employeeName}`, 'warning')
          return
        }

        const dates = []
        const currentDate = new Date(startDate)
        while (currentDate <= endDate) {
          dates.push(new Date(currentDate))
          currentDate.setDate(currentDate.getDate() + 1)
        }

        const workShiftId = getWorkShiftId(selectedShiftForBulk.value)
        
        for (const date of dates) {
          assignments.push({
            employeeID: employeeId,
            workShiftID: workShiftId,
            workDate: formatDateForAPI(date)
          })
        }
      }
    }
    
    // Validate assignments before sending
    for (const assignment of assignments) {
      if (!assignment.employeeID || assignment.employeeID === 'undefined') {
        showMessage('Lỗi: Không tìm thấy ID nhân viên', 'error')
        return
      }
      if (!assignment.workShiftID || assignment.workShiftID === 0) {
        showMessage('Lỗi: Không tìm thấy ID ca làm việc', 'error')
        return
      }
      if (!assignment.workDate) {
        showMessage('Lỗi: Không tìm thấy ngày làm việc', 'error')
        return
      }
    }
    
    await Promise.all(assignments.map(assignment => createShiftAssignment(assignment)))

    // Refresh data
    await fetchAllShiftAssignments()

    closeBulkAssignModal()
    showMessage(`Phân ca thành công!`, 'success')
  } catch (error) {
    showMessage('Có lỗi xảy ra khi phân ca hàng loạt', 'error')
  } finally {
    bulkAssignLoading.value = false
  }
}
// Tab Ca làm việc
const shiftCurrentPage = ref(1)
const shiftItemsPerPage = ref(8)
const shiftColumns = [
  { key: 'stt', label: 'STT' },
  { key: 'code', label: 'Mã ca' },
  { key: 'name', label: 'Tên ca' },
  { key: 'in', label: 'Giờ vào' },
  { key: 'out', label: 'Giờ ra' },
  { key: 'employeeCount', label: 'Số lượng NV' },
]
const shiftData = computed(() => {
  return workshifts.value.map((shift, index) => {
    // Lấy mảng giờ vào và giờ ra
    const startTimes = shift.shiftDetails.map(d => d.startTime)
    const endTimes = shift.shiftDetails.map(d => d.endTime)

    // Lọc bỏ các ngày nghỉ (00:00:00)
    const validStartTimes = startTimes.filter(time => time !== '00:00:00')
    const validEndTimes = endTimes.filter(time => time !== '00:00:00')

    // Tìm giờ vào sớm nhất (min) và giờ ra trễ nhất (max) từ các ngày làm việc
    const earliestStart = validStartTimes.length > 0 ? validStartTimes.reduce((a, b) => {
      const timeA = new Date(`2000-01-01T${a}`)
      const timeB = new Date(`2000-01-01T${b}`)
      return timeA < timeB ? a : b
    }) : '--:--'
    
    const latestEnd = validEndTimes.length > 0 ? validEndTimes.reduce((a, b) => {
      const timeA = new Date(`2000-01-01T${a}`)
      const timeB = new Date(`2000-01-01T${b}`)
      return timeA > timeB ? a : b
    }) : '--:--'

    // Tính số lượng nhân viên đã được phân cho ca này
    const employeeCount = shiftAssignments.value.filter(assignment => 
      assignment.workShiftID === shift.id || assignment.workShiftID === shift.code
    ).length

    return {
      stt: index + 1,
      code: shift.id,
      name: shift.shiftName,
      in: earliestStart, // giờ vào sớm nhất
      out: latestEnd,    // giờ ra trễ nhất
      employeeCount: employeeCount // số lượng nhân viên đã phân ca
    }
  })
})  
const paginatedShiftData = computed(() => {
  const start = (shiftCurrentPage.value - 1) * shiftItemsPerPage.value
  return shiftData.value.slice(start, start + shiftItemsPerPage.value)
})

// Tab Lịch sử phân ca
const historyCurrentPage = ref(1)
const historyItemsPerPage = ref(8)
const historyColumns = [
  { key: 'stt', label: 'STT' },
  { key: 'empId', label: 'Mã Nhân viên' },
  { key: 'empName', label: 'Tên Nhân viên' },
  { key: 'dept', label: 'Phòng ban' },
  { key: 'shiftCode', label: 'Mã ca' },
  { key: 'shiftName', label: 'Tên ca' },
  { key: 'startDate', label: 'Ngày bắt đầu' },
  { key: 'endDate', label: 'Ngày kết thúc' },
]
const historyData = computed(() => {
  // Nhóm các assignment theo nhân viên và ca làm việc
  const groupedAssignments = {}
  
  shiftAssignments.value.forEach(assignment => {
    const key = `${assignment.employeeID}-${assignment.workShiftID}`
    
    if (!groupedAssignments[key]) {
      groupedAssignments[key] = {
        employeeID: assignment.employeeID,
        workShiftID: assignment.workShiftID,
        dates: []
      }
    }
    
    groupedAssignments[key].dates.push(assignment.workDate)
  })
  
  // Chuyển đổi thành mảng và tính toán ngày bắt đầu/kết thúc
  return Object.values(groupedAssignments).map((group, index) => {
    const employee = employees.value.find(emp => getEmployeeId(emp) === group.employeeID)
    
    const shift = workshifts.value.find(s => 
      s.id === group.workShiftID || 
      s.code === group.workShiftID
    )
    
    const sortedDates = group.dates.sort()
    const startDate = sortedDates[0]
    const endDate = sortedDates[sortedDates.length - 1]
    
    return {
      stt: index + 1,
      empId: employee?.employeeCode || getEmployeeId(employee) || 'N/A',
      empName: employee?.employeeName || 'N/A',
      dept: employee?.roleName || employee?.department || 'N/A',
      shiftCode: shift?.code ? `CA-${shift.code}` : shift?.id ? `CA-${shift.id}` : 'N/A',
      shiftName: shift?.name || shift?.shiftName || 'N/A',
      startDate: formatDateForDisplay(startDate),
      endDate: formatDateForDisplay(endDate),
      // Thêm thông tin cần thiết cho việc đổi phân ca
      employeeID: group.employeeID,
      workShiftID: group.workShiftID
    }
  })
})
// Filter history data by search term
const filteredHistoryData = computed(() => {
  if (!historySearchTerm.value.trim()) {
    return historyData.value
  }
  const searchLower = historySearchTerm.value.toLowerCase().trim()
  return historyData.value.filter(item => {
    const empId = (item.empId || '').toLowerCase()
    const empName = (item.empName || '').toLowerCase()
    return empId.includes(searchLower) || empName.includes(searchLower)
  })
})

const paginatedHistoryData = computed(() => {
  const start = (historyCurrentPage.value - 1) * historyItemsPerPage.value
  return filteredHistoryData.value.slice(start, start + historyItemsPerPage.value)
})

// Tab Nhân viên chưa phân ca
const unassignedCurrentPage = ref(1)
const unassignedItemsPerPage = ref(8)
const unassignedColumns = [
  { key: 'stt', label: 'STT' },
  { key: 'empId', label: 'Mã Nhân viên' },
  { key: 'empName', label: 'Tên Nhân viên' },
  { key: 'dept', label: 'Phòng ban' },
  { key: 'title', label: 'Chức danh' },
  { key: 'joinDate', label: 'Ngày vào làm' }
]
const unassignedData = computed(() => {
  // Lấy danh sách nhân viên chưa được phân ca
  const assignedEmployeeIds = new Set(shiftAssignments.value.map(assignment => assignment.employeeID))
  
  return employees.value
    .filter(employee => !assignedEmployeeIds.has(getEmployeeId(employee)))
    .map((employee, index) => ({
      stt: index + 1,
      empId: employee.employeeCode || getEmployeeId(employee) || 'N/A',
      empName: employee.employeeName || 'N/A',
      dept: employee.roleName || employee.department || 'N/A',
      title: employee.roleName || 'N/A', // Chức danh là roleName
      joinDate: formatDateForDisplay(employee.joinDate) || 'N/A'
    }))
})
// Filter unassigned data by search term
const filteredUnassignedData = computed(() => {
  if (!unassignedSearchTerm.value.trim()) {
    return unassignedData.value
  }
  const searchLower = unassignedSearchTerm.value.toLowerCase().trim()
  return unassignedData.value.filter(item => {
    const empId = (item.empId || '').toLowerCase()
    const empName = (item.empName || '').toLowerCase()
    return empId.includes(searchLower) || empName.includes(searchLower)
  })
})

const paginatedUnassignedData = computed(() => {
  const start = (unassignedCurrentPage.value - 1) * unassignedItemsPerPage.value
  return filteredUnassignedData.value.slice(start, start + unassignedItemsPerPage.value)
})

// Tab Xếp lịch - columns sẽ được tạo động dựa trên tuần được chọn
const scheduleColumns = computed(() => {
  const monday = new Date(currentWeekStart.value)
  
  const baseColumns = [
    { key: 'empId', label: 'Mã nhân viên' },
    { key: 'empName', label: 'Tên nhân viên' }
  ]
  
  const dayColumns = Array.from({ length: 7 }, (_, i) => {
    const currentDate = new Date(monday)
    currentDate.setDate(monday.getDate() + i)
    const dayNames = ['T2','T3','T4','T5','T6','T7','CN']
    
    return {
      key: `day${i + 1}`,
      label: `${String(currentDate.getDate()).padStart(2, '0')}/${String(currentDate.getMonth() + 1).padStart(2, '0')} (${dayNames[i]})`
    }
  })
  
  return [...baseColumns, ...dayColumns]
})
// Filter shift assignments by current week
const currentWeekAssignments = computed(() => {
  if (!shiftAssignments.value || !Array.isArray(shiftAssignments.value)) {
    return []
  }
  
  const monday = new Date(currentWeekStart.value)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  
  return shiftAssignments.value.filter(assignment => {
    const assignmentDate = normalizeDate(assignment.workDate)
    const mondayNormalized = normalizeDate(monday)
    const sundayNormalized = normalizeDate(sunday)
    
    return assignmentDate >= mondayNormalized && assignmentDate <= sundayNormalized
  })
})

// Convert current week assignments to schedule format
const scheduleData = computed(() => {
  // Group by employee - tạo danh sách nhân viên từ tất cả assignments
  const employeeGroups = {}
  
  // Lấy tất cả nhân viên từ shiftAssignments (không chỉ tuần hiện tại)
  if (shiftAssignments.value && Array.isArray(shiftAssignments.value)) {
    shiftAssignments.value.forEach(assignment => {
      const empId = assignment.employeeID
      if (!employeeGroups[empId]) {
        employeeGroups[empId] = {
          empId: empId,
          empName: assignment.employeeName,
          day1: [], day2: [], day3: [], day4: [], day5: [], day6: [], day7: []
        }
      }
    })
  }
  
  // Chỉ thêm assignments của tuần hiện tại vào các ngày tương ứng
  if (currentWeekAssignments.value && currentWeekAssignments.value.length > 0) {
    currentWeekAssignments.value.forEach(assignment => {
      const empId = assignment.employeeID
      if (employeeGroups[empId]) {
        // Determine which day of week (1-7, Monday-Sunday)
        const assignmentDate = normalizeDate(assignment.workDate)
        const mondayNormalized = normalizeDate(currentWeekStart.value)
        const dayDiff = Math.floor((assignmentDate - mondayNormalized) / (1000 * 60 * 60 * 24))
        const dayIndex = dayDiff + 1 // 1-7 for Monday-Sunday
        
        if (dayIndex >= 1 && dayIndex <= 7) {
          const dayKey = `day${dayIndex}`
          employeeGroups[empId][dayKey].push({
            shiftName: assignment.workShiftName,
            shiftId: assignment.workShiftID,
            workDate: assignment.workDate,
            workDateFormatted: assignment.workDateFormatted || formatDateForDisplay(assignment.workDate),
            startTime: assignment.startTime || '',
            endTime: assignment.endTime || '',
            id: assignment.id,
            employeeID: assignment.employeeID,
            employeeName: assignment.employeeName
          })
        }
      }
    })
  }
  
  return Object.values(employeeGroups)
})
const scheduleCurrentPage = ref(1)
const scheduleItemsPerPage = ref(8)

// Filter schedule data by search term
const filteredScheduleData = computed(() => {
  if (!scheduleSearchTerm.value.trim()) {
    return scheduleData.value || []
  }
  const searchLower = scheduleSearchTerm.value.toLowerCase().trim()
  return (scheduleData.value || []).filter(item => {
    const empId = (item.empId || '').toLowerCase()
    const empName = (item.empName || '').toLowerCase()
    return empId.includes(searchLower) || empName.includes(searchLower)
  })
})

const paginatedScheduleData = computed(() => {
  const start = (scheduleCurrentPage.value - 1) * scheduleItemsPerPage.value
  return filteredScheduleData.value.slice(start, start + scheduleItemsPerPage.value)
})

// Tour Guide Steps
const shiftTourSteps = [
  {
    target: '[data-tour="title"]',
    message: 'Xin chào! Tôi là trợ lý robot hướng dẫn của bạn. Đây là trang quản lý phân ca làm việc. Tab "Ca làm việc" hiển thị danh sách các ca làm việc và số lượng nhân viên đã được phân cho mỗi ca.'
  },
  {
    target: '[data-tour="tabs"]',
    message: 'Đây là các tab để chuyển đổi giữa các chức năng: "Ca làm việc", "Xếp lịch", "Lịch sử phân ca" và "Nhân viên chưa phân ca". Hiện tại bạn đang ở tab "Ca làm việc".'
  },
  {
    target: '[data-tour="table-shift"]',
    message: 'Đây là bảng danh sách ca làm việc. Bạn có thể xem thông tin về các ca làm việc như STT, mã ca, tên ca, giờ vào, giờ ra và số lượng nhân viên đã được phân cho mỗi ca.'
  },
  {
    target: '[data-tour="actions-shift"]',
    message: 'Cột "Thao tác" chứa nút "Phân ca hàng loạt" để bạn phân ca cho nhiều nhân viên cùng lúc với một ca làm việc đã chọn.',
    action: {
      type: 'click',
      selector: '[data-tour="actions-shift"] button:first-of-type'
    }
  },
  {
    target: '[data-tour="bulk-assign-modal"]',
    message: 'Đây là modal phân ca hàng loạt. Bạn có thể phân ca cho nhiều nhân viên cùng lúc với một ca làm việc đã chọn. Hãy để tôi hướng dẫn từng phần!'
  },
  {
    target: '[data-tour="bulk-shift-info"]',
    message: 'Đây là thông tin ca làm việc đã chọn. Bạn có thể thấy tên ca, mã ca, giờ làm việc và số lượng nhân viên hiện tại đã được phân cho ca này.'
  },
  {
    target: '[data-tour="bulk-date-range"]',
    message: 'Đây là phần chọn khoảng thời gian. Bạn có thể chọn áp dụng cùng khoảng thời gian cho tất cả nhân viên, hoặc tắt để chọn khoảng thời gian riêng cho từng nhân viên.'
  },
  {
    target: '[data-tour="bulk-employee-selection"]',
    message: 'Đây là phần chọn nhân viên. Bạn có thể tìm kiếm, lọc theo chức vụ và giới tính, sau đó chọn các nhân viên cần phân ca. Có thể chọn tất cả hoặc bỏ chọn tất cả.'
  },
  {
    target: '[data-tour="bulk-actions"]',
    message: 'Sau khi chọn nhân viên và khoảng thời gian, bấm "Xác nhận phân ca" để thực hiện phân ca hàng loạt. Nút "Hủy" để đóng modal.'
  },
  {
    target: '[data-tour="pagination-shift"]',
    message: 'Phần phân trang ở cuối trang cho phép bạn chuyển đổi giữa các trang để xem nhiều ca làm việc hơn. Đó là tất cả những gì tôi muốn giới thiệu với bạn về tab "Ca làm việc"!',
    action: {
      type: 'function',
      func: async () => {
        // Đóng modal nếu đang mở
        const modal = document.querySelector('.modal.show')
        if (modal) {
          const closeBtn = modal.querySelector('.btn-close, [data-bs-dismiss="modal"]')
          if (closeBtn) closeBtn.click()
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }
    }
  }
]

const scheduleTourSteps = [
  {
    target: '[data-tour="title"]',
    message: 'Xin chào! Tôi là trợ lý robot hướng dẫn của bạn. Đây là tab "Xếp lịch" - nơi bạn có thể xem và quản lý lịch phân ca theo tuần cho tất cả nhân viên.'
  },
  {
    target: '[data-tour="tabs"]',
    message: 'Đây là các tab để chuyển đổi giữa các chức năng. Hiện tại bạn đang ở tab "Xếp lịch".'
  },
  {
    target: '[data-tour="week-filter"]',
    message: 'Đây là bộ lọc tuần. Bạn có thể chuyển sang tuần trước, tuần sau, chuyển đến hôm nay, hoặc chọn một ngày cụ thể để xem lịch phân ca của tuần đó. Nút "Làm mới" để tải lại dữ liệu.'
  },
  {
    target: '[data-tour="table-schedule"]',
    message: 'Đây là bảng lịch phân ca theo tuần. Mỗi hàng là một nhân viên, mỗi cột là một ngày trong tuần. Bạn có thể thấy các ca làm việc đã được phân cho từng nhân viên trong từng ngày.'
  },
  {
    target: '[data-tour="schedule-cell"]',
    message: 'Mỗi ô trong bảng hiển thị ca làm việc của nhân viên trong ngày đó. Bạn có thể bấm vào ô để xem chi tiết hoặc đổi ca. Nếu ô trống, bạn có thể bấm nút "+" để thêm ca làm việc nhanh cho nhân viên đó.'
  },
  {
    target: '[data-tour="view-details-modal"]',
    message: 'Đây là modal chi tiết phân ca. Bạn có thể xem thông tin nhân viên, ca làm việc, ngày làm việc và thời gian. Bạn cũng có thể đổi ca hoặc xóa phân ca từ đây.',
    action: {
      type: 'click',
      selector: '[data-tour="schedule-cell"] .shift-block:first-of-type'
    }
  },
  {
    target: '[data-tour="change-shift-section"]',
    message: 'Đây là phần đổi ca làm việc. Bạn có thể chọn ca mới từ dropdown và bấm "Đổi ca" để thay đổi ca làm việc cho nhân viên.'
  },
  {
    target: '[data-tour="view-details-actions"]',
    message: 'Các nút hành động: "Đóng" để đóng modal, "Đổi ca" để thay đổi ca làm việc, "Xóa phân ca" để xóa phân ca này.'
  },
  {
    target: '[data-tour="quick-add-modal"]',
    message: 'Đây là modal thêm ca làm việc nhanh. Bạn có thể chọn ca làm việc cho nhân viên vào ngày đã chọn. Modal hiển thị thông tin nhân viên và ngày đã chọn.',
    action: {
      type: 'function',
      func: async () => {
        // Đóng modal chi tiết nếu đang mở
        const modal = document.querySelector('.modal.show')
        if (modal) {
          const closeBtn = modal.querySelector('.btn-close, [data-bs-dismiss="modal"]')
          if (closeBtn) closeBtn.click()
          await new Promise(resolve => setTimeout(resolve, 200))
        }
        // Tìm nút + đầu tiên và click
        const addBtn = document.querySelector('[data-tour="quick-add-btn"]')
        if (addBtn) {
          addBtn.click()
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
    }
  },
  {
    target: '[data-tour="quick-add-shift-select"]',
    message: 'Đây là dropdown chọn ca làm việc. Bạn chọn ca làm việc từ danh sách các ca có sẵn.'
  },
  {
    target: '[data-tour="quick-add-actions"]',
    message: 'Sau khi chọn ca làm việc, bấm "Xác nhận phân ca" để thêm ca cho nhân viên. Nút "Hủy" để đóng modal.'
  },
  {
    target: '[data-tour="pagination-schedule"]',
    message: 'Phần phân trang ở cuối trang cho phép bạn chuyển đổi giữa các trang để xem nhiều nhân viên hơn. Đó là tất cả những gì tôi muốn giới thiệu với bạn về tab "Xếp lịch"!',
    action: {
      type: 'function',
      func: async () => {
        // Đóng modal nếu đang mở
        const modal = document.querySelector('.modal.show')
        if (modal) {
          const closeBtn = modal.querySelector('.btn-close, [data-bs-dismiss="modal"]')
          if (closeBtn) closeBtn.click()
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }
    }
  }
]

const historyTourSteps = [
  {
    target: '[data-tour="title"]',
    message: 'Xin chào! Tôi là trợ lý robot hướng dẫn của bạn. Đây là tab "Lịch sử phân ca" - nơi bạn có thể xem tất cả các phân ca đã được thực hiện và đổi phân ca nếu cần.'
  },
  {
    target: '[data-tour="tabs"]',
    message: 'Đây là các tab để chuyển đổi giữa các chức năng. Hiện tại bạn đang ở tab "Lịch sử phân ca".'
  },
  {
    target: '[data-tour="table-history"]',
    message: 'Đây là bảng lịch sử phân ca. Bạn có thể xem thông tin về các phân ca như STT, mã nhân viên, tên nhân viên, phòng ban, mã ca, tên ca, ngày bắt đầu và ngày kết thúc.'
  },
  {
    target: '[data-tour="change-shift-modal"]',
    message: 'Đây là modal đổi phân ca. Bạn có thể xem thông tin phân ca hiện tại và thay đổi ca làm việc, khoảng thời gian cho nhân viên. Hãy để tôi hướng dẫn từng phần!',
    action: {
      type: 'click',
      selector: '[data-tour="actions-history"] button:first-of-type'
    }
  },
  {
    target: '[data-tour="current-assignment-info"]',
    message: 'Đây là thông tin phân ca hiện tại. Bạn có thể thấy nhân viên, mã nhân viên, phòng ban, ca hiện tại, mã ca và khoảng thời gian hiện tại.'
  },
  {
    target: '[data-tour="new-assignment-form"]',
    message: 'Đây là form nhập thông tin phân ca mới. Bạn cần chọn ca làm việc mới, ngày bắt đầu và ngày kết thúc. Hệ thống sẽ tự động tính số ngày sẽ được phân.'
  },
  {
    target: '[data-tour="change-shift-actions"]',
    message: 'Sau khi nhập đầy đủ thông tin, bấm "Xác nhận đổi phân ca" để thực hiện đổi phân ca. Nút "Hủy" để đóng modal.'
  },
  {
    target: '[data-tour="pagination-history"]',
    message: 'Phần phân trang ở cuối trang cho phép bạn chuyển đổi giữa các trang để xem nhiều lịch sử phân ca hơn. Đó là tất cả những gì tôi muốn giới thiệu với bạn về tab "Lịch sử phân ca"!',
    action: {
      type: 'function',
      func: async () => {
        // Đóng modal nếu đang mở
        const modal = document.querySelector('.modal.show')
        if (modal) {
          const closeBtn = modal.querySelector('.btn-close, [data-bs-dismiss="modal"]')
          if (closeBtn) closeBtn.click()
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }
    }
  }
]

const unassignedTourSteps = [
  {
    target: '[data-tour="title"]',
    message: 'Xin chào! Tôi là trợ lý robot hướng dẫn của bạn. Đây là tab "Nhân viên chưa phân ca" - nơi bạn có thể xem danh sách các nhân viên chưa được phân ca làm việc nào.'
  },
  {
    target: '[data-tour="tabs"]',
    message: 'Đây là các tab để chuyển đổi giữa các chức năng. Hiện tại bạn đang ở tab "Nhân viên chưa phân ca".'
  },
  {
    target: '[data-tour="table-unassigned"]',
    message: 'Đây là bảng danh sách nhân viên chưa phân ca. Bạn có thể xem thông tin về các nhân viên như STT, mã nhân viên, tên nhân viên, phòng ban, chức danh và ngày vào làm.'
  },
  {
    target: '[data-tour="pagination-unassigned"]',
    message: 'Phần phân trang ở cuối trang cho phép bạn chuyển đổi giữa các trang để xem nhiều nhân viên chưa phân ca hơn. Bạn có thể quay lại tab "Ca làm việc" để phân ca cho những nhân viên này. Đó là tất cả những gì tôi muốn giới thiệu với bạn về tab "Nhân viên chưa phân ca"!'
  }
]

const tourSteps = computed(() => {
  switch (activeTab.value) {
    case 'shift':
      return shiftTourSteps
    case 'schedule':
      return scheduleTourSteps
    case 'history':
      return historyTourSteps
    case 'unassigned':
      return unassignedTourSteps
    default:
      return shiftTourSteps
  }
})

const handleTourComplete = () => {
  showTourGuide.value = false
}

const startTour = () => {
  // Đợi một chút để UI render xong
  setTimeout(() => {
    showTourGuide.value = true
  }, 300)
}

// Reset pagination when search term changes
watch(scheduleSearchTerm, () => {
  scheduleCurrentPage.value = 1
})

watch(historySearchTerm, () => {
  historyCurrentPage.value = 1
})

watch(unassignedSearchTerm, () => {
  unassignedCurrentPage.value = 1
})
</script>

<template>
  <div class="container-fluid py-4" data-tour="title">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="shift-tabs-bar" data-tour="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-bar-item"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>
    
    <!-- Week Filter for Schedule Tab -->
    <div v-if="activeTab === 'schedule'" class="mb-3" data-tour="week-filter">
      <!-- Custom week filter for schedule tab -->
      <div class="d-flex flex-wrap align-items-center gap-3 py-3 border-bottom">
        <!-- Week Navigation -->
        <div class="d-flex align-items-center gap-2">
          <button 
            class="btn btn-outline-secondary btn-sm" 
            @click="goToPreviousWeek"
            :disabled="shiftLoading"
            title="Tuần trước"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <div class="text-center px-3">
            <h6 class="mb-0 fw-semibold text-dark">{{ weekDisplayText }}</h6>
          </div>
          <button 
            class="btn btn-outline-secondary btn-sm" 
            @click="goToNextWeek"
            :disabled="shiftLoading"
            title="Tuần sau"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>

        <!-- Quick Actions and Search Filter - Same row -->
        <div class="d-flex align-items-center gap-2">
          <button 
            class="btn btn-outline-primary btn-sm" 
            @click="goToToday"
            :disabled="shiftLoading"
            title="Hôm nay"
          >
            <i class="fas fa-calendar-day"></i>
          </button>
          
          <!-- Date Picker -->
          <div class="input-group" style="max-width: 200px;">
            <span class="input-group-text bg-light border-end-0 py-2">
              <i class="fas fa-calendar-alt text-muted"></i>
            </span>
            <input 
              type="date" 
              class="form-control form-control-sm border-start-0" 
              v-model="selectedDate"
              @change="goToSpecificDate(new Date(selectedDate))"
              :disabled="shiftLoading"
            />
          </div>
          
          <!-- Search Filter - Next to date picker -->
          <div class="input-group" style="max-width: 400px;">
            <span class="input-group-text bg-light border-end-0">
              <i class="fas fa-search text-muted"></i>
            </span>
            <input 
              type="text" 
              class="form-control border-start-0" 
              v-model="scheduleSearchTerm"
              placeholder="Tìm kiếm theo mã hoặc tên nhân viên..."
            />
            <button 
              v-if="scheduleSearchTerm"
              class="btn btn-outline-secondary btn-sm border-start-0" 
              @click="scheduleSearchTerm = ''"
              title="Xóa bộ lọc"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <!-- Refresh Button -->
          <button 
            class="btn btn-outline-secondary btn-sm" 
            @click="fetchAllShiftAssignments"
            :disabled="shiftLoading"
            title="Làm mới dữ liệu"
          >
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>
    </div>
    <div v-if="activeTab === 'shift'">
      <DataTable :columns="shiftColumns" :data="paginatedShiftData" data-tour="table-shift">
        <template #actions="{ item }">
          <div class="d-flex justify-content-start align-items-start gap-2" data-tour="actions-shift">
          <ActionButton 
            type="outline-primary" 
            icon="fas fa-calendar-alt" 
            tooltip="Phân ca hàng loạt"
            @click="openBulkAssignModal(item)"
          ></ActionButton>
        </div>
      </template>
        
      </DataTable>
      <!-- Phân trang -->
      <div class="d-flex justify-content-between align-items-center mt-4">
        <div class="text-muted">
          Hiển thị {{ paginatedShiftData.length }} trên {{ shiftData.length }} ca làm việc
        </div>
        <Pagination
          :totalItems="shiftData.length"
          :itemsPerPage="shiftItemsPerPage"
          :currentPage="shiftCurrentPage"
          @update:currentPage="shiftCurrentPage = $event"
          data-tour="pagination-shift"
        />
      </div>
    </div>
    <div v-else-if="activeTab === 'schedule'">
      <div v-if="shiftLoading" class="text-center py-3">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Đang tải...</span>
        </div>
      </div>
      <div v-else-if="shiftError" class="alert alert-danger">
        {{ shiftError }}
      </div>
      <DataTable v-else :columns="scheduleColumns" :data="paginatedScheduleData" data-tour="table-schedule">
        <template #empId="{ item }">
          <span class="emp-id">{{ item.empId }}</span>
        </template>
        <template #empName="{ item }">
          <span class="emp-name">{{ item.empName }}</span>
        </template>
        <template #title="{ item }">
          <span class="emp-title">{{ item.title }}</span>
        </template>
        <template v-for="i in 7" #[`day${i}`]="{ item }">
          <div class="schedule-cell-blocks" data-tour="schedule-cell">
            <template v-if="item[`day${i}`] && item[`day${i}`].length">
              <div
                v-for="(shift, idx) in item[`day${i}`]"
                :key="idx"
                class="shift-block position-relative"
                @click="openViewDetailsModal(shift)"
                style="cursor: pointer;"
                data-tour="shift-block"
              >
                <button 
                  class="btn btn-link btn-sm position-absolute top-0 end-0 delete-btn"
                  style="padding: 2px 6px; font-size: 0.7rem; z-index: 10; color: #dc3545;"
                  @click.stop="openDeleteModal(shift)"
                  title="Xóa phân ca"
                >
                  <i class="fas fa-times"></i>
                </button>
                <div class="shift-name">{{ shift.shiftName }}</div>
                <div class="shift-time">{{ shift.startTime || 'N/A' }} - {{ shift.endTime || 'N/A' }}</div>
              </div>
            </template>
            
            <!-- Luôn hiển thị nút + để thêm ca làm việc -->
            <button 
              class="quick-add-shift-btn"
              @click="openQuickAddModal(item, getDateFromDayIndex(i))"
              title="Thêm ca làm việc"
              data-tour="quick-add-btn"
            >
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </template>
        
      </DataTable>
      <Pagination
        :totalItems="filteredScheduleData.length"
        :itemsPerPage="scheduleItemsPerPage"
        :currentPage="scheduleCurrentPage"
        @update:currentPage="scheduleCurrentPage = $event"
        data-tour="pagination-schedule"
      />
    </div>
    <div v-else-if="activeTab === 'history'">
      <!-- Search Filter -->
      <div class="mb-3">
        <div class="input-group" style="max-width: 400px;">
          <span class="input-group-text bg-light border-end-0">
            <i class="fas fa-search text-muted"></i>
          </span>
          <input 
            type="text" 
            class="form-control border-start-0" 
            v-model="historySearchTerm"
            placeholder="Tìm kiếm theo mã nhân viên hoặc tên nhân viên..."
          />
          <button 
            v-if="historySearchTerm"
            class="btn btn-outline-secondary border-start-0" 
            @click="historySearchTerm = ''"
            title="Xóa bộ lọc"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      
      <DataTable :columns="historyColumns" :data="paginatedHistoryData" data-tour="table-history">
        <template #actions="{ item }">
          <div class="d-flex justify-content-start gap-2" data-tour="actions-history">
            <button 
              type="button" 
              class="btn btn-outline-primary btn-sm"
              @click="openChangeShiftModal(item)"
              title="Đổi phân ca"
            >
              <i class="fas fa-edit me-1"></i>
              Đổi
            </button>
          </div>
        </template>
      </DataTable>
      <!-- Phân trang -->
      <div class="d-flex justify-content-between align-items-center mt-4">
        <div class="text-muted">
          Hiển thị {{ paginatedHistoryData.length }} trên {{ filteredHistoryData.length }} lịch sử phân ca
        </div>
        <Pagination
          :totalItems="filteredHistoryData.length"
          :itemsPerPage="historyItemsPerPage"
          :currentPage="historyCurrentPage"
          @update:currentPage="historyCurrentPage = $event"
          data-tour="pagination-history"
        />
      </div>
    </div>
    <div v-else-if="activeTab === 'unassigned'">
      <!-- Search Filter -->
      <div class="mb-3">
        <div class="input-group" style="max-width: 400px;">
          <span class="input-group-text bg-light border-end-0">
            <i class="fas fa-search text-muted"></i>
          </span>
          <input 
            type="text" 
            class="form-control border-start-0" 
            v-model="unassignedSearchTerm"
            placeholder="Tìm kiếm theo mã nhân viên hoặc tên nhân viên..."
          />
          <button 
            v-if="unassignedSearchTerm"
            class="btn btn-outline-secondary border-start-0" 
            @click="unassignedSearchTerm = ''"
            title="Xóa bộ lọc"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      
      <DataTable :columns="unassignedColumns" :data="paginatedUnassignedData" data-tour="table-unassigned" />
      <!-- Phân trang -->
      <div class="d-flex justify-content-between align-items-center mt-4">
        <div class="text-muted">
          Hiển thị {{ paginatedUnassignedData.length }} trên {{ filteredUnassignedData.length }} nhân viên chưa phân ca
        </div>
        <Pagination
          :totalItems="filteredUnassignedData.length"
          :itemsPerPage="unassignedItemsPerPage"
          :currentPage="unassignedCurrentPage"
          @update:currentPage="unassignedCurrentPage = $event"
          data-tour="pagination-unassigned"
        />
      </div>
    </div>
  
  <!-- Tour Guide -->
  <TourGuide
    :show="showTourGuide"
    :steps="tourSteps"
    @update:show="showTourGuide = $event"
    @complete="handleTourComplete"
  />
  </div>

  <!-- Quick Add Shift Modal -->
  <ModalDialog 
    :show="showQuickAddModal" 
    title="Thêm ca làm việc nhanh"
    size="lg"
    @update:show="showQuickAddModal = $event"
    data-tour="quick-add-modal"
  >
    <div class="quick-add-modal-content">
      <div class="quick-add-info-cards">
        <div class="row g-3">
          <div class="col-md-6">
            <div class="quick-add-card quick-add-card-employee">
              <div class="quick-add-card-icon">
                <i class="fas fa-user"></i>
              </div>
              <div class="quick-add-card-content">
                <h6 class="quick-add-card-title">{{ quickAddEmployee?.empName }}</h6>
                <p class="quick-add-card-subtitle">{{ quickAddEmployee?.empId }}</p>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="quick-add-card quick-add-card-date">
              <div class="quick-add-card-icon">
                <i class="fas fa-calendar-day"></i>
              </div>
              <div class="quick-add-card-content">
                <h6 class="quick-add-card-title">{{ quickAddDate?.toLocaleDateString('vi-VN') }}</h6>
                <p class="quick-add-card-subtitle">{{ quickAddDate?.toLocaleDateString('vi-VN', { weekday: 'long' }) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="quick-add-form-section" data-tour="quick-add-shift-select">
        <label class="quick-add-label">
          <i class="fas fa-clock me-2"></i>
          Chọn ca làm việc
        </label>
        <div class="quick-add-select-wrapper">
          <select 
            class="quick-add-select" 
            v-model="quickAddShiftId"
            :disabled="quickAddLoading"
          >
            <option value="">-- Chọn ca làm việc --</option>
            <option 
              v-for="shift in availableShiftsForQuickAdd" 
              :key="shift.id" 
              :value="shift.id"
            >
              {{ shift.shiftName }}
              <template v-if="shift.shiftDetails && shift.shiftDetails.length > 0">
                ({{ shift.shiftDetails[0].startTime }} - {{ shift.shiftDetails[0].endTime }})
              </template>
            </option>
          </select>
        </div>
        <div v-if="availableShiftsForQuickAdd.length === 0" class="quick-add-empty-message">
          <i class="fas fa-info-circle me-2"></i>
          Nhân viên đã được phân tất cả các ca trong ngày này
        </div>
      </div>

      <div class="quick-add-confirm-alert" v-if="quickAddShiftId">
        <div class="quick-add-confirm-content">
          <i class="fas fa-check-circle quick-add-confirm-icon"></i>
          <div class="quick-add-confirm-text">
            <strong>Xác nhận phân ca:</strong>
            <span>
              {{ quickAddEmployee?.empName }} sẽ làm ca 
              <strong>{{ workshifts.find(s => s.id == quickAddShiftId)?.shiftName }}</strong>
              vào ngày <strong>{{ quickAddDate?.toLocaleDateString('vi-VN') }}</strong>
            </span>
          </div>
        </div>
      </div>

      <div class="quick-add-actions" data-tour="quick-add-actions">
        <button 
          type="button" 
          class="quick-add-btn quick-add-btn-cancel" 
          @click="closeQuickAddModal"
          :disabled="quickAddLoading"
        >
          <i class="fas fa-times me-2"></i>
          Hủy
        </button>
        <button 
          type="button" 
          class="quick-add-btn quick-add-btn-submit" 
          @click="handleQuickAddShift"
          :disabled="!quickAddShiftId || quickAddLoading"
        >
          <i v-if="quickAddLoading" class="fas fa-spinner fa-spin me-2"></i>
          <i v-else class="fas fa-check me-2"></i>
          {{ quickAddLoading ? 'Đang phân ca...' : 'Xác nhận phân ca' }}
        </button>
      </div>
    </div>
  </ModalDialog>

  <!-- View Shift Details Modal -->
  <ModalDialog 
    :show="showViewDetailsModal" 
    title="Chi tiết phân ca"
    size="md"
    @update:show="showViewDetailsModal = $event"
    data-tour="view-details-modal"
  >
    <div class="shift-details-modal-content" v-if="selectedShiftDetails">
      <!-- Thông tin chính -->
      <div class="shift-details-main-info">
        <div class="row g-2">
          <div class="col-4">
            <div class="shift-details-info-item">
              <div class="shift-details-info-icon">
                <i class="fas fa-user"></i>
              </div>
              <div class="shift-details-info-content">
                <label>Nhân viên</label>
                <div class="shift-details-info-value">
                  <strong>{{ selectedShiftDetails.employeeName || 'N/A' }}</strong>
                  <span class="text-muted">({{ selectedShiftDetails.employeeID || 'N/A' }})</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-4">
            <div class="shift-details-info-item">
              <div class="shift-details-info-icon">
                <i class="fas fa-calendar-day"></i>
              </div>
              <div class="shift-details-info-content">
                <label>Ngày làm việc</label>
                <div class="shift-details-info-value">
                  <strong>{{ selectedShiftDetails.workDateFormatted || (selectedShiftDetails.workDate ? formatDateForDisplay(selectedShiftDetails.workDate) : 'N/A') }}</strong>
                  <span class="text-muted">{{ selectedShiftDetails.workDate ? new Date(selectedShiftDetails.workDate).toLocaleDateString('vi-VN', { weekday: 'long' }) : '' }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-4">
            <div class="shift-details-info-item">
              <div class="shift-details-info-icon">
                <i class="fas fa-clock"></i>
              </div>
              <div class="shift-details-info-content">
                <label>Ca làm việc</label>
                <div class="shift-details-info-value">
                  <strong>{{ selectedShiftDetails.shiftName || 'N/A' }}</strong>
                  <span class="text-muted">{{ selectedShiftDetails.startTime || 'N/A' }} - {{ selectedShiftDetails.endTime || 'N/A' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Đổi ca làm việc -->
      <div class="shift-details-change-section" data-tour="change-shift-section">
        <div class="shift-details-change-header">
          <i class="fas fa-exchange-alt me-2"></i>
          <h6 class="mb-0">Đổi ca làm việc</h6>
        </div>
        <div class="shift-details-change-body">
          <label class="shift-details-label">
            <i class="fas fa-arrow-right me-2"></i>
            Chọn ca mới
          </label>
          <div class="shift-details-select-wrapper">
            <select 
              class="shift-details-select" 
              v-model="newShiftId"
              :disabled="isUpdatingShift"
            >
              <option value="">-- Chọn ca làm việc mới --</option>
              <option 
                v-for="shift in workshifts" 
                :key="shift.id" 
                :value="shift.id"
                :disabled="shift.id == selectedShiftDetails.shiftId"
              >
                {{ shift.shiftName }}
                <template v-if="shift.shiftDetails && shift.shiftDetails.length > 0">
                  ({{ shift.shiftDetails[0].startTime }} - {{ shift.shiftDetails[0].endTime }})
                </template>
              </option>
            </select>
          </div>
          
          <div class="shift-details-confirm-alert" v-if="newShiftId">
            <div class="shift-details-confirm-content">
              <i class="fas fa-check-circle shift-details-confirm-icon"></i>
              <div class="shift-details-confirm-text">
                <strong>Xác nhận đổi ca:</strong>
                <span>
                  Từ <strong>{{ selectedShiftDetails.shiftName }}</strong> 
                  sang <strong>{{ workshifts.find(s => s.id == newShiftId)?.shiftName }}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="shift-details-actions" data-tour="view-details-actions">
        <button 
          type="button" 
          class="shift-details-btn shift-details-btn-delete" 
          @click="openDeleteModal(selectedShiftDetails)"
        >
          <i class="fas fa-trash me-2"></i>
          Xóa phân ca
        </button>
        <button 
          type="button" 
          class="shift-details-btn shift-details-btn-cancel" 
          @click="closeViewDetailsModal"
        >
          <i class="fas fa-times me-2"></i>
          Đóng
        </button>
        <button 
          type="button" 
          class="shift-details-btn shift-details-btn-update" 
          @click="handleUpdateShift"
          :disabled="!newShiftId || isUpdatingShift"
        >
          <i v-if="isUpdatingShift" class="fas fa-spinner fa-spin me-2"></i>
          <i v-else class="fas fa-exchange-alt me-2"></i>
          {{ isUpdatingShift ? 'Đang đổi ca...' : 'Đổi ca' }}
        </button>
      </div>
    </div>
  </ModalDialog>

  <!-- Delete Confirmation Modal -->
  <ModalDialog 
    :show="showDeleteModal" 
    title="Xác nhận xóa phân ca"
    size="sm"
    @update:show="showDeleteModal = $event"
  >
    <div class="p-4" v-if="shiftToDelete">
      <div class="text-center mb-4">
        <i class="fas fa-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
        <h5 class="mt-3">Bạn có chắc chắn muốn xóa phân ca này?</h5>
        <p class="text-muted">
          <strong>{{ shiftToDelete.employeeName || 'N/A' }}</strong> - 
          <strong>{{ shiftToDelete.shiftName || 'N/A' }}</strong><br>
          Ngày: <strong>{{ shiftToDelete.workDateFormatted || (shiftToDelete.workDate ? formatDateForDisplay(shiftToDelete.workDate) : 'N/A') }}</strong>
        </p>
      </div>

      <div class="d-flex justify-content-end gap-2">
        <button 
          type="button" 
          class="btn btn-outline-secondary rounded-pill px-4" 
          @click="closeDeleteModal"
        >
          <i class="fas fa-times me-1"></i>
          Hủy
        </button>
        <button 
          type="button" 
          class="btn btn-danger rounded-pill px-4" 
          @click="handleDeleteShift"
        >
          <i class="fas fa-trash me-1"></i>
          Xóa
        </button>
      </div>
    </div>
  </ModalDialog>

  <!-- Delete Warning Modal -->
  <ModalDialog 
    :show="showDeleteWarningModal" 
    title="Không thể xóa phân ca"
    size="lg"
    @update:show="showDeleteWarningModal = $event"
  >
    <div class="p-4">
      <div class="alert alert-warning border-0 mb-4">
        <div class="d-flex align-items-center">
          <i class="fas fa-exclamation-triangle me-3" style="font-size: 2rem;"></i>
          <div>
            <h6 class="mb-1 fw-bold">Không thể xóa phân ca</h6>
            <p class="mb-0">
              <strong>{{ deleteWarningData.employeeName }}</strong> - Ngày <strong>{{ deleteWarningData.workDate }}</strong>
            </p>
            <p class="mb-0 mt-2">
              <span v-if="deleteWarningData.attendanceRecords.length > 0">
                Đã có <strong>{{ deleteWarningData.attendanceRecords.length }}</strong> dữ liệu chấm công
              </span>
              <span v-if="deleteWarningData.attendanceRecords.length > 0 && deleteWarningData.leaveRequests.length > 0"> và </span>
              <span v-if="deleteWarningData.leaveRequests.length > 0">
                <strong>{{ deleteWarningData.leaveRequests.length }}</strong> đơn nghỉ phép
              </span>
              <span v-if="deleteWarningData.attendanceRecords.length > 0 || deleteWarningData.leaveRequests.length > 0"> cho ngày này.</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Bảng dữ liệu chấm công -->
      <div v-if="deleteWarningData.attendanceRecords.length > 0" class="mb-4">
        <h6 class="mb-3 fw-bold">
          <i class="fas fa-fingerprint me-2 text-primary"></i>
          Dữ liệu chấm công
        </h6>
        <DataTable 
          :columns="attendanceColumns" 
          :data="deleteWarningData.attendanceRecords"
        />
      </div>

      <!-- Bảng đơn nghỉ phép -->
      <div v-if="deleteWarningData.leaveRequests.length > 0">
        <h6 class="mb-3 fw-bold">
          <i class="fas fa-calendar-times me-2 text-primary"></i>
          Đơn nghỉ phép
        </h6>
        <DataTable 
          :columns="leaveRequestColumns" 
          :data="deleteWarningData.leaveRequests"
        />
      </div>

      <div class="d-flex justify-content-end gap-2 mt-4">
        <button 
          type="button" 
          class="btn btn-primary rounded-pill px-4" 
          @click="closeDeleteWarningModal"
        >
          <i class="fas fa-check me-1"></i>
          Đã hiểu
        </button>
      </div>
    </div>
  </ModalDialog>

  <!-- Bulk Assign Shift Modal -->
  <ModalDialog 
    :show="showBulkAssignModal" 
    title="Phân ca hàng loạt"
    size="xl"
    @update:show="showBulkAssignModal = $event"
    data-tour="bulk-assign-modal"
  >
    <div class="p-4" v-if="selectedShiftForBulk">
      <!-- Selected Shift Info -->
      <div class="card border-0 shadow-sm mb-4 bulk-modal-card" data-tour="bulk-shift-info">
        <div class="card-header bulk-card-header">
          <h6 class="mb-0 fw-semibold text-white">
            <i class="fas fa-clock me-2"></i>
            Ca làm việc được chọn
          </h6>
        </div>
        <div class="card-body">
          <div class="row align-items-center">
            <div class="col-md-8">
              <h6 class="fw-bold mb-2 text-dark">{{ selectedShiftForBulk.name }}</h6>
              <div class="d-flex flex-wrap gap-3">
                <span class="badge bulk-badge-secondary">
                  <i class="fas fa-tag me-1"></i>
                  CA-{{ selectedShiftForBulk.code }}
                </span>
                <span class="badge bulk-badge-secondary">
                  <i class="fas fa-clock me-1"></i>
                  {{ selectedShiftForBulk.in }} - {{ selectedShiftForBulk.out }}
                </span>
              </div>
            </div>
            <div class="col-md-4 text-end">
              <div class="d-inline-flex align-items-center bulk-badge-primary rounded-pill px-3 py-2">
                <i class="fas fa-users me-2"></i>
                <span class="fw-semibold text-white">{{ selectedShiftForBulk.employeeCount || 0 }}</span>
                <span class="text-white ms-1 small">nhân viên</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Date Range Selection -->
      <div class="card border-0 shadow-sm mb-4 bulk-modal-card" data-tour="bulk-date-range">
        <div class="card-header bulk-card-header">
          <h6 class="mb-0 fw-semibold text-white">
            <i class="fas fa-calendar-range me-2"></i>
            Chọn khoảng thời gian
          </h6>
        </div>
        <div class="card-body">
          <!-- Apply to all option -->
          <div class="mb-4">
            <div class="form-check form-switch bulk-switch">
              <input 
                class="form-check-input bulk-switch-input" 
                type="checkbox" 
                id="applyToAll"
                v-model="applyToAll"
              />
              <label class="form-check-label fw-semibold text-dark" for="applyToAll">
                <i class="fas fa-users me-2 text-primary"></i>
                Áp dụng cùng khoảng thời gian cho tất cả nhân viên
              </label>
            </div>
            <small class="text-muted">
              <i class="fas fa-info-circle me-1"></i>
              Tắt để chọn khoảng thời gian riêng cho từng nhân viên
            </small>
          </div>

          <!-- Global date range (only show if apply to all) -->
          <div v-if="applyToAll">
            <div class="row">
              <div class="col-md-6">
                <label class="form-label fw-semibold text-dark">Từ ngày</label>
                <input 
                  type="date" 
                  class="form-control bulk-date-input" 
                  v-model="bulkStartDate"
                  :min="new Date().toISOString().split('T')[0]"
                />
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold text-dark">Đến ngày</label>
                <input 
                  type="date" 
                  class="form-control bulk-date-input" 
                  v-model="bulkEndDate"
                  :min="bulkStartDate || new Date().toISOString().split('T')[0]"
                />
              </div>
            </div>
            
            <div v-if="bulkStartDate && bulkEndDate" class="mt-3">
              <div class="alert bulk-alert-info border-0">
                <div class="d-flex align-items-center">
                  <i class="fas fa-info-circle me-2"></i>
                  <div>
                    <strong>Thông tin phân ca:</strong><br>
                    <span class="text-dark">
                      Sẽ tạo {{ selectedEmployees.length }} nhân viên × 
                      {{ Math.ceil((new Date(bulkEndDate) - new Date(bulkStartDate)) / (1000 * 60 * 60 * 24)) + 1 }} ngày = 
                      <strong class="text-primary">{{ selectedEmployees.length * (Math.ceil((new Date(bulkEndDate) - new Date(bulkStartDate)) / (1000 * 60 * 60 * 24)) + 1) }} phân ca</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Individual date ranges info (only show if not apply to all) -->
          <div v-else class="alert bulk-alert-info border-0">
            <div class="d-flex align-items-center">
              <i class="fas fa-info-circle me-2"></i>
              <div>
                <strong>Chế độ phân ca riêng lẻ:</strong><br>
                <span class="text-dark">
                  Mỗi nhân viên sẽ có khoảng thời gian riêng. 
                  Vui lòng chọn nhân viên và nhập khoảng thời gian cho từng người.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Employee Selection -->
      <div class="card border-0 shadow-sm mb-4 bulk-modal-card" data-tour="bulk-employee-selection">
        <div class="card-header bulk-card-header">
          <h6 class="mb-0 fw-semibold text-white">
            <i class="fas fa-users me-2"></i>
            Chọn nhân viên
          </h6>
        </div>
        <div class="card-body">
          <!-- Filters -->
          <div class="row mb-3">
            <div class="col-md-4">
              <label class="form-label fw-semibold text-dark">Tìm kiếm nhân viên</label>
              <div class="input-group bulk-input-group">
                <span class="input-group-text bulk-input-addon">
                  <i class="fas fa-search"></i>
                </span>
                <input 
                  type="text" 
                  class="form-control bulk-input" 
                  v-model="employeeSearchTerm"
                  placeholder="Tên hoặc mã nhân viên..."
                />
              </div>
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold text-dark">Chức vụ</label>
              <div class="input-group bulk-input-group">
                <span class="input-group-text bulk-input-addon">
                  <i class="fas fa-briefcase"></i>
                </span>
                <select class="form-select bulk-input" v-model="selectedRole">
                  <option value="">Tất cả chức vụ</option>
                  <option v-for="role in uniqueRoles" :key="role" :value="role">
                    {{ role }}
                  </option>
                </select>
              </div>
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold text-dark">Giới tính</label>
              <div class="input-group bulk-input-group">
                <span class="input-group-text bulk-input-addon">
                  <i class="fas fa-user"></i>
                </span>
                <select class="form-select bulk-input" v-model="selectedGender">
                  <option value="">Tất cả giới tính</option>
                  <option v-for="gender in uniqueGenders" :key="gender" :value="gender">
                    {{ gender }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Selection Controls -->
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <span class="badge bulk-badge-primary me-2">
                Đã chọn: {{ selectedEmployees.length }} nhân viên
              </span>
              <span class="badge bulk-badge-secondary">
                Hiển thị: {{ filteredEmployees.length }} nhân viên
              </span>
            </div>
            <div>
              <button 
                class="btn bulk-btn-primary btn-sm me-2" 
                @click="selectAllFiltered"
                :disabled="filteredEmployees.length === 0"
              >
                <i class="fas fa-check-double me-1"></i>
                Chọn tất cả
              </button>
              <button 
                class="btn bulk-btn-secondary btn-sm" 
                @click="deselectAll"
                :disabled="selectedEmployees.length === 0"
              >
                <i class="fas fa-times me-1"></i>
                Bỏ chọn tất cả
              </button>
            </div>
          </div>

          <!-- Employee List -->
          <div class="employee-list" style="max-height: 400px; overflow-y: auto;">
            <div 
              v-for="employee in filteredEmployees" 
              :key="employee.employeeID"
              class="employee-item border rounded mb-3"
              :class="{ 
                'border-primary bg-light': isEmployeeSelected(employee),
                'employee-assigned-shift': getEmployeeShiftAssignmentInfo(employee, getWorkShiftId(selectedShiftForBulk))
              }"
            >
              <!-- Employee Info -->
              <div 
                class="d-flex align-items-center p-3"
                @click="handleEmployeeClick(employee)"
                style="cursor: pointer;"
              >
                <div class="form-check me-3" @click.stop>
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    :checked="isEmployeeSelected(employee)"
                    @click.stop
                    @change="handleCheckboxChange(employee, $event)"
                  />
                </div>
                <div class="flex-grow-1">
                  <h6 class="mb-1 fw-bold">{{ employee.employeeName }}</h6>
                  <small class="text-muted">
                    Mã: {{ employee.employeeCode }} | 
                    Chức vụ: {{ employee.roleName }} | 
                    Giới tính: {{ employee.gender }}
                  </small>
                  <!-- Hiển thị thông tin đã được phân ca -->
                  <div 
                    v-if="getEmployeeShiftAssignmentInfo(employee, getWorkShiftId(selectedShiftForBulk))"
                    class="mt-2"
                  >
                    <span class="badge bg-warning text-dark">
                      <i class="fas fa-info-circle me-1"></i>
                      Đã được phân từ {{ formatDateForDisplay(getEmployeeShiftAssignmentInfo(employee, getWorkShiftId(selectedShiftForBulk)).startDate.toISOString()) }} 
                      đến {{ formatDateForDisplay(getEmployeeShiftAssignmentInfo(employee, getWorkShiftId(selectedShiftForBulk)).endDate.toISOString()) }}
                    </span>
                  </div>
                </div>
                <div v-if="isEmployeeSelected(employee)" class="bulk-check-icon">
                  <i class="fas fa-check-circle fa-lg"></i>
                </div>
              </div>

              <!-- Individual Date Range (only show if selected and not apply to all) -->
              <div 
                v-if="isEmployeeSelected(employee) && !applyToAll" 
                class="border-top p-3 bg-light"
              >
                <div class="row align-items-end">
                  <div class="col-md-4">
                    <label class="form-label fw-semibold small text-dark">Từ ngày</label>
                    <input 
                      type="date" 
                      class="form-control form-control-sm bulk-date-input" 
                      v-model="employeeDateRanges[getEmployeeId(employee)].startDate"
                      :min="new Date().toISOString().split('T')[0]"
                    />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label fw-semibold small text-dark">Đến ngày</label>
                    <input 
                      type="date" 
                      class="form-control form-control-sm bulk-date-input" 
                      v-model="employeeDateRanges[getEmployeeId(employee)].endDate"
                      :min="employeeDateRanges[getEmployeeId(employee)].startDate || new Date().toISOString().split('T')[0]"
                    />
                  </div>
                  <div class="col-md-4">
                    <div v-if="employeeDateRanges[getEmployeeId(employee)].startDate && employeeDateRanges[getEmployeeId(employee)].endDate" class="text-center">
                      <span class="badge bulk-badge-primary">
                        <i class="fas fa-calendar-check me-1"></i>
                        {{ Math.ceil((new Date(employeeDateRanges[getEmployeeId(employee)].endDate) - new Date(employeeDateRanges[getEmployeeId(employee)].startDate)) / (1000 * 60 * 60 * 24)) + 1 }} phân ca
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="filteredEmployees.length === 0" class="text-center py-4 text-muted">
              <i class="fas fa-search fa-2x mb-2"></i>
              <p>Không tìm thấy nhân viên nào</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="d-flex justify-content-end gap-2" data-tour="bulk-actions">
        <button 
          type="button" 
          class="btn bulk-btn-cancel px-4" 
          @click="closeBulkAssignModal"
          :disabled="bulkAssignLoading"
        >
          <i class="fas fa-times me-1"></i>
          Hủy
        </button>
        <button 
          type="button" 
          class="btn bulk-btn-submit px-4" 
          @click="handleBulkAssign"
          :disabled="selectedEmployees.length === 0 || (applyToAll && (!bulkStartDate || !bulkEndDate)) || bulkAssignLoading"
        >
          <i v-if="bulkAssignLoading" class="fas fa-spinner fa-spin me-1"></i>
          <i v-else class="fas fa-calendar-plus me-1"></i>
          {{ bulkAssignLoading ? 'Đang phân ca...' : 'Xác nhận phân ca' }}
        </button>
      </div>
    </div>
  </ModalDialog>

  <!-- Change Shift Assignment Modal -->
  <ModalDialog 
    :show="showChangeShiftModal" 
    title="Đổi phân ca"
    size="lg"
    @update:show="showChangeShiftModal = $event"
    data-tour="change-shift-modal"
  >
    <div class="p-4" v-if="selectedHistoryItem">
      <!-- Current Assignment Info -->
      <div class="card border-0 shadow-sm mb-4" data-tour="current-assignment-info">
        <div class="card-header bg-white border-bottom">
          <h6 class="mb-0 fw-semibold text-dark">
            <i class="fas fa-info-circle me-2 text-primary"></i>
            Thông tin phân ca hiện tại
          </h6>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <div class="mb-3">
                <div class="d-flex align-items-center mb-2">
                  <i class="fas fa-user text-primary me-2"></i>
                  <span class="fw-semibold">Nhân viên:</span>
                  <span class="text-dark ms-2">{{ selectedHistoryItem.empName }}</span>
                </div>
                <div class="d-flex align-items-center mb-2">
                  <i class="fas fa-id-card text-primary me-2"></i>
                  <span class="fw-semibold">Mã nhân viên:</span>
                  <span class="text-dark ms-2">{{ selectedHistoryItem.empId }}</span>
                </div>
                <div class="d-flex align-items-center">
                  <i class="fas fa-building text-primary me-2"></i>
                  <span class="fw-semibold">Phòng ban:</span>
                  <span class="text-dark ms-2">{{ selectedHistoryItem.dept }}</span>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="mb-3">
                <div class="d-flex align-items-center mb-2">
                  <i class="fas fa-clock text-primary me-2"></i>
                  <span class="fw-semibold">Ca hiện tại:</span>
                  <span class="text-dark ms-2">{{ selectedHistoryItem.shiftName }}</span>
                </div>
                <div class="d-flex align-items-center mb-2">
                  <i class="fas fa-tag text-primary me-2"></i>
                  <span class="fw-semibold">Mã ca:</span>
                  <span class="text-dark ms-2">{{ selectedHistoryItem.shiftCode }}</span>
                </div>
                <div class="d-flex align-items-center">
                  <i class="fas fa-calendar text-primary me-2"></i>
                  <span class="fw-semibold">Thời gian:</span>
                  <span class="text-dark ms-2">{{ selectedHistoryItem.startDate }} - {{ selectedHistoryItem.endDate }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Date Range Form -->
      <div class="card border-light" data-tour="new-assignment-form">
        <div class="card-header bg-light">
          <h6 class="mb-0 fw-semibold text-dark">
            <i class="fas fa-edit me-2 text-muted"></i>
            Sửa khoảng thời gian
          </h6>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <label class="form-label fw-semibold">Từ ngày</label>
              <input 
                type="date" 
                class="form-control" 
                v-model="newStartDate"
                :min="new Date().toISOString().split('T')[0]"
              />
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Đến ngày</label>
              <input 
                type="date" 
                class="form-control" 
                v-model="newEndDate"
                :min="newStartDate || new Date().toISOString().split('T')[0]"
              />
            </div>
          </div>
          <div class="row mt-3">
            <div class="col-12">
              <div v-if="newStartDate && newEndDate" class="alert alert-info border-0">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Số ngày sẽ được phân:</strong> 
                {{ Math.ceil((new Date(newEndDate) - new Date(newStartDate)) / (1000 * 60 * 60 * 24)) + 1 }} ngày
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="d-flex justify-content-end gap-2 mt-4" data-tour="change-shift-actions">
        <button 
          type="button" 
          class="btn btn-outline-secondary px-4" 
          @click="closeChangeShiftModal"
          :disabled="changeShiftLoading"
        >
          <i class="fas fa-times me-1"></i>
          Hủy
        </button>
        <button 
          type="button" 
          class="btn btn-primary px-4 shadow-sm" 
          @click="handleChangeShift"
          :disabled="!newStartDate || !newEndDate || changeShiftLoading"
        >
          <i v-if="changeShiftLoading" class="fas fa-spinner fa-spin me-1"></i>
          <i v-else class="fas fa-edit me-1"></i>
          {{ changeShiftLoading ? 'Đang cập nhật...' : 'Xác nhận cập nhật' }}
        </button>
      </div>
    </div>
  </ModalDialog>
</template>

<style scoped>
.shift-tabs-bar {
  display: flex;
  gap: 8px;
}
.tab-bar-item {
  padding: 8px 24px;
  border-radius: 7px;
  font-size: 1rem;
  font-weight: 500;
  color: #222;
  background: #f5f7fa;
  cursor: pointer;
  border: none;
  transition: background 0.18s, color 0.18s;
}
.tab-bar-item.active {
  background: #e9ecef;
  color: #0d6efd;
}
.tab-bar-item:hover {
  background: #f0f6ff;
  color: #0d6efd;
}
.table-action-btn {
  background: none;
  border: none;
  color: #0d6efd;
  font-size: 1.15rem;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}
.table-action-btn.delete {
  color: #ff6b6b;
}
.table-action-btn:hover {
  background: #e9ecef;
}
.emp-id, .emp-name, .emp-title {
  display: block;
  font-size: 1rem;
  font-weight: 500;
  color: #222;
  text-align: left;
  padding: 2px 8px;
  white-space: nowrap;
}
.schedule-cell-blocks {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 110px;
  align-items: flex-start;
  justify-content: flex-start;
  position: relative;
}

.shift-block {
  background: #f0f6ff;
  border: 1px solid #cce3ff;
  border-radius: 6px;
  padding: 4px 8px;
  margin-bottom: 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 90px;
  text-align: center;
}

.shift-block .delete-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
  background: none !important;
  border: none !important;
  box-shadow: none !important;
}

.shift-block:hover .delete-btn {
  opacity: 1;
}
.shift-code {
  font-size: 0.95rem;
  font-weight: 600;
  color: #0d6efd;
  min-width: 56px;
  text-align: left;
}
.shift-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1976d2;
  margin-bottom: 2px;
  line-height: 1.2;
}

.shift-time {
  font-size: 0.75rem;
  color: #666;
  text-align: center;
  line-height: 1.1;
}
.quick-add-shift-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  color: #ffffff;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
  position: relative;
  overflow: hidden;
  margin-top: 2px;
}

.quick-add-shift-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.quick-add-shift-btn:hover::before {
  left: 100%;
}

.quick-add-shift-btn:hover {
  background: linear-gradient(135deg, #34495e 0%, #2980b9 100%);
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 16px rgba(52, 152, 219, 0.4);
}

.quick-add-shift-btn:active {
  transform: translateY(0) scale(1);
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
}

.quick-add-shift-btn i {
  position: relative;
  z-index: 1;
  transition: transform 0.3s ease;
}

.quick-add-shift-btn:hover i {
  transform: scale(1.1);
}

.employee-item {
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.employee-item:hover {
  border-color: #0d6efd !important;
  box-shadow: 0 2px 8px rgba(13, 110, 253, 0.15);
  transform: translateY(-1px);
}

.employee-item.border-primary {
  border-color: #0d6efd !important;
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.2);
}

.employee-item.bg-light {
  background-color: #f8f9fa !important;
}

.employee-item.employee-assigned-shift {
  border: 2px solid #ffc107 !important;
  background: linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%) !important;
  box-shadow: 0 1px 4px rgba(255, 193, 7, 0.15);
}

.employee-item.employee-assigned-shift:hover {
  border-color: #ffc107 !important;
  box-shadow: 0 2px 6px rgba(255, 193, 7, 0.2);
  transform: translateY(0);
}

.employee-list {
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  padding: 1rem;
  background-color: #fafbfc;
}

.form-check-input:checked {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.form-check-input:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

/* Bulk Assign Modal Styles - Using MainLayout color scheme */
.bulk-modal-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.bulk-modal-card:hover {
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.08) !important;
}

.bulk-card-header {
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  border: none;
  padding: 1rem 1.5rem;
  position: relative;
  overflow: hidden;
}

.bulk-card-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.6s ease;
}

.bulk-card-header:hover::before {
  left: 100%;
}

.bulk-card-header h6 {
  position: relative;
  z-index: 1;
}

.bulk-badge-primary {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: #ffffff;
  padding: 0.5rem 1rem;
  border: none;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(52, 152, 219, 0.2);
}

.bulk-badge-secondary {
  background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
  color: #ffffff;
  padding: 0.5rem 1rem;
  border: none;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(44, 62, 80, 0.15);
}

.bulk-input-group {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(44, 62, 80, 0.08);
  transition: all 0.3s ease;
}

.bulk-input-group:focus-within {
  box-shadow: 0 2px 6px rgba(52, 152, 219, 0.2);
  transform: translateY(0);
}

.bulk-input-addon {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: #ffffff;
  border: none;
  padding: 0.75rem 1rem;
  font-weight: 500;
}

.bulk-input {
  border: 1px solid #e0e0e0;
  border-left: none;
  padding: 0.75rem 1rem;
  transition: all 0.3s ease;
}

.bulk-input:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 0.2rem rgba(52, 152, 219, 0.15);
  outline: none;
}

.bulk-btn-primary {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(52, 152, 219, 0.2);
  position: relative;
  overflow: hidden;
}

.bulk-btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.bulk-btn-primary:hover::before {
  left: 100%;
}

.bulk-btn-primary:hover {
  background: linear-gradient(135deg, #2980b9 0%, #2c3e50 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(52, 152, 219, 0.3);
  color: #ffffff;
}

.bulk-btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(52, 152, 219, 0.2);
}

.bulk-btn-primary:disabled {
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.bulk-btn-secondary {
  background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(44, 62, 80, 0.15);
}

.bulk-btn-secondary:hover {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(44, 62, 80, 0.2);
  color: #ffffff;
}

.bulk-btn-secondary:active {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(44, 62, 80, 0.15);
}

.bulk-btn-secondary:disabled {
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.bulk-btn-cancel {
  background: #ffffff;
  color: #34495e;
  border: 2px solid #34495e;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.bulk-btn-cancel:hover {
  background: #34495e;
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(44, 62, 80, 0.2);
}

.bulk-btn-cancel:active {
  transform: translateY(0);
}

.bulk-btn-cancel:disabled {
  background: #f8f9fa;
  color: #95a5a6;
  border-color: #e0e0e0;
  cursor: not-allowed;
  transform: none;
}

.bulk-btn-submit {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(52, 152, 219, 0.2);
  position: relative;
  overflow: hidden;
}

.bulk-btn-submit::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.bulk-btn-submit:hover::before {
  left: 100%;
}

.bulk-btn-submit:hover {
  background: linear-gradient(135deg, #2980b9 0%, #2c3e50 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(52, 152, 219, 0.3);
  color: #ffffff;
}

.bulk-btn-submit:active {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(52, 152, 219, 0.2);
}

.bulk-btn-submit:disabled {
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.bulk-alert-info {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-left: 4px solid #3498db;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  box-shadow: 0 1px 3px rgba(52, 152, 219, 0.08);
}

.bulk-alert-info i {
  color: #3498db;
  font-size: 1.1rem;
}

.employee-item.border-primary {
  border-color: #3498db !important;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%) !important;
  box-shadow: 0 1px 4px rgba(52, 152, 219, 0.15);
}

.bulk-check-icon {
  color: #3498db;
  animation: checkPulse 0.5s ease;
}

@keyframes checkPulse {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.employee-item:hover {
  border-color: #3498db !important;
  box-shadow: 0 1px 4px rgba(52, 152, 219, 0.12);
  transform: translateY(0);
}

.form-check-input:checked {
  background-color: #3498db;
  border-color: #3498db;
}

.form-check-input:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 0.2rem rgba(52, 152, 219, 0.25);
}

/* Form Switch Styles */
.bulk-switch-input {
  width: 3rem;
  height: 1.5rem;
  background-color: #95a5a6;
  border: none;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.bulk-switch-input::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 1.25rem;
  height: 1.25rem;
  background-color: #ffffff;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.bulk-switch-input:checked {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  border-color: #3498db;
}

.bulk-switch-input:checked::before {
  left: calc(100% - 1.25rem - 2px);
  background-color: #ffffff;
}

.bulk-switch-input:focus {
  box-shadow: 0 0 0 0.2rem rgba(52, 152, 219, 0.25);
  border-color: #3498db;
  outline: none;
}

/* Date Input Styles */
.bulk-date-input {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  transition: all 0.3s ease;
  font-weight: 500;
}

.bulk-date-input:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 0.2rem rgba(52, 152, 219, 0.15);
  outline: none;
}

.bulk-date-input:hover {
  border-color: #3498db;
}

/* Quick Add Shift Modal Styles */
.quick-add-modal-content {
  padding: 1.5rem;
}

.quick-add-info-cards {
  margin-bottom: 2rem;
}

.quick-add-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.08);
  transition: all 0.2s ease;
  border: 1px solid rgba(52, 152, 219, 0.1);
  position: relative;
  overflow: hidden;
}

.quick-add-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  transition: width 0.3s ease;
}

.quick-add-card:hover {
  border-color: rgba(52, 152, 219, 0.3);
  box-shadow: 0 2px 12px rgba(52, 152, 219, 0.1);
}

.quick-add-card:hover::before {
  opacity: 0.08;
}

.quick-add-card-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
  transition: opacity 0.2s ease;
  position: relative;
  z-index: 1;
}

.quick-add-card-employee .quick-add-card-icon {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.2);
}

.quick-add-card-date .quick-add-card-icon {
  background: linear-gradient(135deg, #27ae60 0%, #16a085 100%);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(39, 174, 96, 0.2);
}

.quick-add-card-content {
  flex: 1;
  position: relative;
  z-index: 1;
}

.quick-add-card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
  transition: color 0.3s ease;
}

.quick-add-card-subtitle {
  font-size: 0.875rem;
  color: #7f8c8d;
  margin: 0;
  transition: color 0.3s ease;
}

.quick-add-card:hover .quick-add-card-title {
  color: #3498db;
}

.quick-add-form-section {
  margin-bottom: 1.5rem;
}

.quick-add-label {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.75rem;
  font-size: 1rem;
}

.quick-add-label i {
  color: #3498db;
}

.quick-add-select-wrapper {
  position: relative;
}

.quick-add-select {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid rgba(52, 152, 219, 0.2);
  border-radius: 10px;
  background: #ffffff;
  font-size: 1rem;
  color: #2c3e50;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%233498db' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 12px;
  padding-right: 2.5rem;
}

.quick-add-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.quick-add-select:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
  opacity: 0.6;
}

.quick-add-empty-message {
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%);
  border-left: 4px solid #ffc107;
  border-radius: 8px;
  color: #856404;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
}

.quick-add-confirm-alert {
  margin-bottom: 1rem;
  padding: 0.6rem 0.75rem;
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  border-left: 4px solid #28a745;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.1);
  animation: slideInDown 0.3s ease;
  max-width: 100%;
}

.quick-add-confirm-content {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}

.quick-add-confirm-icon {
  color: #28a745;
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.quick-add-confirm-text {
  flex: 1;
  min-width: 0;
}

.quick-add-confirm-text strong {
  color: #155724;
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.85rem;
}

.quick-add-confirm-text span {
  color: #155724;
  line-height: 1.4;
  font-size: 0.85rem;
  word-break: break-word;
}

.quick-add-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(52, 152, 219, 0.1);
}

.quick-add-btn {
  padding: 0.75rem 2rem;
  border-radius: 25px;
  font-weight: 600;
  font-size: 0.95rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-add-btn-cancel {
  background: #ffffff;
  color: #34495e;
  border: 2px solid #e0e0e0;
}

.quick-add-btn-cancel:hover {
  background: #f8f9fa;
  border-color: #bdc3c7;
}

.quick-add-btn-submit {
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.2);
}

.quick-add-btn-submit:hover:not(:disabled) {
  background: linear-gradient(135deg, #34495e 0%, #2980b9 100%);
  box-shadow: 0 3px 12px rgba(52, 152, 219, 0.3);
}

.quick-add-btn-submit:disabled {
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
  cursor: not-allowed;
  opacity: 0.7;
  transform: none;
}

/* Shift Details Modal Styles */
.shift-details-modal-content {
  padding: 1.25rem;
}

.shift-details-main-info {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid rgba(52, 152, 219, 0.1);
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.08);
}

.shift-details-info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0.75rem 0.5rem;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.shift-details-info-item:hover {
  background: rgba(52, 152, 219, 0.05);
}

.shift-details-info-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(52, 152, 219, 0.2);
}

.shift-details-info-content {
  width: 100%;
  text-align: center;
}

.shift-details-info-content label {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: #7f8c8d;
  margin-bottom: 0.4rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.shift-details-info-value {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  align-items: center;
}

.shift-details-info-value strong {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.3;
  word-break: break-word;
}

.shift-details-info-value .text-muted {
  font-size: 0.8rem;
  color: #7f8c8d;
  line-height: 1.2;
  word-break: break-word;
}

.shift-details-change-section {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 10px;
  border: 1px solid rgba(52, 152, 219, 0.1);
  overflow: hidden;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.08);
}

.shift-details-change-header {
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  color: #ffffff;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 0.95rem;
}

.shift-details-change-header i {
  font-size: 1rem;
}

.shift-details-change-body {
  padding: 1rem;
}

.shift-details-label {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.shift-details-label i {
  color: #3498db;
}

.shift-details-select-wrapper {
  position: relative;
}

.shift-details-select {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid rgba(52, 152, 219, 0.2);
  border-radius: 8px;
  background: #ffffff;
  font-size: 0.95rem;
  color: #2c3e50;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%233498db' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 12px;
  padding-right: 2.5rem;
}

.shift-details-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.shift-details-select:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
  opacity: 0.6;
}

.shift-details-confirm-alert {
  margin-top: 0.75rem;
  padding: 0.6rem 0.75rem;
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  border-left: 4px solid #28a745;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.1);
  animation: slideInDown 0.3s ease;
  max-width: 100%;
}

.shift-details-confirm-content {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}

.shift-details-confirm-icon {
  color: #28a745;
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.shift-details-confirm-text {
  flex: 1;
  min-width: 0;
}

.shift-details-confirm-text strong {
  color: #155724;
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.85rem;
}

.shift-details-confirm-text span {
  color: #155724;
  line-height: 1.4;
  font-size: 0.85rem;
  word-break: break-word;
}

.shift-details-actions {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(52, 152, 219, 0.1);
}

.shift-details-btn {
  padding: 0.6rem 1.5rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shift-details-btn-cancel {
  background: #ffffff;
  color: #34495e;
  border: 2px solid #e0e0e0;
}

.shift-details-btn-cancel:hover {
  background: #f8f9fa;
  border-color: #bdc3c7;
}

.shift-details-btn-update {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(243, 156, 18, 0.2);
}

.shift-details-btn-update:hover:not(:disabled) {
  background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
  box-shadow: 0 3px 12px rgba(243, 156, 18, 0.3);
}

.shift-details-btn-update:disabled {
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
  cursor: not-allowed;
  opacity: 0.7;
}

.shift-details-btn-delete {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.2);
}

.shift-details-btn-delete:hover {
  background: linear-gradient(135deg, #c0392b 0%, #a93226 100%);
  box-shadow: 0 3px 12px rgba(231, 76, 60, 0.3);
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

</style>