<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import FormField from '../FormField.vue'
import ModalDialog from '../ModalDialog.vue'
import DataTable from '../DataTable.vue'
import { useEmployee } from '@/composables/useEmployee'
import { useAuth } from '@/composables/useAuth'
import { useOvertimeType } from '../../../composables/useOvertimeType.js'
import { useOvertimeForm } from '../../../composables/useOvertimeForm.js'
import { useOvertimeRequest } from '@/composables/useOvertimeRequest'
import { useLeaveRequest } from '@/composables/useLeaveRequest'
import { useShiftAssignment } from '@/composables/useShiftAssignment'
import { useWorkShift } from '@/composables/useWorkShift'
import { attendanceDataService } from '@/services/attendanceDataService'
import { isApprovedStatus } from '@/constants/status.js'

const props = defineProps({
  mode: { type: String, required: true, validator: v => ['create', 'update', 'detail'].includes(v) },
  overtime: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['close', 'submit', 'submit-for-approval'])

// Composables
const { employees, fetchAllEmployees } = useEmployee()
const { currentUser, isDirector, isHRManager, isHREmployee } = useAuth()
const { overtimeTypes, fetchOvertimeTypes } = useOvertimeType()
const { overtimeForms, fetchOvertimeForms } = useOvertimeForm()
const { overtimeRequests, fetchOvertimeRequests } = useOvertimeRequest()
const { leaveRequests, fetchLeaveRequests } = useLeaveRequest()
const { shiftAssignments, getShiftAssignmentsByDateRange } = useShiftAssignment()
const { workshifts, fetchWorkShifts } = useWorkShift()

// Form data
const formData = ref({
  voucherCode: props.overtime.voucherCode || '',
  employeeID: props.overtime.employeeID || '',
  overtimeTypeID: props.overtime.overtimeTypeID || '',
  overtimeFormID: props.overtime.overtimeFormID || '',
  coefficient: props.overtime.coefficient || '',
  startDateTime: props.overtime.startDateTime || '',
  endDateTime: props.overtime.endDateTime || '',
  reason: props.overtime.reason || ''
})

// Validation
const errors = ref({})
const overlappingOvertimeRequests = ref([])
const overlappingLeaveRequests = ref([])
const overlappingShiftTimes = ref([])
const attendanceData = ref([])

// Overlap confirmation modal state
const showOverlapModal = ref(false)
const overlapModalType = ref('') // 'leave', 'shift', or 'both'
const modalOverlappingLeaveRequests = ref([])
const modalOverlappingShiftTimes = ref([])

// Regex patterns cho validation
const regexPatterns = {
  // Số phiếu: chỉ cho phép chữ cái, số, dấu gạch ngang và gạch dưới, độ dài 1-50
  voucherCode: /^[A-Za-z0-9_-]{1,50}$/,
  // DateTime-local: định dạng YYYY-MM-DDTHH:mm
  dateTimeLocal: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
  // ID: chỉ số nguyên dương
  id: /^[1-9]\d*$/,
  // Hệ số: số thập phân dương (ví dụ: 1.5, 2.0, 0.5)
  coefficient: /^([1-9]\d*(\.\d{1,2})?|0\.\d{1,2}|0)$/,
  // Lý do: cho phép chữ, số, khoảng trắng, dấu câu, độ dài tối đa 500
  reason: /^[\s\S]{1,500}$/
}

// Computed property to get selected overtime type
const selectedOvertimeType = computed(() => {
  return overtimeTypes.value.find(type => type.id === formData.value.overtimeTypeID)
})

/**
 * Filter danh sách nhân viên dựa trên quyền của user hiện tại
 * - Director/HR Manager/HR Employee: Tất cả nhân viên
 * - Manager (Chỉ huy công trình): Bản thân + thợ
 * - Technician/Worker: Chỉ bản thân
 */
const availableEmployees = computed(() => {
  const userRole = currentUser.value?.role
  const userId = currentUser.value?.id
  
  if (!userId || !employees.value || employees.value.length === 0) {
    return employees.value || []
  }
  
  // Director, HR Manager, HR Employee: tất cả nhân viên
  if (isDirector.value || isHRManager.value || isHREmployee.value) {
    return employees.value
  }
  
  // Manager (Chỉ huy công trình): bản thân + thợ
  if (userRole === 'manager' || userRole === 'MANAGER' || userRole === '2') {
    return employees.value.filter(emp => {
      // Bản thân
      if (emp.id === userId) return true
      
      // Kiểm tra xem có phải thợ không (có thể check theo roleName hoặc role)
      const roleName = emp.roleName || emp.role || ''
      const roleNameLower = roleName.toLowerCase()
      const isWorker = roleNameLower.includes('thợ') || 
                       roleNameLower.includes('worker') ||
                       emp.role === 'worker' ||
                       emp.role === 'WORKER' ||
                       roleName === 'Nhân viên thợ'
      
      return isWorker
    })
  }
  
  // Technician/Worker: chỉ bản thân
  if (['technician', 'worker', 'TECHNICIAN', 'WORKER', '4', '1'].includes(userRole)) {
    return employees.value.filter(emp => emp.id === userId)
  }
  
  // Mặc định trả về tất cả (fallback)
  return employees.value
})

/**
 * Kiểm tra xem user có phải technician hoặc worker không
 */
const isRestrictedUser = computed(() => {
  const userRole = currentUser.value?.role
  return ['technician', 'worker', 'TECHNICIAN', 'WORKER', '4', '1'].includes(userRole)
})

// Watch for changes in overtimeTypeID to auto-set coefficient
watch(() => formData.value.overtimeTypeID, (newTypeID) => {
  if (newTypeID && selectedOvertimeType.value) {
    formData.value.coefficient = selectedOvertimeType.value.coefficient
    // Validate coefficient after auto-set
    if (formData.value.coefficient) {
      validateField('coefficient')
    }
  }
})

// Validation functions
const validateVoucherCode = () => {
  const value = formData.value.voucherCode?.trim()
  if (!value) {
    errors.value.voucherCode = 'Số phiếu không được để trống'
    return false
  }
  if (!regexPatterns.voucherCode.test(value)) {
    errors.value.voucherCode = 'Số phiếu chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới (tối đa 50 ký tự)'
    return false
  }
  errors.value.voucherCode = ''
  return true
}

const validateEmployeeID = () => {
  const value = formData.value.employeeID
  if (!value) {
    errors.value.employeeID = 'Nhân viên là bắt buộc'
    return false
  }
  
  // Kiểm tra nếu user bị giới hạn (technician/worker), chỉ được chọn bản thân
  if (isRestrictedUser.value && currentUser.value?.id) {
    if (value !== currentUser.value.id && String(value) !== String(currentUser.value.id)) {
      errors.value.employeeID = 'Bạn chỉ có thể tạo đơn tăng ca cho chính mình'
      // Tự động set lại về bản thân
      formData.value.employeeID = currentUser.value.id
      return false
    }
  }
  
  // Kiểm tra xem employeeID có trong danh sách available employees không
  const isAvailable = availableEmployees.value.some(emp => 
    emp.id === value || String(emp.id) === String(value)
  )
  if (!isAvailable) {
    errors.value.employeeID = 'Nhân viên không có trong danh sách cho phép'
    return false
  }
  
  errors.value.employeeID = ''
  return true
}

const validateOvertimeTypeID = () => {
  const value = formData.value.overtimeTypeID
  if (!value) {
    errors.value.overtimeTypeID = 'Loại tăng ca là bắt buộc'
    return false
  }
  if (!regexPatterns.id.test(String(value))) {
    errors.value.overtimeTypeID = 'Loại tăng ca không hợp lệ'
    return false
  }
  errors.value.overtimeTypeID = ''
  return true
}

const validateOvertimeFormID = () => {
  const value = formData.value.overtimeFormID
  if (!value) {
    errors.value.overtimeFormID = 'Hình thức tăng ca là bắt buộc'
    return false
  }
  if (!regexPatterns.id.test(String(value))) {
    errors.value.overtimeFormID = 'Hình thức tăng ca không hợp lệ'
    return false
  }
  errors.value.overtimeFormID = ''
  return true
}

const validateCoefficient = () => {
  const value = formData.value.coefficient
  if (value === null || value === undefined || value === '') {
    errors.value.coefficient = 'Hệ số không được để trống'
    return false
  }
  
  const coefficientNum = parseFloat(value)
  if (isNaN(coefficientNum)) {
    errors.value.coefficient = 'Hệ số phải là số'
    return false
  }
  
  if (coefficientNum <= 0) {
    errors.value.coefficient = 'Hệ số phải lớn hơn 0'
    return false
  }
  
  // Validate format: tối đa 2 chữ số thập phân
  const valueStr = String(value)
  if (!regexPatterns.coefficient.test(valueStr)) {
    errors.value.coefficient = 'Hệ số không đúng định dạng'
    return false
  }
  
  // Validate decimal places
  const decimalPlaces = (valueStr.split('.')[1] || '').length
  if (decimalPlaces > 2) {
    errors.value.coefficient = 'Hệ số chỉ được có tối đa 2 chữ số thập phân'
    return false
  }
  
  // Giới hạn hệ số (ví dụ: 0.01 đến 10.0)
  if (coefficientNum > 10) {
    errors.value.coefficient = 'Hệ số không được lớn hơn 10'
    return false
  }
  
  errors.value.coefficient = ''
  return true
}

const validateStartDateTime = () => {
  const value = formData.value.startDateTime
  if (!value) {
    errors.value.startDateTime = 'Ngày bắt đầu là bắt buộc'
    return false
  }
  if (!regexPatterns.dateTimeLocal.test(value)) {
    errors.value.startDateTime = 'Định dạng ngày giờ không hợp lệ'
    return false
  }
  
  const startDate = new Date(value)
  if (isNaN(startDate.getTime())) {
    errors.value.startDateTime = 'Ngày giờ bắt đầu không hợp lệ'
    return false
  }
  
  // Validate start date is before end date
  if (formData.value.endDateTime) {
    const endDate = new Date(formData.value.endDateTime)
    if (!isNaN(endDate.getTime()) && startDate >= endDate) {
      errors.value.startDateTime = 'Ngày bắt đầu phải trước ngày kết thúc'
      return false
    }
  }
  
  errors.value.startDateTime = ''
  return true
}

const validateEndDateTime = () => {
  const value = formData.value.endDateTime
  if (!value) {
    errors.value.endDateTime = 'Ngày kết thúc là bắt buộc'
    return false
  }
  if (!regexPatterns.dateTimeLocal.test(value)) {
    errors.value.endDateTime = 'Định dạng ngày giờ không hợp lệ'
    return false
  }
  
  const endDate = new Date(value)
  if (isNaN(endDate.getTime())) {
    errors.value.endDateTime = 'Ngày giờ kết thúc không hợp lệ'
    return false
  }
  
  // Validate end date is after start date
  if (formData.value.startDateTime) {
    const startDate = new Date(formData.value.startDateTime)
    if (!isNaN(startDate.getTime()) && startDate >= endDate) {
      errors.value.endDateTime = 'Ngày kết thúc phải sau ngày bắt đầu'
      return false
    }
    
    // Validate duration (không được quá 24 giờ trong một lần tăng ca)
    const durationMs = endDate - startDate
    const durationHours = durationMs / (1000 * 60 * 60)
    if (durationHours > 24) {
      errors.value.endDateTime = 'Thời gian tăng ca không được vượt quá 24 giờ'
      return false
    }
    if (durationHours <= 0) {
      errors.value.endDateTime = 'Thời gian tăng ca phải lớn hơn 0'
      return false
    }
  }
  
  errors.value.endDateTime = ''
  return true
}

const validateReason = () => {
  const value = formData.value.reason?.trim() || ''
  if (!value) {
    errors.value.reason = 'Lý do là bắt buộc'
    return false
  }
  if (value.length < 1 || value.length > 500) {
    errors.value.reason = 'Lý do phải từ 1 đến 500 ký tự'
    return false
  }
  errors.value.reason = ''
  return true
}

// Function to check for overlapping overtime requests
const checkOverlappingOvertimeRequests = (startDateTime, endDateTime, employeeID, excludeVoucherCode = null) => {
  if (!overtimeRequests.value || overtimeRequests.value.length === 0) {
    return []
  }
  
  const startDate = new Date(startDateTime)
  const endDate = new Date(endDateTime)
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return []
  }
  
  // Filter approved overtime requests for the same employee
  const approvedRequests = overtimeRequests.value.filter(request => 
    request.employeeID === employeeID && 
    isApprovedStatus(request.approveStatus) &&
    // Exclude current request when updating
    (!excludeVoucherCode || request.voucherCode !== excludeVoucherCode)
  )
  
  const overlapping = []
  
  approvedRequests.forEach(request => {
    const requestStart = new Date(request.startDateTime)
    const requestEnd = new Date(request.endDateTime)
    
    // Check if there's an overlap
    // Overlap exists if: (startDate <= requestEnd) && (endDate >= requestStart)
    if (startDate <= requestEnd && endDate >= requestStart) {
      // Get overtime form name
      const overtimeForm = overtimeForms.value.find(form => form.id === request.overtimeFormID)
      const overtimeFormName = overtimeForm ? overtimeForm.overtimeFormName : 'N/A'
      
      overlapping.push({
        voucherCode: request.voucherCode,
        startDateTime: request.startDateTime,
        endDateTime: request.endDateTime,
        overtimeFormName: overtimeFormName
      })
    }
  })
  
  return overlapping
}

