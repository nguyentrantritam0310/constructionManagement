<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import { useWorkShift } from '../../composables/useWorkShift'
import { useShiftAssignment } from '../../composables/useShiftAssignment'
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import { useEmployee } from '../../composables/useEmployee'
import UpdateButton from '@/components/common/UpdateButton.vue'
import ChangeStatusButton from '@/components/common/ChangeStatusButton.vue'
import ActionButton from '@/components/common/ActionButton.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'

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
  shiftSchedule,
  loading: shiftLoading,
  error: shiftError,
  fetchAllShiftAssignments,
  getShiftScheduleByWeek,
  formatShiftScheduleForDisplay,
  createShiftAssignment,
  updateShiftAssignment,
  deleteShiftAssignment
} = useShiftAssignment()

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

// Utility function to normalize date for comparison
const normalizeDate = (date) => {
  const normalizedDate = new Date(date)
  normalizedDate.setHours(0, 0, 0, 0)
  return normalizedDate
}

onMounted(async () => {
  await fetchWorkShifts()
  await fetchAllShiftAssignments()
  await fetchAllEmployees() // Load employees for bulk assign
  loadCurrentWeekSchedule() // Chỉ khởi tạo currentWeekStart, không gọi API
})

// Week filter controls
const currentWeekStart = ref(new Date())
const selectedDate = ref(new Date())

// Quick add shift modal
const showQuickAddModal = ref(false)
const quickAddEmployee = ref(null)
const quickAddDate = ref(null)
const quickAddShiftId = ref('')
const quickAddLoading = ref(false)

// View shift details modal
const showViewDetailsModal = ref(false)
const selectedShiftDetails = ref(null)
const isUpdatingShift = ref(false)

// Delete shift modal
const showDeleteModal = ref(false)
const shiftToDelete = ref(null)

// Bulk assign shift modal
const showBulkAssignModal = ref(false)
const selectedShiftForBulk = ref(null)
const selectedEmployees = ref([])
const bulkStartDate = ref('')
const bulkEndDate = ref('')
const bulkAssignLoading = ref(false)
const employeeSearchTerm = ref('')
const selectedRole = ref('')
const selectedGender = ref('')
const applyToAll = ref(true) // Option to apply same date range to all employees
const employeeDateRanges = ref({}) // Individual date ranges for each employee

// Change shift assignment modal state
const showChangeShiftModal = ref(false)
const selectedHistoryItem = ref(null)
const newStartDate = ref('')
const newEndDate = ref('')
const newShiftId = ref('')
const changeShiftLoading = ref(false)

// Initialize current week start (Monday)
const initCurrentWeekStart = () => {
  const today = new Date()
  const monday = new Date(today)
  const dayOfWeek = today.getDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Sunday = 0, Monday = 1
  monday.setDate(today.getDate() - daysToMonday)
  monday.setHours(0, 0, 0, 0)
  currentWeekStart.value = monday
}

// Load current week schedule
const loadCurrentWeekSchedule = () => {
  initCurrentWeekStart()
  // Data sẽ tự động update thông qua computed properties
}

// Load week schedule for specific date (filter from all assignments)
const loadWeekSchedule = async (weekStartDate) => {
  // Không cần gọi API nữa, chỉ filter từ data đã load
  // API call đã được thực hiện trong onMounted với fetchAllShiftAssignments()
}

// Navigate to previous week
const goToPreviousWeek = () => {
  const newWeekStart = new Date(currentWeekStart.value)
  newWeekStart.setDate(newWeekStart.getDate() - 7)
  currentWeekStart.value = newWeekStart
  // Data sẽ tự động update thông qua computed properties
}

// Navigate to next week
const goToNextWeek = () => {
  const newWeekStart = new Date(currentWeekStart.value)
  newWeekStart.setDate(newWeekStart.getDate() + 7)
  currentWeekStart.value = newWeekStart
  // Data sẽ tự động update thông qua computed properties
}

// Go to specific date
const goToSpecificDate = (date) => {
  const monday = new Date(date)
  const dayOfWeek = monday.getDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  monday.setDate(monday.getDate() - daysToMonday)
  monday.setHours(0, 0, 0, 0)
  currentWeekStart.value = monday
  // Data sẽ tự động update thông qua computed properties
}