/**
 * Kiểm tra overlap với đơn nghỉ phép đã duyệt
 * @param {String} startDateTime - Thời gian bắt đầu đơn tăng ca
 * @param {String} endDateTime - Thời gian kết thúc đơn tăng ca
 * @param {String} employeeID - ID nhân viên
 * @returns {Array} Danh sách đơn nghỉ phép trùng
 */
const checkOverlappingLeaveRequests = (startDateTime, endDateTime, employeeID) => {
  if (!leaveRequests.value || leaveRequests.value.length === 0 || !employeeID) {
    return []
  }
  
  const overtimeStart = new Date(startDateTime)
  const overtimeEnd = new Date(endDateTime)
  
  if (isNaN(overtimeStart.getTime()) || isNaN(overtimeEnd.getTime())) {
    return []
  }
  
  // Lọc đơn nghỉ phép đã duyệt của nhân viên
  const approvedLeaveRequests = leaveRequests.value.filter(request => 
    (request.employeeID === employeeID || String(request.employeeID) === String(employeeID)) && 
    isApprovedStatus(request.approveStatus)
  )
  
  const overlapping = []
  
  approvedLeaveRequests.forEach(request => {
    const leaveStart = new Date(request.startDateTime)
    const leaveEnd = new Date(request.endDateTime)
    
    // Kiểm tra overlap: chỉ cần có 1 khoảng trùng là đủ
    // Overlap exists if: (overtimeStart < leaveEnd) && (overtimeEnd > leaveStart)
    if (overtimeStart < leaveEnd && overtimeEnd > leaveStart) {
      overlapping.push({
        voucherCode: request.voucherCode,
        startDateTime: request.startDateTime,
        endDateTime: request.endDateTime,
        leaveTypeName: request.leaveTypeName || 'N/A'
      })
    }
  })
  
  return overlapping
}

/**
 * Kiểm tra overlap với ca làm việc có dữ liệu công hoặc đơn nghỉ phép
 * @param {String} startDateTime - Thời gian bắt đầu đơn tăng ca
 * @param {String} endDateTime - Thời gian kết thúc đơn tăng ca
 * @param {String} employeeID - ID nhân viên
 * @returns {Promise<Array>} Danh sách ca làm việc trùng
 */
const checkOverlappingShiftTimes = async (startDateTime, endDateTime, employeeID) => {
  if (!employeeID || !startDateTime || !endDateTime) {
    return []
  }
  
  const overtimeStart = new Date(startDateTime)
  const overtimeEnd = new Date(endDateTime)
  
  if (isNaN(overtimeStart.getTime()) || isNaN(overtimeEnd.getTime())) {
    return []
  }
  
  // Lấy các phân ca làm việc trong khoảng thời gian của đơn tăng ca
  const startDateOnly = new Date(overtimeStart)
  startDateOnly.setHours(0, 0, 0, 0)
  const endDateOnly = new Date(overtimeEnd)
  endDateOnly.setHours(23, 59, 59, 999)
  
  const shiftAssignmentsInRange = await getShiftAssignmentsByDateRange(
    startDateOnly.toISOString(),
    endDateOnly.toISOString()
  )
  
  // Lọc chỉ các phân ca của nhân viên hiện tại
  const employeeShiftAssignments = shiftAssignmentsInRange.filter(assignment => 
    (assignment.employeeID === employeeID || String(assignment.employeeID) === String(employeeID))
  )
  
  if (employeeShiftAssignments.length === 0) {
    return []
  }
  
  // Lấy thông tin nhân viên để lấy employeeCode
  const selectedEmployee = employees.value.find(emp => 
    emp.id === employeeID || 
    String(emp.id) === String(employeeID) ||
    emp.employeeCode === employeeID ||
    String(emp.employeeCode) === String(employeeID)
  )
  
  // EmployeeCode là field chính để identify employee trong attendance data
  // Employee.id trong DTO là string (như "worker1-id") và nó chính là EmployeeCode
  // Nếu không tìm thấy employee, fallback về employeeID
  const employeeCode = selectedEmployee?.id || selectedEmployee?.employeeCode || String(employeeID)
  
  console.log('=== CHECK OVERLAPPING SHIFT TIMES DEBUG ===')
  console.log('EmployeeID from form:', employeeID, typeof employeeID)
  console.log('Selected Employee:', selectedEmployee)
  console.log('EmployeeCode to match:', employeeCode, typeof employeeCode)
  
  // Lấy dữ liệu chấm công trong khoảng thời gian
  const attendanceInRange = await attendanceDataService.getAttendanceDataByDateRange(
    startDateOnly.toISOString().split('T')[0],
    endDateOnly.toISOString().split('T')[0]
  )
  
  console.log('Attendance data in range:', attendanceInRange.length, 'records')
  console.log('First attendance record:', attendanceInRange[0])
  
  // Lọc chỉ dữ liệu chấm công của nhân viên hiện tại
  // Attendance data sử dụng EmployeeCode (PascalCase) hoặc employeeCode (camelCase)
  const employeeAttendance = attendanceInRange.filter(att => {
    const attEmployeeCode = att.employeeCode || att.EmployeeCode
    const hasCheckInOut = att.checkInTime || att.CheckInTime || att.checkOutTime || att.CheckOutTime
    
    // So sánh employeeCode với nhiều cách khác nhau
    const matchesEmployee = attEmployeeCode && (
      String(attEmployeeCode) === String(employeeCode) ||
      String(attEmployeeCode) === String(employeeID) ||
      attEmployeeCode === employeeCode ||
      attEmployeeCode === employeeID
    )
    
    return matchesEmployee && hasCheckInOut
  })
  
  console.log('Filtered employee attendance:', employeeAttendance.length, 'records')
  console.log('Employee attendance records:', employeeAttendance)
  
  const overlapping = []
  
  // KIỂM TRA TẤT CẢ DỮ LIỆU CHẤM CÔNG TRONG KHOẢNG THỜI GIAN TĂNG CA
  // Không chỉ check những ca có shift assignment, mà check tất cả dữ liệu chấm công
  for (const att of employeeAttendance) {
    let attDate = null
    if (att.workDate) {
      attDate = new Date(att.workDate)
    } else if (att.WorkDate) {
      attDate = new Date(att.WorkDate)
    } else if (att.date) {
      attDate = new Date(att.date)
    }
    
    if (!attDate || isNaN(attDate.getTime())) {
      continue
    }
    
    // Lấy thời gian check-in và check-out từ dữ liệu chấm công
    const checkInTime = att.checkInTime || att.CheckInTime
    const checkOutTime = att.checkOutTime || att.CheckOutTime
    
    if (!checkInTime && !checkOutTime) {
      continue
    }
    
    // Tính thời gian bắt đầu và kết thúc của ca làm việc dựa trên check-in/out
    let attStartTime = null
    let attEndTime = null
    
    if (checkInTime) {
      // Parse checkInTime (có thể là TimeSpan string "HH:mm:ss" hoặc "HH:mm")
      const timeParts = String(checkInTime).split(':').map(Number)
      attStartTime = new Date(attDate)
      attStartTime.setHours(timeParts[0] || 0, timeParts[1] || 0, 0, 0)
    }
    
    if (checkOutTime) {
      // Parse checkOutTime
      const timeParts = String(checkOutTime).split(':').map(Number)
      attEndTime = new Date(attDate)
      attEndTime.setHours(timeParts[0] || 0, timeParts[1] || 0, 0, 0)
    } else if (checkInTime) {
      // Nếu chỉ có check-in, giả sử ca làm việc kết thúc sau 8 giờ
      const timeParts = String(checkInTime).split(':').map(Number)
      attEndTime = new Date(attDate)
      attEndTime.setHours((timeParts[0] || 0) + 8, timeParts[1] || 0, 0, 0)
    }
    
    // Kiểm tra overlap với đơn tăng ca
    // Overlap exists if: (overtimeStart < attEndTime) && (overtimeEnd > attStartTime)
    if (attStartTime && attEndTime) {
      const hasTimeOverlap = overtimeStart < attEndTime && overtimeEnd > attStartTime
      
      if (hasTimeOverlap) {
        const shiftName = att.shiftName || att.ShiftName || 'N/A'
        overlapping.push({
          workDate: attDate.toLocaleDateString('vi-VN'),
          shiftName: shiftName,
          startTime: attStartTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          endTime: attEndTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          hasAttendance: true,
          hasLeaveRequest: false,
          shiftAssignmentID: att.workShiftID || att.WorkShiftID || null
        })
      }
    }
  }
  
  // Kiểm tra từng phân ca (để check đơn nghỉ phép)
  for (const assignment of employeeShiftAssignments) {
    const workDate = new Date(assignment.workDate)
    const dayOfWeek = workDate.getDay()
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
    const currentDayName = dayNames[dayOfWeek]
    
    // Tìm thông tin ca làm việc
    const workShift = workshifts.value.find(shift => shift.id === assignment.workShiftID)
    if (!workShift || !workShift.shiftDetails) {
      continue
    }
    
    // Tìm thông tin ca cho ngày trong tuần
    const dayShiftDetail = workShift.shiftDetails.find(detail => 
      detail.dayOfWeek === currentDayName || detail.DayOfWeek === currentDayName
    )
    
    const startTime = dayShiftDetail?.startTime || dayShiftDetail?.StartTime || '00:00:00'
    const endTime = dayShiftDetail?.endTime || dayShiftDetail?.EndTime || '00:00:00'
    
    if (!dayShiftDetail || startTime === '00:00:00' || endTime === '00:00:00') {
      continue
    }
    
    // Tính toán thời gian ca làm việc trong ngày đó
    // Xử lý cả định dạng "hh:mm:ss" và "hh:mm"
    const parseTimeString = (timeStr) => {
      if (!timeStr) return { hours: 0, minutes: 0 }
      const parts = timeStr.split(':').map(Number)
      return { hours: parts[0] || 0, minutes: parts[1] || 0 }
    }
    
    const shiftStartTime = new Date(workDate)
    const startTimeParts = parseTimeString(startTime)
    shiftStartTime.setHours(startTimeParts.hours, startTimeParts.minutes, 0, 0)
    
    const shiftEndTime = new Date(workDate)
    const endTimeParts = parseTimeString(endTime)
    shiftEndTime.setHours(endTimeParts.hours, endTimeParts.minutes, 0, 0)
    
    // Kiểm tra overlap với đơn tăng ca
    // Overlap exists if: (overtimeStart < shiftEndTime) && (overtimeEnd > shiftStartTime)
    const hasTimeOverlap = overtimeStart < shiftEndTime && overtimeEnd > shiftStartTime
    
    if (!hasTimeOverlap) {
      continue
    }
    
    // Kiểm tra ca đó có đơn nghỉ phép đã duyệt trùng không
    const hasLeaveRequest = leaveRequests.value.some(request => {
      if ((request.employeeID !== employeeID && String(request.employeeID) !== String(employeeID)) ||
          !isApprovedStatus(request.approveStatus)) {
        return false
      }
      
      const leaveStart = new Date(request.startDateTime)
      const leaveEnd = new Date(request.endDateTime)
      
      // Kiểm tra đơn nghỉ phép có trùng với ngày và ca làm việc không
      return leaveStart <= shiftEndTime && leaveEnd >= shiftStartTime
    })
    
    // Nếu có overlap VÀ có đơn nghỉ phép → thêm vào danh sách trùng
    // (Attendance data đã được check ở trên rồi, không cần check lại ở đây)
    if (hasLeaveRequest) {
      console.log(`Found leave request overlap! Adding shift to overlapping list`)
      overlapping.push({
        workDate: workDate.toLocaleDateString('vi-VN'),
        shiftName: workShift.shiftName || workShift.ShiftName || 'N/A',
        startTime: startTime,
        endTime: endTime,
        hasAttendance: false,
        hasLeaveRequest: true,
        shiftAssignmentID: assignment.id
      })
    }
  }
  
  console.log(`Total overlapping shifts found: ${overlapping.length}`)
  return overlapping
}