// Format week display
const weekDisplayText = computed(() => {
  const start = new Date(currentWeekStart.value)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  
  return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`
})

// Quick add shift functions
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
    console.error('Error creating shift assignment:', error)
    showMessage('Có lỗi xảy ra khi phân ca', 'error')
  } finally {
    quickAddLoading.value = false
  }
}

// Get date from day index
const getDateFromDayIndex = (dayIndex) => {
  const monday = new Date(currentWeekStart.value)
  const targetDate = new Date(monday)
  targetDate.setDate(monday.getDate() + (dayIndex - 1))
  return targetDate
}

// View shift details
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

// Update shift assignment
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
    
    // Tìm thông tin ca mới
    const newShift = workshifts.value.find(s => s.id == newShiftId.value)
    if (!newShift) {
      showMessage('Không tìm thấy thông tin ca làm việc', 'error')
      return
    }

    // Tạo dữ liệu cập nhật
    const updateData = {
      id: selectedShiftDetails.value.id,
      employeeID: selectedShiftDetails.value.employeeID,
      workShiftID: parseInt(newShiftId.value),
      workDate: formatDateForAPI(selectedShiftDetails.value.workDate)
    }
    
    // Gọi API cập nhật (cần thêm hàm này vào composable)
    await updateShiftAssignment(updateData)
    
    // Refresh data
    await fetchAllShiftAssignments()
    
    // Cập nhật selectedShiftDetails với thông tin mới
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
    console.error('Error updating shift assignment:', error)
    showMessage('Có lỗi xảy ra khi đổi ca', 'error')
  } finally {
    isUpdatingShift.value = false
  }
}

// Delete shift
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
    await deleteShiftAssignment(shiftToDelete.value.id)
    await fetchAllShiftAssignments()
    closeDeleteModal()
    closeViewDetailsModal() // Đóng modal chi tiết nếu đang mở
    showMessage('Xóa phân ca thành công!', 'success')
  } catch (error) {
    console.error('Error deleting shift assignment:', error)
    showMessage('Có lỗi xảy ra khi xóa phân ca', 'error')
  }
}

// Go to today
const goToToday = () => {
  const today = new Date()
  goToSpecificDate(today)
}

// Bulk assign shift functions
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

// Open change shift modal
const openChangeShiftModal = (historyItem) => {
  selectedHistoryItem.value = historyItem
  // Điền sẵn thời gian hiện tại
  newStartDate.value = historyItem.startDate ? convertDisplayDateToInput(historyItem.startDate) : ''
  newEndDate.value = historyItem.endDate ? convertDisplayDateToInput(historyItem.endDate) : ''
  newShiftId.value = historyItem.workShiftID || ''
  showChangeShiftModal.value = true
}

// Convert display date (DD/MM/YYYY) to input date (YYYY-MM-DD)
const convertDisplayDateToInput = (displayDate) => {
  if (!displayDate || displayDate === 'N/A') return ''
  const [day, month, year] = displayDate.split('/')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

// Close change shift modal
const closeChangeShiftModal = () => {
  showChangeShiftModal.value = false
  selectedHistoryItem.value = null
  newStartDate.value = ''
  newEndDate.value = ''
  newShiftId.value = ''
}

// Handle change shift assignment
const handleChangeShift = async () => {
  if (!selectedHistoryItem.value) {
    showMessage('Không tìm thấy thông tin phân ca', 'error')
    return
  }

  if (!newStartDate.value || !newEndDate.value) {
    showMessage('Vui lòng chọn ngày bắt đầu và ngày kết thúc', 'warning')
    return
  }

  if (!newShiftId.value) {
    showMessage('Vui lòng chọn ca làm việc', 'warning')
    return
  }

  try {
    changeShiftLoading.value = true

    // Tìm và xóa các assignment cũ
    const oldAssignments = shiftAssignments.value.filter(assignment => 
      assignment.employeeID === selectedHistoryItem.value.employeeID &&
      assignment.workShiftID === selectedHistoryItem.value.workShiftID
    )

    // Xóa từng assignment cũ
    for (const assignment of oldAssignments) {
      await deleteShiftAssignment(assignment.id)
    }

    // Tạo các assignment mới
    const startDate = new Date(newStartDate.value)
    const endDate = new Date(newEndDate.value)
    const dates = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Tạo assignments mới
    const newAssignments = dates.map(date => ({
      employeeID: selectedHistoryItem.value.employeeID,
      workShiftID: newShiftId.value,
      workDate: formatDateForAPI(date)
    }))

    // Tạo từng assignment mới
    for (const assignment of newAssignments) {
      await createShiftAssignment(assignment)
    }

    // Refresh data
    await fetchAllShiftAssignments()

    closeChangeShiftModal()
    showMessage('Đổi phân ca thành công!', 'success')
  } catch (error) {
    console.error('Error changing shift assignment:', error)
    showMessage('Có lỗi xảy ra khi đổi phân ca', 'error')
  } finally {
    changeShiftLoading.value = false
  }
}

// Filter employees based on search criteria
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

// Get unique roles and genders for filter dropdowns
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

// Handle employee click (outside checkbox)
const handleEmployeeClick = (employee) => {
  console.log('Employee clicked:', employee.employeeName)
  toggleEmployeeSelection(employee)
}

// Handle checkbox change
const handleCheckboxChange = (employee, event) => {
  console.log('Checkbox changed:', employee.employeeName, event.target.checked)
  event.stopPropagation()
  toggleEmployeeSelection(employee)
}

// Toggle employee selection
const toggleEmployeeSelection = (employee) => {
  // Try different possible ID fields
  const employeeId = employee.employeeID || employee.id || employee.Id || employee.employeeId || employee.userId
  console.log('Toggling employee:', employee.employeeName, 'ID:', employeeId)
  console.log('Employee object keys:', Object.keys(employee))
  console.log('Current selected employees:', selectedEmployees.value.map(emp => emp.employeeName))
  
  const index = selectedEmployees.value.findIndex(emp => {
    const empId = emp.employeeID || emp.id || emp.Id || emp.employeeId || emp.userId
    return empId === employeeId
  })
  
  if (index > -1) {
    selectedEmployees.value.splice(index, 1)
    // Remove individual date range when deselecting
    delete employeeDateRanges.value[employeeId]
    console.log('Removed employee:', employee.employeeName)
  } else {
    selectedEmployees.value.push(employee)
    // Initialize individual date range when selecting
    if (!employeeDateRanges.value[employeeId]) {
      employeeDateRanges.value[employeeId] = {
        startDate: '',
        endDate: ''
      }
    }
    console.log('Added employee:', employee.employeeName)
  }
  
  console.log('Updated selected employees:', selectedEmployees.value.map(emp => emp.employeeName))
}

// Check if employee is selected
const isEmployeeSelected = (employee) => {
  // Try different possible ID fields
  const employeeId = employee.employeeID || employee.id || employee.Id || employee.employeeId || employee.userId
  
  const isSelected = selectedEmployees.value.some(emp => {
    const empId = emp.employeeID || emp.id || emp.Id || emp.employeeId || emp.userId
    return empId === employeeId
  })
  
  console.log(`Checking if ${employee.employeeName} (ID: ${employeeId}) is selected:`, isSelected)
  return isSelected
}

// Select all filtered employees
const selectAllFiltered = () => {
  selectedEmployees.value = [...filteredEmployees.value]
  // Initialize date ranges for all selected employees
  filteredEmployees.value.forEach(emp => {
    const employeeId = emp.employeeID || emp.id || emp.Id || emp.employeeId || emp.userId
    if (!employeeDateRanges.value[employeeId]) {
      employeeDateRanges.value[employeeId] = {
        startDate: '',
        endDate: ''
      }
    }
  })
}

// Deselect all employees
const deselectAll = () => {
  selectedEmployees.value = []
  employeeDateRanges.value = {}
}

// Handle bulk assign
const handleBulkAssign = async () => {
  if (!selectedShiftForBulk.value) {
    showMessage('Vui lòng chọn ca làm việc', 'warning')
    return
  }

  if (selectedEmployees.value.length === 0) {
    showMessage('Vui lòng chọn ít nhất một nhân viên', 'warning')
    return
  }

  // Debug: Log selected shift and employees
  console.log('Selected shift for bulk:', selectedShiftForBulk.value)
  console.log('Selected shift keys:', selectedShiftForBulk.value ? Object.keys(selectedShiftForBulk.value) : 'No shift selected')
  console.log('Selected employees for bulk:', selectedEmployees.value)

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

        // Create assignments for all employees with same date range
        for (const employee of selectedEmployees.value) {
          const employeeId = employee.employeeID || employee.id || employee.Id || employee.employeeId || employee.userId
          console.log('Employee ID for assignment:', employeeId, 'from employee:', employee)
          
          for (const date of dates) {
            const workShiftId = selectedShiftForBulk.value.code || selectedShiftForBulk.value.id || selectedShiftForBulk.value.workShiftID || selectedShiftForBulk.value.ID
            console.log('WorkShift ID detected:', workShiftId, 'from shift:', selectedShiftForBulk.value)
            
            const assignment = {
              employeeID: employeeId,
              workShiftID: workShiftId,
              workDate: formatDateForAPI(date)
            }
            console.log('Creating assignment for employee:', employee.employeeName, 'assignment:', assignment)
            assignments.push(assignment)
          }
        }
    } else {
      // Apply individual date ranges for each employee
      for (const employee of selectedEmployees.value) {
        const employeeId = employee.employeeID || employee.id || employee.Id || employee.employeeId || employee.userId
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

        // Generate dates for this employee
        const dates = []
        const currentDate = new Date(startDate)
        while (currentDate <= endDate) {
          dates.push(new Date(currentDate))
          currentDate.setDate(currentDate.getDate() + 1)
        }

        // Create assignments for this employee
        for (const date of dates) {
          const workShiftId = selectedShiftForBulk.value.code || selectedShiftForBulk.value.id || selectedShiftForBulk.value.workShiftID || selectedShiftForBulk.value.ID
          console.log('WorkShift ID detected:', workShiftId, 'from shift:', selectedShiftForBulk.value)
          
          const assignment = {
            employeeID: employeeId,
            workShiftID: workShiftId,
            workDate: formatDateForAPI(date)
          }
          console.log('Creating assignment for employee:', employee.employeeName, 'assignment:', assignment)
          assignments.push(assignment)
        }
      }
    }

    // Debug: Log assignments before sending
    console.log('Assignments to create:', assignments)
    
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
    
    // Create all assignments
    const promises = assignments.map(assignment => {
      console.log('Creating assignment:', assignment)
      return createShiftAssignment(assignment)
    })
    await Promise.all(promises)

    // Refresh data
    await fetchAllShiftAssignments()

    closeBulkAssignModal()
    showMessage(`Phân ca thành công!`, 'success')
  } catch (error) {
    console.error('Error bulk assigning shifts:', error)
    showMessage('Có lỗi xảy ra khi phân ca hàng loạt', 'error')
  } finally {
    bulkAssignLoading.value = false
  }
}
// Tab Ca làm việc
const shiftCurrentPage = ref(1)
const shiftItemsPerPage = ref(5)
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

    // Tìm giờ vào sớm nhất (min) và giờ ra trễ nhất (max)
    const earliestStart = startTimes.reduce((a, b) => a < b ? a : b)
    const latestEnd = endTimes.reduce((a, b) => a > b ? a : b)

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
const historyItemsPerPage = ref(5)
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
    // Tìm thông tin nhân viên
    const employee = employees.value.find(emp => 
      emp.employeeID === group.employeeID || 
      emp.id === group.employeeID || 
      emp.Id === group.employeeID ||
      emp.employeeId === group.employeeID ||
      emp.userId === group.employeeID
    )
    
    // Tìm thông tin ca làm việc
    const shift = workshifts.value.find(s => 
      s.id === group.workShiftID || 
      s.code === group.workShiftID
    )
    
    console.log('Finding shift for workShiftID:', group.workShiftID)
    console.log('Available workshifts:', workshifts.value)
    console.log('Found shift:', shift)
    
    // Sắp xếp ngày và tìm ngày bắt đầu/kết thúc
    const sortedDates = group.dates.sort()
    const startDate = sortedDates[0]
    const endDate = sortedDates[sortedDates.length - 1]
    
    return {
      stt: index + 1,
      empId: employee?.employeeCode || employee?.employeeID || 'N/A',
      empName: employee?.employeeName || 'N/A',
      dept: employee?.roleName || 'N/A',
      shiftCode: shift?.code ? `CA-${shift.code}` : 'N/A',
      shiftName: shift?.name || shift?.shiftName || 'N/A',
      startDate: formatDateForDisplay(startDate),
      endDate: formatDateForDisplay(endDate),
      // Thêm thông tin cần thiết cho việc đổi phân ca
      employeeID: group.employeeID,
      workShiftID: group.workShiftID
    }
  })
})
const paginatedHistoryData = computed(() => {
  const start = (historyCurrentPage.value - 1) * historyItemsPerPage.value
  return historyData.value.slice(start, start + historyItemsPerPage.value)
})

// Tab Nhân viên chưa phân ca
const unassignedCurrentPage = ref(1)
const unassignedItemsPerPage = ref(5)
const unassignedColumns = [
  { key: 'stt', label: 'STT' },
  { key: 'empId', label: 'Mã Nhân viên' },
  { key: 'empName', label: 'Tên Nhân viên' },
  { key: 'dept', label: 'Phòng ban' },
  { key: 'title', label: 'Chức danh' },
  { key: 'joinDate', label: 'Ngày vào làm' },
  { key: 'machineCode', label: 'Mã chấm công' }
]
const unassignedData = computed(() => {
  // Lấy danh sách nhân viên chưa được phân ca
  const assignedEmployeeIds = new Set(shiftAssignments.value.map(assignment => assignment.employeeID))
  
  return employees.value
    .filter(employee => {
      const employeeId = employee.employeeID || employee.id || employee.Id || employee.employeeId || employee.userId
      return !assignedEmployeeIds.has(employeeId)
    })
    .map((employee, index) => ({
      stt: index + 1,
      empId: employee.employeeCode || employee.employeeID || 'N/A',
      empName: employee.employeeName || 'N/A',
      dept: employee.roleName || 'N/A',
      title: employee.position || 'N/A',
      joinDate: formatDateForDisplay(employee.joinDate) || 'N/A',
      machineCode: employee.machineCode || 'N/A'
    }))
})
const paginatedUnassignedData = computed(() => {
  const start = (unassignedCurrentPage.value - 1) * unassignedItemsPerPage.value
  return unassignedData.value.slice(start, start + unassignedItemsPerPage.value)
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
            workDate: assignment.workDateFormatted,
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
const scheduleItemsPerPage = ref(5)
const paginatedScheduleData = computed(() => {
  const start = (scheduleCurrentPage.value - 1) * scheduleItemsPerPage.value
  return (scheduleData.value || []).slice(start, start + scheduleItemsPerPage.value)
})
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="shift-tabs-bar">
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
      <div class="d-flex gap-2">
        <!-- Refresh button moved to schedule filter -->
      </div>
    </div>
    
    <!-- Week Filter for Schedule Tab -->
    <div v-if="activeTab === 'schedule'" class="mb-3">
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

        <!-- Quick Actions - Left side -->
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
      <DataTable :columns="shiftColumns" :data="paginatedShiftData">
        <template #actions="{ item }">
          <div class="d-flex justify-content-start align-items-start gap-2">
          <ActionButton 
            type="outline-primary" 
            icon="fas fa-calendar-alt" 
            tooltip="Phân ca hàng loạt"
            @click="openBulkAssignModal(item)"
          ></ActionButton>
        </div>
      </template>
        
      </DataTable>
      <Pagination
        :totalItems="shiftData.length"
        :itemsPerPage="shiftItemsPerPage"
        :currentPage="shiftCurrentPage"
        @update:currentPage="shiftCurrentPage = $event"
      />
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
      <DataTable v-else :columns="scheduleColumns" :data="paginatedScheduleData">
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
          <div class="schedule-cell-blocks">
            <template v-if="item[`day${i}`] && item[`day${i}`].length">
              <div
                v-for="(shift, idx) in item[`day${i}`]"
                :key="idx"
                class="shift-block position-relative"
                @click="openViewDetailsModal(shift)"
                style="cursor: pointer;"
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
            
            <!-- Chỉ hiển thị nút + khi không có ca làm việc -->
            <button 
              v-else
              class="btn btn-success btn-sm rounded-pill"
              @click="openQuickAddModal(item, getDateFromDayIndex(i))"
              title="Thêm ca làm việc"
            >
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </template>
        
      </DataTable>
      <Pagination
        :totalItems="scheduleData.value?.length || 0"
        :itemsPerPage="scheduleItemsPerPage"
        :currentPage="scheduleCurrentPage"
        @update:currentPage="scheduleCurrentPage = $event"
      />
    </div>
    <div v-else-if="activeTab === 'history'">
      <DataTable :columns="historyColumns" :data="paginatedHistoryData">
        <template #actions="{ item }">
          <div class="d-flex justify-content-start gap-2">
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
      <Pagination
        :totalItems="historyData.length"
        :itemsPerPage="historyItemsPerPage"
        :currentPage="historyCurrentPage"
        @update:currentPage="historyCurrentPage = $event"
      />
    </div>
    <div v-else-if="activeTab === 'unassigned'">
      <DataTable :columns="unassignedColumns" :data="paginatedUnassignedData" />
      <Pagination
        :totalItems="unassignedData.length"
        :itemsPerPage="unassignedItemsPerPage"
        :currentPage="unassignedCurrentPage"
        @update:currentPage="unassignedCurrentPage = $event"
      />
    </div>
  </div>

  <!-- Quick Add Shift Modal -->
  <ModalDialog 
    :show="showQuickAddModal" 
    title="Thêm ca làm việc nhanh"
    size="lg"
    @update:show="showQuickAddModal = $event"
  >
    <div class="p-4">
      <div class="mb-4">
        <div class="row">
          <div class="col-md-6">
            <div class="card border-primary">
              <div class="card-body text-center">
                <i class="fas fa-user text-primary mb-2" style="font-size: 2rem;"></i>
                <h6 class="fw-bold mb-1">{{ quickAddEmployee?.empName }}</h6>
                <small class="text-muted">{{ quickAddEmployee?.empId }}</small>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card border-success">
              <div class="card-body text-center">
                <i class="fas fa-calendar-day text-success mb-2" style="font-size: 2rem;"></i>
                <h6 class="fw-bold mb-1">{{ quickAddDate?.toLocaleDateString('vi-VN') }}</h6>
                <small class="text-muted">{{ quickAddDate?.toLocaleDateString('vi-VN', { weekday: 'long' }) }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-4">
        <label class="form-label fw-semibold">
          <i class="fas fa-clock me-1"></i>
          Chọn ca làm việc
        </label>
        <select 
          class="form-select form-select-lg border-primary" 
          v-model="quickAddShiftId"
          :disabled="quickAddLoading"
        >
          <option value="">-- Chọn ca làm việc --</option>
          <option 
            v-for="shift in workshifts" 
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

      <div class="alert alert-info border-0" v-if="quickAddShiftId">
        <div class="d-flex align-items-center">
          <i class="fas fa-info-circle me-2"></i>
          <div>
            <strong>Xác nhận phân ca:</strong><br>
            <span class="text-muted">
              {{ quickAddEmployee?.empName }} sẽ làm ca 
              <strong>{{ workshifts.find(s => s.id == quickAddShiftId)?.shiftName }}</strong>
              vào ngày <strong>{{ quickAddDate?.toLocaleDateString('vi-VN') }}</strong>
            </span>
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-end gap-2 mt-4">
        <button 
          type="button" 
          class="btn btn-outline-secondary rounded-pill px-4" 
          @click="closeQuickAddModal"
          :disabled="quickAddLoading"
        >
          <i class="fas fa-times me-1"></i>
          Hủy
        </button>
        <button 
          type="button" 
          class="btn btn-primary rounded-pill px-4" 
          @click="handleQuickAddShift"
          :disabled="!quickAddShiftId || quickAddLoading"
        >
          <i v-if="quickAddLoading" class="fas fa-spinner fa-spin me-1"></i>
          <i v-else class="fas fa-check me-1"></i>
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
  >
    <div class="p-4" v-if="selectedShiftDetails">
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="card border-primary">
            <div class="card-body text-center">
              <i class="fas fa-user text-primary mb-2" style="font-size: 2rem;"></i>
              <h6 class="fw-bold mb-1">{{ selectedShiftDetails.employeeName || 'N/A' }}</h6>
              <small class="text-muted">Mã NV: {{ selectedShiftDetails.employeeID || 'N/A' }}</small>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card border-success">
            <div class="card-body text-center">
              <i class="fas fa-clock text-success mb-2" style="font-size: 2rem;"></i>
              <h6 class="fw-bold mb-1">{{ selectedShiftDetails.shiftName || 'N/A' }}</h6>
              <small class="text-muted">Mã ca: {{ selectedShiftDetails.shiftId || 'N/A' }}</small>
            </div>
          </div>
        </div>
      </div>

      <div class="row mb-4">
        <div class="col-md-6">
          <div class="card border-info">
            <div class="card-body text-center">
              <i class="fas fa-calendar-day text-info mb-2" style="font-size: 2rem;"></i>
              <h6 class="fw-bold mb-1">{{ selectedShiftDetails.workDateFormatted || 'N/A' }}</h6>
              <small class="text-muted">{{ selectedShiftDetails.workDate ? new Date(selectedShiftDetails.workDate).toLocaleDateString('vi-VN', { weekday: 'long' }) : 'N/A' }}</small>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card border-warning">
            <div class="card-body text-center">
              <i class="fas fa-clock text-warning mb-2" style="font-size: 2rem;"></i>
              <h6 class="fw-bold mb-1">{{ selectedShiftDetails.startTime || 'N/A' }} - {{ selectedShiftDetails.endTime || 'N/A' }}</h6>
              <small class="text-muted">Thời gian làm việc</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Đổi ca làm việc -->
      <div class="card border-warning">
        <div class="card-header bg-warning text-dark">
          <h6 class="mb-0 fw-bold">
            <i class="fas fa-exchange-alt me-2"></i>
            Đổi ca làm việc
          </h6>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <label class="form-label fw-semibold">
                <i class="fas fa-clock me-1"></i>
                Ca hiện tại
              </label>
              <div class="form-control-plaintext bg-light p-2 rounded">
                <strong>{{ selectedShiftDetails.shiftName || 'N/A' }}</strong><br>
                <small class="text-muted">{{ selectedShiftDetails.startTime || 'N/A' }} - {{ selectedShiftDetails.endTime || 'N/A' }}</small>
              </div>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">
                <i class="fas fa-arrow-right me-1"></i>
                Chọn ca mới
              </label>
              <select 
                class="form-select border-warning" 
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
          </div>
          
          <div class="mt-3" v-if="newShiftId">
            <div class="alert alert-success border-0">
              <div class="d-flex align-items-center">
                <i class="fas fa-check-circle me-2"></i>
                <div>
                  <strong>Xác nhận đổi ca:</strong><br>
                  <span class="text-muted">
                    Từ <strong>{{ selectedShiftDetails.shiftName }}</strong> 
                    sang <strong>{{ workshifts.find(s => s.id == newShiftId)?.shiftName }}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-end gap-2 mt-4">
        <button 
          type="button" 
          class="btn btn-outline-secondary rounded-pill px-4" 
          @click="closeViewDetailsModal"
        >
          <i class="fas fa-times me-1"></i>
          Đóng
        </button>
        <button 
          type="button" 
          class="btn btn-warning rounded-pill px-4" 
          @click="handleUpdateShift"
          :disabled="!newShiftId || isUpdatingShift"
        >
          <i v-if="isUpdatingShift" class="fas fa-spinner fa-spin me-1"></i>
          <i v-else class="fas fa-exchange-alt me-1"></i>
          {{ isUpdatingShift ? 'Đang đổi ca...' : 'Đổi ca' }}
        </button>
        <button 
          type="button" 
          class="btn btn-danger rounded-pill px-4" 
          @click="openDeleteModal(selectedShiftDetails)"
        >
          <i class="fas fa-trash me-1"></i>
          Xóa phân ca
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
          Ngày: <strong>{{ shiftToDelete.workDateFormatted || 'N/A' }}</strong>
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

  <!-- Bulk Assign Shift Modal -->
  <ModalDialog 
    :show="showBulkAssignModal" 
    title="Phân ca hàng loạt"
    size="xl"
    @update:show="showBulkAssignModal = $event"
  >
    <div class="p-4" v-if="selectedShiftForBulk">
      <!-- Selected Shift Info -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-white border-bottom">
          <h6 class="mb-0 fw-semibold text-dark">
            <i class="fas fa-clock me-2 text-primary"></i>
            Ca làm việc được chọn
          </h6>
        </div>
        <div class="card-body">
          <div class="row align-items-center">
            <div class="col-md-8">
              <h6 class="fw-semibold mb-2 text-dark">{{ selectedShiftForBulk.name }}</h6>
              <div class="d-flex flex-wrap gap-3">
                <span class="text-muted">
                  <i class="fas fa-tag me-1"></i>
                  CA-{{ selectedShiftForBulk.code }}
                </span>
                <span class="text-muted">
                  <i class="fas fa-clock me-1"></i>
                  {{ selectedShiftForBulk.in }} - {{ selectedShiftForBulk.out }}
                </span>
              </div>
            </div>
            <div class="col-md-4 text-end">
              <div class="d-inline-flex align-items-center bg-light rounded px-3 py-2">
                <i class="fas fa-users text-primary me-2"></i>
                <span class="fw-semibold text-dark">{{ selectedShiftForBulk.employeeCount || 0 }}</span>
                <span class="text-muted ms-1 small">nhân viên</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Date Range Selection -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-white border-bottom">
          <h6 class="mb-0 fw-semibold text-dark">
            <i class="fas fa-calendar-range me-2 text-primary"></i>
            Chọn khoảng thời gian
          </h6>
        </div>
        <div class="card-body">
          <!-- Apply to all option -->
          <div class="mb-4">
            <div class="form-check form-switch">
              <input 
                class="form-check-input" 
                type="checkbox" 
                id="applyToAll"
                v-model="applyToAll"
              />
              <label class="form-check-label fw-semibold" for="applyToAll">
                <i class="fas fa-users me-2"></i>
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
                <label class="form-label fw-semibold">Từ ngày</label>
                <input 
                  type="date" 
                  class="form-control" 
                  v-model="bulkStartDate"
                  :min="new Date().toISOString().split('T')[0]"
                />
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Đến ngày</label>
                <input 
                  type="date" 
                  class="form-control" 
                  v-model="bulkEndDate"
                  :min="bulkStartDate || new Date().toISOString().split('T')[0]"
                />
              </div>
            </div>
            
            <div v-if="bulkStartDate && bulkEndDate" class="mt-3">
              <div class="alert alert-info border-0">
                <div class="d-flex align-items-center">
                  <i class="fas fa-info-circle me-2"></i>
                  <div>
                    <strong>Thông tin phân ca:</strong><br>
                    <span class="text-muted">
                      Sẽ tạo {{ selectedEmployees.length }} nhân viên × 
                      {{ Math.ceil((new Date(bulkEndDate) - new Date(bulkStartDate)) / (1000 * 60 * 60 * 24)) + 1 }} ngày = 
                      <strong>{{ selectedEmployees.length * (Math.ceil((new Date(bulkEndDate) - new Date(bulkStartDate)) / (1000 * 60 * 60 * 24)) + 1) }} phân ca</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Individual date ranges info (only show if not apply to all) -->
          <div v-else class="alert alert-info border-0">
            <div class="d-flex align-items-center">
              <i class="fas fa-info-circle me-2"></i>
              <div>
                <strong>Chế độ phân ca riêng lẻ:</strong><br>
                <span class="text-muted">
                  Mỗi nhân viên sẽ có khoảng thời gian riêng. 
                  Vui lòng chọn nhân viên và nhập khoảng thời gian cho từng người.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Employee Selection -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-white border-bottom">
          <h6 class="mb-0 fw-semibold text-dark">
            <i class="fas fa-users me-2 text-primary"></i>
            Chọn nhân viên
          </h6>
        </div>
        <div class="card-body">
          <!-- Filters -->
          <div class="row mb-3">
            <div class="col-md-4">
              <label class="form-label fw-semibold text-dark">Tìm kiếm nhân viên</label>
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0">
                  <i class="fas fa-search text-muted"></i>
                </span>
                <input 
                  type="text" 
                  class="form-control border-start-0" 
                  v-model="employeeSearchTerm"
                  placeholder="Tên hoặc mã nhân viên..."
                />
              </div>
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold text-dark">Chức vụ</label>
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0">
                  <i class="fas fa-briefcase text-muted"></i>
                </span>
                <select class="form-select border-start-0" v-model="selectedRole">
                  <option value="">Tất cả chức vụ</option>
                  <option v-for="role in uniqueRoles" :key="role" :value="role">
                    {{ role }}
                  </option>
                </select>
              </div>
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold text-dark">Giới tính</label>
              <div class="input-group">
                <span class="input-group-text bg-light border-end-0">
                  <i class="fas fa-user text-muted"></i>
                </span>
                <select class="form-select border-start-0" v-model="selectedGender">
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
              <span class="badge bg-primary me-2">
                Đã chọn: {{ selectedEmployees.length }} nhân viên
              </span>
              <span class="badge bg-info">
                Hiển thị: {{ filteredEmployees.length }} nhân viên
              </span>
            </div>
            <div>
              <button 
                class="btn btn-outline-success btn-sm me-2" 
                @click="selectAllFiltered"
                :disabled="filteredEmployees.length === 0"
              >
                <i class="fas fa-check-double me-1"></i>
                Chọn tất cả
              </button>
              <button 
                class="btn btn-outline-warning btn-sm" 
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
              :class="{ 'border-primary bg-light': isEmployeeSelected(employee) }"
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
                </div>
                <div v-if="isEmployeeSelected(employee)" class="text-success">
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
                    <label class="form-label fw-semibold small">Từ ngày</label>
                    <input 
                      type="date" 
                      class="form-control form-control-sm" 
                      v-model="employeeDateRanges[employee.employeeID || employee.id || employee.Id || employee.employeeId || employee.userId].startDate"
                      :min="new Date().toISOString().split('T')[0]"
                    />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label fw-semibold small">Đến ngày</label>
                    <input 
                      type="date" 
                      class="form-control form-control-sm" 
                      v-model="employeeDateRanges[employee.employeeID || employee.id || employee.Id || employee.employeeId || employee.userId].endDate"
                      :min="employeeDateRanges[employee.employeeID || employee.id || employee.Id || employee.employeeId || employee.userId].startDate || new Date().toISOString().split('T')[0]"
                    />
                  </div>
                  <div class="col-md-4">
                    <div v-if="employeeDateRanges[employee.employeeID || employee.id || employee.Id || employee.employeeId || employee.userId].startDate && employeeDateRanges[employee.employeeID || employee.id || employee.Id || employee.employeeId || employee.userId].endDate" class="text-center">
                      <span class="badge bg-info">
                        <i class="fas fa-calendar-check me-1"></i>
                        {{ Math.ceil((new Date(employeeDateRanges[employee.employeeID || employee.id || employee.Id || employee.employeeId || employee.userId].endDate) - new Date(employeeDateRanges[employee.employeeID || employee.id || employee.Id || employee.employeeId || employee.userId].startDate)) / (1000 * 60 * 60 * 24)) + 1 }} phân ca
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
      <div class="d-flex justify-content-end gap-2">
        <button 
          type="button" 
          class="btn btn-outline-secondary px-4" 
          @click="closeBulkAssignModal"
          :disabled="bulkAssignLoading"
        >
          <i class="fas fa-times me-1"></i>
          Hủy
        </button>
        <button 
          type="button" 
          class="btn btn-primary px-4 shadow-sm" 
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
  >
    <div class="p-4" v-if="selectedHistoryItem">
      <!-- Current Assignment Info -->
      <div class="card border-0 shadow-sm mb-4">
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

      <!-- New Assignment Form -->
      <div class="card border-light">
        <div class="card-header bg-light">
          <h6 class="mb-0 fw-semibold text-dark">
            <i class="fas fa-edit me-2 text-muted"></i>
            Thông tin phân ca mới
          </h6>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <label class="form-label fw-semibold">Ca làm việc mới</label>
              <select class="form-select" v-model="newShiftId">
                <option value="">-- Chọn ca làm việc --</option>
                <option 
                  v-for="shift in workshifts" 
                  :key="shift.code || shift.id" 
                  :value="shift.code || shift.id"
                >
                  {{ shift.name || shift.shiftName }} ({{ shift.code ? `CA-${shift.code}` : shift.id }})
                </option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Từ ngày</label>
              <input 
                type="date" 
                class="form-control" 
                v-model="newStartDate"
                :min="new Date().toISOString().split('T')[0]"
              />
            </div>
          </div>
          <div class="row mt-3">
            <div class="col-md-6">
              <label class="form-label fw-semibold">Đến ngày</label>
              <input 
                type="date" 
                class="form-control" 
                v-model="newEndDate"
                :min="newStartDate || new Date().toISOString().split('T')[0]"
              />
            </div>
            <div class="col-md-6">
              <div v-if="newStartDate && newEndDate" class="mt-4">
                <div class="alert alert-info border-0">
                  <i class="fas fa-info-circle me-2"></i>
                  <strong>Số ngày sẽ được phân:</strong> 
                  {{ Math.ceil((new Date(newEndDate) - new Date(newStartDate)) / (1000 * 60 * 60 * 24)) + 1 }} ngày
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="d-flex justify-content-end gap-2 mt-4">
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
          :disabled="!newStartDate || !newEndDate || !newShiftId || changeShiftLoading"
        >
          <i v-if="changeShiftLoading" class="fas fa-spinner fa-spin me-1"></i>
          <i v-else class="fas fa-edit me-1"></i>
          {{ changeShiftLoading ? 'Đang đổi phân ca...' : 'Xác nhận đổi phân ca' }}
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
.btn-success.btn-sm {
  font-size: 1rem;
  padding: 8px 12px;
  margin-top: 2px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-success.btn-sm:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
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

</style>