// Real-time validation cho các trường input
const validateField = (fieldName) => {
  switch (fieldName) {
    case 'voucherCode':
      validateVoucherCode()
      break
    case 'employeeID':
      validateEmployeeID()
      break
    case 'overtimeTypeID':
      validateOvertimeTypeID()
      break
    case 'overtimeFormID':
      validateOvertimeFormID()
      break
    case 'coefficient':
      validateCoefficient()
      break
    case 'startDateTime':
      validateStartDateTime()
      // Re-validate end date when start date changes
      if (formData.value.endDateTime) {
        validateEndDateTime()
      }
      // Clear overlap error when time changes
      errors.value.overlap = ''
      errors.value.overlapLeave = ''
      errors.value.overlapShift = ''
      overlappingOvertimeRequests.value = []
      overlappingLeaveRequests.value = []
      overlappingShiftTimes.value = []
      break
    case 'endDateTime':
      validateEndDateTime()
      // Re-validate start date when end date changes
      if (formData.value.startDateTime) {
        validateStartDateTime()
      }
      // Clear overlap error when time changes
      errors.value.overlap = ''
      errors.value.overlapLeave = ''
      errors.value.overlapShift = ''
      overlappingOvertimeRequests.value = []
      overlappingLeaveRequests.value = []
      overlappingShiftTimes.value = []
      break
    case 'employeeID':
      validateEmployeeID()
      // Clear overlap error when employee changes
      errors.value.overlap = ''
      errors.value.overlapLeave = ''
      errors.value.overlapShift = ''
      overlappingOvertimeRequests.value = []
      overlappingLeaveRequests.value = []
      overlappingShiftTimes.value = []
      break
    case 'reason':
      validateReason()
      break
  }
}

// Validate toàn bộ form
const validateForm = () => {
  const validations = [
    validateVoucherCode(),
    validateEmployeeID(),
    validateOvertimeTypeID(),
    validateOvertimeFormID(),
    validateCoefficient(),
    validateStartDateTime(),
    validateEndDateTime(),
    validateReason()
  ]
  
  return validations.every(v => v === true)
}

const handleSubmit = async () => {
  // Validate form trước khi submit
  if (!validateForm()) {
    // Scroll đến trường đầu tiên có lỗi
    const firstErrorField = document.querySelector('.is-invalid')
    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
      firstErrorField.focus()
    }
    return
  }
  
  try {
    // Check for overlapping overtime requests
    const excludeVoucherCode = props.mode === 'update' ? formData.value.voucherCode : null
    const overtimeOverlaps = checkOverlappingOvertimeRequests(
      formData.value.startDateTime,
      formData.value.endDateTime,
      formData.value.employeeID,
      excludeVoucherCode
    )
    
    if (overtimeOverlaps.length > 0) {
      // Store overlapping requests for display
      overlappingOvertimeRequests.value = overtimeOverlaps
      
      // Set error message
      errors.value.overlap = `Đơn tăng ca này trùng với ${overtimeOverlaps.length} đơn tăng ca đã duyệt khác. Vui lòng kiểm tra lại thời gian.`
      
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    
    // Check for overlapping leave requests
    const leaveOverlaps = checkOverlappingLeaveRequests(
      formData.value.startDateTime,
      formData.value.endDateTime,
      formData.value.employeeID
    )
    
    // Check for overlapping shift times with attendance or leave requests
    console.log('=== CHECKING OVERLAPPING SHIFT TIMES ===')
    console.log('Start DateTime:', formData.value.startDateTime)
    console.log('End DateTime:', formData.value.endDateTime)
    console.log('Employee ID:', formData.value.employeeID)
    
    const shiftOverlaps = await checkOverlappingShiftTimes(
      formData.value.startDateTime,
      formData.value.endDateTime,
      formData.value.employeeID
    )
    
    console.log('Shift overlaps found:', shiftOverlaps.length)
    console.log('Leave overlaps found:', leaveOverlaps.length)
    
    // Show modal if there are overlaps (leave or shift)
    if (leaveOverlaps.length > 0 || shiftOverlaps.length > 0) {
      overlappingLeaveRequests.value = leaveOverlaps
      overlappingShiftTimes.value = shiftOverlaps
      modalOverlappingLeaveRequests.value = leaveOverlaps
      modalOverlappingShiftTimes.value = shiftOverlaps
      
      if (leaveOverlaps.length > 0 && shiftOverlaps.length > 0) {
        overlapModalType.value = 'both'
      } else if (leaveOverlaps.length > 0) {
        overlapModalType.value = 'leave'
      } else {
        overlapModalType.value = 'shift'
      }
      
      showOverlapModal.value = true
      return
    }
  } catch (error) {
    console.error('Error checking overlaps:', error)
    // Nếu có lỗi khi check overlap, vẫn cho phép submit (fallback)
    // Hoặc có thể show error message
  }
  
  // Clear all overlap errors if no overlaps
  errors.value.overlap = ''
  errors.value.overlapLeave = ''
  errors.value.overlapShift = ''
  overlappingOvertimeRequests.value = []
  overlappingLeaveRequests.value = []
  overlappingShiftTimes.value = []
  
  // Close modal if open
  showOverlapModal.value = false
  
  // Convert datetime-local to proper format for API
  // Use formatDateTimeToISO to preserve local time without UTC conversion
  const submitData = {
    ...formData.value,
    voucherCode: formData.value.voucherCode.trim(),
    reason: formData.value.reason.trim(),
    coefficient: parseFloat(formData.value.coefficient),
    startDateTime: formatDateTimeToISO(formData.value.startDateTime),
    endDateTime: formatDateTimeToISO(formData.value.endDateTime)
  }
  emit('submit', submitData)
}

const handleClose = () => {
  showOverlapModal.value = false
  emit('close')
}

const handleCloseOverlapModal = () => {
  showOverlapModal.value = false
}

// Computed properties for DataTable data
const leaveRequestsTableData = computed(() => {
  return modalOverlappingLeaveRequests.value.map((request, index) => ({
    id: request.voucherCode || index,
    voucherCode: request.voucherCode,
    leaveTypeName: request.leaveTypeName || 'N/A',
    startDateTime: new Date(request.startDateTime).toLocaleString('vi-VN'),
    endDateTime: new Date(request.endDateTime).toLocaleString('vi-VN')
  }))
})

const shiftTimesTableData = computed(() => {
  return modalOverlappingShiftTimes.value.map((shift, index) => ({
    id: shift.shiftAssignmentID || index,
    workDate: shift.workDate,
    shiftName: shift.shiftName,
    startTime: shift.startTime,
    endTime: shift.endTime,
    hasAttendance: shift.hasAttendance ? 'Có' : 'Không',
    hasLeaveRequest: shift.hasLeaveRequest ? 'Có' : 'Không',
    status: shift.hasAttendance ? 'Có dữ liệu chấm công' : (shift.hasLeaveRequest ? 'Có đơn nghỉ phép' : 'N/A')
  }))
})

// Columns for DataTable
const leaveRequestsColumns = computed(() => [
  { key: 'voucherCode', label: 'Số phiếu' },
  { key: 'leaveTypeName', label: 'Loại nghỉ phép' },
  { key: 'startDateTime', label: 'Từ ngày' },
  { key: 'endDateTime', label: 'Đến ngày' }
])

const shiftTimesColumns = computed(() => [
  { key: 'workDate', label: 'Ngày' },
  { key: 'shiftName', label: 'Ca làm việc' },
  { key: 'startTime', label: 'Giờ bắt đầu' },
  { key: 'endTime', label: 'Giờ kết thúc' },
  { key: 'status', label: 'Trạng thái' }
])

const handleSubmitForApproval = async () => {
  // Validate form trước khi submit
  if (!validateForm()) {
    // Scroll đến trường đầu tiên có lỗi
    const firstErrorField = document.querySelector('.is-invalid')
    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
      firstErrorField.focus()
    }
    return
  }
  
  // Check for overlapping overtime requests
  const excludeVoucherCode = props.mode === 'update' ? formData.value.voucherCode : null
  const overtimeOverlaps = checkOverlappingOvertimeRequests(
    formData.value.startDateTime,
    formData.value.endDateTime,
    formData.value.employeeID,
    excludeVoucherCode
  )
  
  if (overtimeOverlaps.length > 0) {
    // Store overlapping requests for display
    overlappingOvertimeRequests.value = overtimeOverlaps
    
    // Set error message
    errors.value.overlap = `Đơn tăng ca này trùng với ${overtimeOverlaps.length} đơn tăng ca đã duyệt khác. Vui lòng kiểm tra lại thời gian.`
    
    // Scroll to top to show error
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  
  // Check for overlapping leave requests
  const leaveOverlaps = checkOverlappingLeaveRequests(
    formData.value.startDateTime,
    formData.value.endDateTime,
    formData.value.employeeID
  )
  
  // Check for overlapping shift times with attendance or leave requests
  const shiftOverlaps = await checkOverlappingShiftTimes(
    formData.value.startDateTime,
    formData.value.endDateTime,
    formData.value.employeeID
  )
  
  // Show modal if there are overlaps (leave or shift)
  if (leaveOverlaps.length > 0 || shiftOverlaps.length > 0) {
    overlappingLeaveRequests.value = leaveOverlaps
    overlappingShiftTimes.value = shiftOverlaps
    modalOverlappingLeaveRequests.value = leaveOverlaps
    modalOverlappingShiftTimes.value = shiftOverlaps
    
    if (leaveOverlaps.length > 0 && shiftOverlaps.length > 0) {
      overlapModalType.value = 'both'
    } else if (leaveOverlaps.length > 0) {
      overlapModalType.value = 'leave'
    } else {
      overlapModalType.value = 'shift'
    }
    
    showOverlapModal.value = true
    return
  }
  
  // Clear all overlap errors if no overlaps
  errors.value.overlap = ''
  errors.value.overlapLeave = ''
  errors.value.overlapShift = ''
  overlappingOvertimeRequests.value = []
  overlappingLeaveRequests.value = []
  overlappingShiftTimes.value = []
  
  // Close modal if open
  showOverlapModal.value = false
  
  // Convert datetime-local to proper format for API
  // Use formatDateTimeToISO to preserve local time without UTC conversion
  const submitData = {
    ...formData.value,
    voucherCode: formData.value.voucherCode.trim(),
    reason: formData.value.reason.trim(),
    coefficient: parseFloat(formData.value.coefficient),
    startDateTime: formatDateTimeToISO(formData.value.startDateTime),
    endDateTime: formatDateTimeToISO(formData.value.endDateTime)
  }
  emit('submit-for-approval', submitData.voucherCode)
}

// Load data on mount
onMounted(async () => {
  try {
    await Promise.all([
      fetchAllEmployees(),
      fetchOvertimeTypes(),
      fetchOvertimeForms(),
      fetchOvertimeRequests(),
      fetchLeaveRequests(),
      fetchWorkShifts()
    ])
    
    // Auto-set employeeID cho technician/worker khi tạo mới
    if (props.mode === 'create' && isRestrictedUser.value && currentUser.value?.id) {
      formData.value.employeeID = currentUser.value.id
    }
    
    console.log('Loaded data:', {
      employees: employees.value,
      overtimeTypes: overtimeTypes.value,
      overtimeForms: overtimeForms.value,
      overtimeRequests: overtimeRequests.value,
      leaveRequests: leaveRequests.value,
      workshifts: workshifts.value,
      currentUser: currentUser.value,
      availableEmployeesCount: availableEmployees.value.length
    })
  } catch (error) {
    console.error('Error loading data:', error)
  }
})

// Helper function to convert date string to datetime-local format (YYYY-MM-DDTHH:mm)
// without timezone conversion issues
const formatDateTimeLocal = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  
  // Get local date components
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Helper function to convert datetime-local string to ISO string with local timezone offset
// This preserves the local time values by including timezone offset
const formatDateTimeToISO = (dateTimeLocalString) => {
  if (!dateTimeLocalString) return ''
  
  // datetime-local format is "YYYY-MM-DDTHH:mm"
  // Parse it as local time and format with timezone offset
  const date = new Date(dateTimeLocalString)
  if (isNaN(date.getTime())) return ''
  
  // Get timezone offset in minutes, convert to hours and minutes
  const offsetMinutes = date.getTimezoneOffset()
  const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60)
  const offsetMins = Math.abs(offsetMinutes) % 60
  const offsetSign = offsetMinutes <= 0 ? '+' : '-'
  const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`
  
  // Format date components
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  // Return ISO format with timezone offset: "YYYY-MM-DDTHH:mm:ss+HH:mm"
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetString}`
}

// Watch for changes in overtime prop
watch(() => props.overtime, (newOvertime) => {
  if (newOvertime && Object.keys(newOvertime).length > 0) {
    // Nếu là mode update và user bị giới hạn, đảm bảo employeeID không thay đổi
    let employeeID = newOvertime.employeeID || ''
    if (props.mode === 'update' && isRestrictedUser.value && currentUser.value?.id) {
      employeeID = currentUser.value.id
    }
    
    formData.value = {
      voucherCode: newOvertime.voucherCode || '',
      employeeID: employeeID,
      overtimeTypeID: newOvertime.overtimeTypeID || '',
      overtimeFormID: newOvertime.overtimeFormID || '',
      coefficient: newOvertime.coefficient || '',
      startDateTime: formatDateTimeLocal(newOvertime.startDateTime),
      endDateTime: formatDateTimeLocal(newOvertime.endDateTime),
      reason: newOvertime.reason || ''
    }
  }
}, { immediate: true })

// Watch currentUser để auto-set employeeID khi user thay đổi (nếu là restricted user)
watch(() => currentUser.value?.id, (newUserId) => {
  if (newUserId && isRestrictedUser.value && props.mode === 'create' && !formData.value.employeeID) {
    formData.value.employeeID = newUserId
  }
}, { immediate: true })
</script>
<template>
  <form @submit.prevent="handleSubmit">
    <!-- Overlap Error Alert - Overtime Requests -->
    <div v-if="errors.overlap" class="alert alert-danger mb-3">
      <i class="fas fa-exclamation-triangle me-2"></i>
      <strong>{{ errors.overlap }}</strong>
      <div v-if="overlappingOvertimeRequests.length > 0" class="mt-3">
        <strong>Danh sách đơn tăng ca trùng lặp:</strong>
        <ul class="list-group mt-2">
          <li 
            v-for="(request, index) in overlappingOvertimeRequests" 
            :key="index"
            class="list-group-item"
          >
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <strong>Số phiếu:</strong> {{ request.voucherCode }}<br>
                <strong>Hình thức:</strong> {{ request.overtimeFormName }}<br>
                <strong>Thời gian:</strong> 
                {{ new Date(request.startDateTime).toLocaleString('vi-VN') }} - 
                {{ new Date(request.endDateTime).toLocaleString('vi-VN') }}
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
    
    <!-- Overlap Error Alert - Leave Requests -->
    <div v-if="errors.overlapLeave" class="alert alert-danger mb-3">
      <i class="fas fa-exclamation-triangle me-2"></i>
      <strong>{{ errors.overlapLeave }}</strong>
      <div v-if="overlappingLeaveRequests.length > 0" class="mt-3">
        <strong>Danh sách đơn nghỉ phép trùng lặp:</strong>
        <ul class="list-group mt-2">
          <li 
            v-for="(request, index) in overlappingLeaveRequests" 
            :key="index"
            class="list-group-item"
          >
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <strong>Số phiếu:</strong> {{ request.voucherCode }}<br>
                <strong>Loại nghỉ phép:</strong> {{ request.leaveTypeName }}<br>
                <strong>Thời gian:</strong> 
                {{ new Date(request.startDateTime).toLocaleString('vi-VN') }} - 
                {{ new Date(request.endDateTime).toLocaleString('vi-VN') }}
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
    
    <!-- Overlap Error Alert - Shift Times -->
    <div v-if="errors.overlapShift" class="alert alert-danger mb-3">
      <i class="fas fa-exclamation-triangle me-2"></i>
      <strong>{{ errors.overlapShift }}</strong>
      <div v-if="overlappingShiftTimes.length > 0" class="mt-3">
        <strong>Danh sách ca làm việc trùng lặp:</strong>
        <ul class="list-group mt-2">
          <li 
            v-for="(shift, index) in overlappingShiftTimes" 
            :key="index"
            class="list-group-item"
          >
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <strong>Ngày:</strong> {{ shift.workDate }}<br>
                <strong>Ca làm việc:</strong> {{ shift.shiftName }}<br>
                <strong>Thời gian ca:</strong> {{ shift.startTime }} - {{ shift.endTime }}<br>
                <span v-if="shift.hasAttendance" class="badge bg-warning text-dark me-2">Có dữ liệu chấm công</span>
                <span v-if="shift.hasLeaveRequest" class="badge bg-info text-dark">Có đơn nghỉ phép</span>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
    
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Số phiếu <span class="text-danger">*</span></label>
        <input 
          type="text" 
          class="form-control" 
          :class="{ 'is-invalid': errors.voucherCode }"
          v-model="formData.voucherCode"
          @blur="validateField('voucherCode')"
          @input="validateField('voucherCode')"
          :disabled="props.mode === 'detail'"
          :readonly="props.mode === 'detail'"
          maxlength="50"
          placeholder="VD: TC-2024-001"
        />
        <div class="invalid-feedback">{{ errors.voucherCode }}</div>
      </div>
      <div class="col-md-6">
        <label class="form-label">Nhân viên <span class="text-danger">*</span></label>
        <select 
          class="form-select" 
          v-model="formData.employeeID" 
          :class="{ 'is-invalid': errors.employeeID }"
          @change="validateField('employeeID')"
          :disabled="props.mode === 'detail' || isRestrictedUser"
          :readonly="props.mode === 'detail' || isRestrictedUser"
        >
          <option value="">Chọn nhân viên</option>
          <option v-for="emp in availableEmployees" :key="emp.id" :value="emp.id">
            {{ emp.employeeName }}
          </option>
        </select>
        <div class="invalid-feedback">{{ errors.employeeID }}</div>
      </div>
    </div>
    <div class="row g-3">
      <div class="col-md-4">
        <label class="form-label">Loại tăng ca <span class="text-danger">*</span></label>
        <select 
          class="form-select" 
          v-model="formData.overtimeTypeID" 
          :class="{ 'is-invalid': errors.overtimeTypeID }"
          @change="validateField('overtimeTypeID')"
          :disabled="props.mode === 'detail'"
        >
          <option value="">Chọn loại tăng ca</option>
          <option v-for="type in overtimeTypes" :key="type.id" :value="type.id">
            {{ type.overtimeTypeName }}
          </option>
        </select>
        <div class="invalid-feedback">{{ errors.overtimeTypeID }}</div>
      </div>
      <div class="col-md-4">
        <label class="form-label">Hình thức tăng ca <span class="text-danger">*</span></label>
        <select 
          class="form-select" 
          v-model="formData.overtimeFormID" 
          :class="{ 'is-invalid': errors.overtimeFormID }"
          @change="validateField('overtimeFormID')"
          :disabled="props.mode === 'detail'"
        >
          <option value="">Chọn hình thức tăng ca</option>
          <option v-for="form in overtimeForms" :key="form.id" :value="form.id">
            {{ form.overtimeFormName }}
          </option>
        </select>
        <div class="invalid-feedback">{{ errors.overtimeFormID }}</div>
      </div>
      <div class="col-md-4">
        <label class="form-label">Hệ số <span class="text-danger">*</span></label>
        <input 
          type="number" 
          class="form-control" 
          :class="{ 'is-invalid': errors.coefficient }"
          v-model.number="formData.coefficient"
          @blur="validateField('coefficient')"
          @input="validateField('coefficient')"
          :disabled="props.mode === 'detail' || !!formData.overtimeTypeID"
          :readonly="props.mode === 'detail'"
          step="0.01"
          min="0.01"
          max="10"
          placeholder="1.0"
        />
        <div class="invalid-feedback">{{ errors.coefficient }}</div>
        <small v-if="formData.overtimeTypeID" class="form-text text-muted">
          Hệ số được tự động cập nhật từ loại tăng ca
        </small>
      </div>
    </div>
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Ngày bắt đầu <span class="text-danger">*</span></label>
        <input 
          type="datetime-local" 
          class="form-control" 
          :class="{ 'is-invalid': errors.startDateTime }"
          v-model="formData.startDateTime"
          @blur="validateField('startDateTime')"
          @change="validateField('startDateTime')"
          :disabled="props.mode === 'detail'"
          :readonly="props.mode === 'detail'"
        />
        <div class="invalid-feedback">{{ errors.startDateTime }}</div>
      </div>
      <div class="col-md-6">
        <label class="form-label">Ngày kết thúc <span class="text-danger">*</span></label>
        <input 
          type="datetime-local" 
          class="form-control" 
          :class="{ 'is-invalid': errors.endDateTime }"
          v-model="formData.endDateTime"
          @blur="validateField('endDateTime')"
          @change="validateField('endDateTime')"
          :disabled="props.mode === 'detail'"
          :readonly="props.mode === 'detail'"
        />
        <div class="invalid-feedback">{{ errors.endDateTime }}</div>
      </div>
    </div>
    <div class="row g-3">
      <div class="col-md-12">
        <label class="form-label">Lý do <span class="text-danger">*</span></label>
        <textarea 
          class="form-control" 
          :class="{ 'is-invalid': errors.reason }"
          v-model="formData.reason"
          @blur="validateField('reason')"
          @input="validateField('reason')"
          :disabled="props.mode === 'detail'"
          :readonly="props.mode === 'detail'"
          rows="3"
          maxlength="500"
          placeholder="Nhập lý do tăng ca (tối đa 500 ký tự)..."
        ></textarea>
        <div class="invalid-feedback">{{ errors.reason }}</div>
        <small class="form-text text-muted">{{ (formData.reason || '').length }}/500 ký tự</small>
      </div>
    </div>
    <div v-if="props.mode !== 'detail'" class="mt-4 d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-outline-secondary" @click="handleClose">Hủy</button>
      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ loading ? 'Đang xử lý...' : (props.mode === 'update' ? 'Cập nhật' : 'Tạo mới') }}
      </button>
      <!-- Show "Gửi duyệt" button only for update mode and when status is "Tạo mới" (0) -->
      <button 
        v-if="props.mode === 'update' && (props.overtime.approveStatus == 0 || props.overtime.approveStatus === '0')" 
        type="button" 
        class="btn btn-success" 
        @click="handleSubmitForApproval"
        :disabled="loading"
      >
        {{ loading ? 'Đang xử lý...' : 'Gửi duyệt' }}
      </button>
    </div>
    <div v-else class="mt-4 d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-outline-secondary" @click="handleClose">Đóng</button>
    </div>
  </form>
  
  <!-- Overlap Warning Modal -->
  <ModalDialog 
    v-model:show="showOverlapModal" 
    title="Cảnh báo: Trùng lặp với nghỉ phép hoặc dữ liệu công" 
    size="xl"
    scrollable
  >
    <div class="p-3">
      <div class="alert alert-danger mb-3">
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>Đơn tăng ca này trùng với đơn nghỉ phép đã duyệt hoặc ca làm việc đã có dữ liệu công. Không thể tạo đơn.</strong>
      </div>
      
      <!-- Leave Requests Table -->
      <div v-if="(overlapModalType === 'leave' || overlapModalType === 'both') && leaveRequestsTableData.length > 0" class="mb-4">
        <h6 class="mb-3">
          <i class="fas fa-calendar-times me-2"></i>
          Danh sách đơn nghỉ phép trùng lặp ({{ leaveRequestsTableData.length }})
        </h6>
        <DataTable 
          :columns="leaveRequestsColumns" 
          :data="leaveRequestsTableData"
        />
      </div>
      
      <!-- Shift Times Table -->
      <div v-if="(overlapModalType === 'shift' || overlapModalType === 'both') && shiftTimesTableData.length > 0">
        <h6 class="mb-3">
          <i class="fas fa-clock me-2"></i>
          Danh sách ca làm việc trùng lặp ({{ shiftTimesTableData.length }})
        </h6>
        <DataTable 
          :columns="shiftTimesColumns" 
          :data="shiftTimesTableData"
        />
      </div>
      
      <div class="alert alert-info mt-3 mb-0">
        <small>
          <i class="fas fa-info-circle me-1"></i>
          Vui lòng kiểm tra và điều chỉnh thời gian đơn tăng ca để tránh trùng lặp.
        </small>
      </div>
      
      <div class="d-flex justify-content-end gap-2 mt-3">
        <button type="button" class="btn btn-secondary" @click="handleCloseOverlapModal">
          Đóng
        </button>
      </div>
    </div>
  </ModalDialog>
</template>
