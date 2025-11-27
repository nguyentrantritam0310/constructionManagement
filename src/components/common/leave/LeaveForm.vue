<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import FormField from '../FormField.vue'
import ModalDialog from '../ModalDialog.vue'
import { useWorkShift } from '../../../composables/useWorkShift.js'
import { useLeaveType } from '../../../composables/useLeaveType.js'
import { useEmployee } from '@/composables/useEmployee'
import { useAuth } from '@/composables/useAuth'
import { useLeaveRequest } from '@/composables/useLeaveRequest'
import { useOvertimeRequest } from '@/composables/useOvertimeRequest'
import { useOvertimeForm } from '@/composables/useOvertimeForm'
import { useShiftAssignment } from '@/composables/useShiftAssignment'
import { attendanceDataService } from '@/services/attendanceDataService'
import { isApprovedStatus } from '@/constants/status.js'
import DataTable from '../DataTable.vue'

const props = defineProps({
    mode: { type: String, required: true, validator: v => ['create', 'update', 'detail'].includes(v) },
    leave: { type: Object, default: () => ({}) },
    employees: { type: Array, default: () => [] },
    leaveTypes: { type: Array, default: () => [] },
    workShifts: { type: Array, default: () => [] },
    currentUser: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['close', 'submit', 'submit-for-approval'])

// Composables
const { employees, fetchAllEmployees } = useEmployee()
const { currentUser, isDirector, isHRManager, isHREmployee } = useAuth()
const { workshifts, fetchWorkShifts } = useWorkShift()
const { leaveTypes, fetchLeaveTypes } = useLeaveType()
const { leaveRequests, fetchLeaveRequests } = useLeaveRequest()
const { overtimeRequests, fetchOvertimeRequests } = useOvertimeRequest()
const { overtimeForms, fetchOvertimeForms } = useOvertimeForm()
const { getShiftAssignmentsByDateRange } = useShiftAssignment()

// Form data
const formData = ref({
    voucherCode: props.leave.voucherCode || '',
    employeeID: props.leave.employeeID || '',
    leaveTypeID: props.leave.leaveTypeID || '',
    workShiftID: props.leave.workShiftID || '',
    startDateTime: props.leave.startDateTime || '',
    endDateTime: props.leave.endDateTime || '',
    reason: props.leave.reason || ''
})

// Validation
const errors = ref({})

// Available work shifts based on shift assignments
const availableWorkShifts = ref([])
const loadingShiftAssignments = ref(false)
const shiftAssignmentsInRange = ref([])

// Overlap confirmation modal state
const showOverlapConfirmModal = ref(false)
const overlappingRequests = ref([])
const overlappingOvertimeRequests = ref([])
const overlappingShiftTimes = ref([])
const overlapModalType = ref('') // 'leave', 'overtime', 'shift', or combinations
const pendingSubmitData = ref(null)

// Helper function to validate all days have shift assignments
const validateAllDaysHaveShifts = (startDate, endDate, assignments) => {
    const dates = new Set()
    assignments.forEach(assignment => {
        const assignmentDate = new Date(assignment.workDate)
        assignmentDate.setHours(0, 0, 0, 0)
        const dateString = assignmentDate.toDateString()
        dates.add(dateString)
    })
    
    const currentDate = new Date(startDate)
    currentDate.setHours(0, 0, 0, 0)
    const endDateNormalized = new Date(endDate)
    endDateNormalized.setHours(0, 0, 0, 0)
    
    while (currentDate <= endDateNormalized) {
        const dateString = currentDate.toDateString()
        if (!dates.has(dateString)) {
            return { valid: false, missingDate: new Date(currentDate) }
        }
        currentDate.setDate(currentDate.getDate() + 1)
    }
    return { valid: true }
}

// Function to fetch shift assignments and filter available work shifts
const fetchAvailableWorkShifts = async () => {
    // Reset available work shifts
    availableWorkShifts.value = []
    shiftAssignmentsInRange.value = []
    errors.value.workShiftID = ''
    
    // Check if we have all required fields
    if (!formData.value.employeeID || !formData.value.startDateTime || !formData.value.endDateTime) {
        return
    }
    
    try {
        loadingShiftAssignments.value = true
        
        // Parse dates
        const startDate = new Date(formData.value.startDateTime)
        const endDate = new Date(formData.value.endDateTime)
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return
        }
        
        // Format dates for API (YYYY-MM-DD)
        const formatDateForAPI = (date) => {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        }
        
        const startDateStr = formatDateForAPI(startDate)
        const endDateStr = formatDateForAPI(endDate)
        
        // Fetch shift assignments in date range
        const assignments = await getShiftAssignmentsByDateRange(startDateStr, endDateStr)
        
        // Filter assignments for the selected employee
        const employeeAssignments = assignments.filter(assignment => 
            assignment.employeeID === formData.value.employeeID
        )
        
        shiftAssignmentsInRange.value = employeeAssignments
        
        // Validate that all days in the range have shift assignments
        const validation = validateAllDaysHaveShifts(startDate, endDate, employeeAssignments)
        if (!validation.valid) {
            availableWorkShifts.value = []
            errors.value.workShiftID = `Không có ca làm việc được phân cho ngày ${validation.missingDate.toLocaleDateString('vi-VN')}. Vui lòng phân ca cho tất cả các ngày trong khoảng thời gian.`
            if (formData.value.workShiftID) {
                formData.value.workShiftID = ''
            }
            return
        }
        
        // Get unique work shift IDs from assignments
        const assignedShiftIds = new Set(
            employeeAssignments.map(assignment => assignment.workShiftID)
        )
        
        // Filter workshifts to only include assigned ones
        availableWorkShifts.value = workshifts.value.filter(shift => 
            assignedShiftIds.has(shift.id)
        )
        
        // If current workShiftID is not in available shifts, clear it
        if (formData.value.workShiftID && !assignedShiftIds.has(parseInt(formData.value.workShiftID))) {
            formData.value.workShiftID = ''
            errors.value.workShiftID = 'Ca làm việc này không được phân trong khoảng thời gian đã chọn'
        }
    } catch (error) {
        console.error('Error fetching shift assignments:', error)
        availableWorkShifts.value = []
        errors.value.workShiftID = 'Lỗi khi tải danh sách ca làm việc'
    } finally {
        loadingShiftAssignments.value = false
    }
}

// Computed property for work shifts to display
const displayWorkShifts = computed(() => {
    // If we have employee, start date, and end date, show only available shifts
    if (formData.value.employeeID && formData.value.startDateTime && formData.value.endDateTime) {
        return availableWorkShifts.value
    }
    // Otherwise, show all work shifts
    return workshifts.value
})

// Selected year for calculations (current year)
const selectedYear = ref(new Date().getFullYear())

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

// Regex patterns cho validation
const regexPatterns = {
  // Số phiếu: chỉ cho phép chữ cái, số, dấu gạch ngang và gạch dưới, độ dài 1-50
  voucherCode: /^[A-Za-z0-9_-]{1,50}$/,
  // DateTime-local: định dạng YYYY-MM-DDTHH:mm
  dateTimeLocal: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
  // ID: chỉ số nguyên dương
  id: /^[1-9]\d*$/,
  // Lý do: cho phép chữ, số, khoảng trắng, dấu câu, độ dài tối đa 500
  reason: /^[\s\S]{1,500}$/
}

// Function to calculate seniority leave (1 day for every 5 years)
const calculateSeniorityLeave = (joinDate) => {
    if (!joinDate) return 0
    const join = new Date(joinDate)
    const current = new Date()
    const yearsWorked = current.getFullYear() - join.getFullYear()
    return Math.floor(yearsWorked / 5)
}

// Function to calculate total used leave days for an employee
// excludeLeaveId: ID của đơn nghỉ phép cần loại trừ (khi update)
// excludeVoucherCode: Mã phiếu của đơn nghỉ phép cần loại trừ (khi update)
// Tính theo đơn có thời gian nghỉ dài hơn trong ngày
const calculateTotalUsedLeave = (employeeId, excludeLeaveId = null, excludeVoucherCode = null) => {
    if (!leaveRequests.value || leaveRequests.value.length === 0) {
        return 0
    }
    
    const employeeLeaveRequests = leaveRequests.value.filter(request => 
        request.employeeID === employeeId && 
        isApprovedStatus(request.approveStatus) &&
        // Loại trừ đơn hiện tại khi ở mode update
        (!excludeLeaveId || request.id !== excludeLeaveId) &&
        (!excludeVoucherCode || request.voucherCode !== excludeVoucherCode)
    )
    
    // Group requests by day and find the longest leave period for each day
    const dayLeaveMap = new Map() // Map<dayString, {request, duration}>
    
    employeeLeaveRequests.forEach(request => {
        const fromDate = new Date(request.startDateTime)
        const toDate = new Date(request.endDateTime)
        const requestYear = fromDate.getFullYear()
        
        if (requestYear !== selectedYear.value) {
            return
        }
        
        // Calculate duration in milliseconds
        const duration = toDate - fromDate
        
        // Iterate through each day in the request period
        const currentDate = new Date(fromDate)
        while (currentDate <= toDate) {
            const dayString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
            
            // Calculate the portion of this request that falls on this day
            const dayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
            const dayEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59, 999)
            
            const requestStartOnDay = fromDate > dayStart ? fromDate : dayStart
            const requestEndOnDay = toDate < dayEnd ? toDate : dayEnd
            const dayDuration = requestEndOnDay - requestStartOnDay
            
            // Store the longest leave period for this day
            if (!dayLeaveMap.has(dayString) || dayLeaveMap.get(dayString).duration < dayDuration) {
                dayLeaveMap.set(dayString, { request, duration: dayDuration })
            }
            
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1)
            currentDate.setHours(0, 0, 0, 0)
        }
    })
    
    // Count unique days (each day is counted once based on longest leave period)
    return dayLeaveMap.size
}

// Function to calculate total overtime leave days for an employee
// excludeOvertimeRequestId: ID của đơn tăng ca nghỉ bù cần loại trừ (khi update)
const calculateTotalOTLeaveDays = (employeeId, excludeOvertimeRequestId = null) => {
    if (!overtimeRequests.value || overtimeRequests.value.length === 0) {
        return 0
    }
    
    const employeeOTRequests = overtimeRequests.value.filter(request => 
        request.employeeID === employeeId && 
        isApprovedStatus(request.approveStatus) &&
        request.overtimeFormID === 2 && // Only "Tăng ca nghỉ bù" (overtime leave compensation)
        // Loại trừ đơn hiện tại khi ở mode update
        (!excludeOvertimeRequestId || request.id !== excludeOvertimeRequestId)
    )
    
    const totalDays = employeeOTRequests.reduce((total, request) => {
        const fromDate = new Date(request.startDateTime)
        const toDate = new Date(request.endDateTime)
        const requestYear = fromDate.getFullYear()
        
        if (requestYear === selectedYear.value) {
            // Normalize dates to start of day (00:00:00) for accurate day calculation
            const startDay = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
            const endDay = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate())
            
            // Calculate difference in days
            const diffTime = endDay - startDay
            const diffDays = diffTime / (1000 * 60 * 60 * 24)
            
            // If same day, return 1 day. Otherwise, return diffDays + 1 (inclusive of both start and end days)
            const days = diffDays === 0 ? 1 : diffDays + 1
            return total + days
        }
        return total
    }, 0)
    
    return totalDays
}

// Computed property for employee leave information
const employeeLeaveInfo = computed(() => {
    if (!formData.value.employeeID) {
        return null
    }
    
    const employee = employees.value.find(emp => emp.id === formData.value.employeeID)
    if (!employee) {
        return null
    }
    
    const joinDate = new Date(employee.joinDate)
    const seniorityLeave = calculateSeniorityLeave(employee.joinDate)
    const totalLeave = 12 + seniorityLeave // 12 days default + seniority leave
    
    // Khi ở mode "update" hoặc "detail", loại trừ đơn hiện tại ra khỏi tính toán
    // (hoặc bất kỳ khi nào có props.leave - đang xem/sửa một đơn cụ thể)
    let excludeLeaveId = null
    let excludeVoucherCode = null
    if ((props.mode === 'update' || props.mode === 'detail') && props.leave) {
        excludeLeaveId = props.leave.id || null
        excludeVoucherCode = props.leave.voucherCode || null
    }
    
    const totalUsed = calculateTotalUsedLeave(employee.id, excludeLeaveId, excludeVoucherCode)
    const leaveRemain = Math.max(0, totalLeave - totalUsed)
    
    // Tính phép bù tăng ca (không cần loại trừ vì đây là đơn nghỉ phép, không phải đơn tăng ca)
    const otLeaveDays = calculateTotalOTLeaveDays(employee.id)
    const otLeaveUsed = calculateTotalOTLeaveDays(employee.id) // Same as otLeaveDays for now
    const otLeaveRemain = Math.max(0, otLeaveDays - otLeaveUsed)
    
    return {
        employee,
        totalLeave,
        seniorityLeave,
        totalUsed,
        leaveRemain,
        otLeaveDays,
        otLeaveUsed,
        otLeaveRemain
    }
})

// Computed property for requested days
const requestedDays = computed(() => {
    if (formData.value.startDateTime && formData.value.endDateTime) {
        const startDate = new Date(formData.value.startDateTime)
        const endDate = new Date(formData.value.endDateTime)
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return 0
        }
        
        // Normalize dates to start of day (00:00:00) for accurate day calculation
        const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
        const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
        
        // Calculate difference in days
        const diffTime = endDay - startDay
        const diffDays = diffTime / (1000 * 60 * 60 * 24)
        
        // If same day, return 1 day. Otherwise, return diffDays + 1 (inclusive of both start and end days)
        return diffDays === 0 ? 1 : diffDays + 1
    }
    return 0
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
            errors.value.employeeID = 'Bạn chỉ có thể tạo đơn nghỉ phép cho chính mình'
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

const validateLeaveTypeID = () => {
    const value = formData.value.leaveTypeID
    if (!value) {
        errors.value.leaveTypeID = 'Loại nghỉ phép là bắt buộc'
        return false
    }
    if (!regexPatterns.id.test(String(value))) {
        errors.value.leaveTypeID = 'Loại nghỉ phép không hợp lệ'
        return false
    }
    
    // Validate leave days availability
    if (formData.value.employeeID && formData.value.startDateTime && formData.value.endDateTime) {
        const startDate = new Date(formData.value.startDateTime)
        const endDate = new Date(formData.value.endDateTime)
        
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate < endDate) {
            // Use the same calculation logic as requestedDays computed property
            const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
            const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
            const diffTime = endDay - startDay
            const diffDays = diffTime / (1000 * 60 * 60 * 24)
            const requestedDays = diffDays === 0 ? 1 : diffDays + 1
            const leaveInfo = employeeLeaveInfo.value
            
            if (leaveInfo) {
                const selectedLeaveType = leaveTypes.value.find(type => type.id == formData.value.leaveTypeID)
                
                if (selectedLeaveType) {
                    if (selectedLeaveType.leaveTypeName === 'Phép năm' && leaveInfo.leaveRemain < requestedDays) {
                        errors.value.leaveTypeID = `Không đủ phép năm. Còn lại: ${leaveInfo.leaveRemain} ngày, yêu cầu: ${requestedDays} ngày`
                        return false
                    } else if (selectedLeaveType.leaveTypeName === 'Nghỉ bù' && leaveInfo.otLeaveRemain < requestedDays) {
                        errors.value.leaveTypeID = `Không đủ phép bù tăng ca. Còn lại: ${leaveInfo.otLeaveRemain} ngày, yêu cầu: ${requestedDays} ngày`
                        return false
                    }
                }
            }
        }
    }
    
    errors.value.leaveTypeID = ''
    return true
}

const validateWorkShiftID = () => {
    const value = formData.value.workShiftID
    if (!value) {
        errors.value.workShiftID = 'Ca làm việc là bắt buộc'
        return false
    }
    if (!regexPatterns.id.test(String(value))) {
        errors.value.workShiftID = 'Ca làm việc không hợp lệ'
        return false
    }
    
    // Check if work shift is in available work shifts (if employee and dates are selected)
    if (formData.value.employeeID && formData.value.startDateTime && formData.value.endDateTime) {
        const isAvailable = availableWorkShifts.value.some(shift => shift.id === parseInt(value))
        if (!isAvailable) {
            errors.value.workShiftID = 'Ca làm việc này không được phân cho nhân viên trong khoảng thời gian đã chọn'
            return false
        }
    }
    
    errors.value.workShiftID = ''
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
    
    // Validate time range against work shift
    if (formData.value.workShiftID) {
        const selectedWorkShift = workshifts.value.find(shift => shift.id == formData.value.workShiftID)
        if (selectedWorkShift && selectedWorkShift.shiftDetails) {
            const startDayOfWeek = startDate.getDay()
            const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
            const startDayName = dayNames[startDayOfWeek]
            const startDayShiftDetail = selectedWorkShift.shiftDetails.find(detail => detail.dayOfWeek === startDayName)
            
            if (startDayShiftDetail && startDayShiftDetail.startTime !== '00:00:00' && startDayShiftDetail.endTime !== '00:00:00') {
                const startTime = startDate.toTimeString().substring(0, 8)
                if (startTime < startDayShiftDetail.startTime || startTime > startDayShiftDetail.endTime) {
                    errors.value.startDateTime = `Giờ bắt đầu phải trong khoảng ${startDayShiftDetail.startTime.substring(0, 5)} - ${startDayShiftDetail.endTime.substring(0, 5)} của ca làm việc`
                    return false
                }
            }
        }
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
    }
    
    // Validate time range against work shift
    if (formData.value.workShiftID) {
        const selectedWorkShift = workshifts.value.find(shift => shift.id == formData.value.workShiftID)
        if (selectedWorkShift && selectedWorkShift.shiftDetails) {
            const endDayOfWeek = endDate.getDay()
            const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
            const endDayName = dayNames[endDayOfWeek]
            const endDayShiftDetail = selectedWorkShift.shiftDetails.find(detail => detail.dayOfWeek === endDayName)
            
            if (endDayShiftDetail && endDayShiftDetail.startTime !== '00:00:00' && endDayShiftDetail.endTime !== '00:00:00') {
                const endTime = endDate.toTimeString().substring(0, 8)
                if (endTime < endDayShiftDetail.startTime || endTime > endDayShiftDetail.endTime) {
                    errors.value.endDateTime = `Giờ kết thúc phải trong khoảng ${endDayShiftDetail.startTime.substring(0, 5)} - ${endDayShiftDetail.endTime.substring(0, 5)} của ca làm việc`
                    return false
                }
            }
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

// Real-time validation cho các trường input
const validateField = (fieldName) => {
    switch (fieldName) {
        case 'voucherCode':
            validateVoucherCode()
            break
        case 'employeeID':
            validateEmployeeID()
            // Validate leave type again when employee changes
            if (formData.value.leaveTypeID) {
                validateLeaveTypeID()
            }
            // Fetch available work shifts when employee changes
            if (formData.value.startDateTime && formData.value.endDateTime) {
                fetchAvailableWorkShifts()
            }
            break
        case 'leaveTypeID':
            validateLeaveTypeID()
            break
        case 'workShiftID':
            validateWorkShiftID()
            // Re-validate datetime when work shift changes
            if (formData.value.startDateTime) {
                validateStartDateTime()
            }
            if (formData.value.endDateTime) {
                validateEndDateTime()
            }
            break
        case 'startDateTime':
            validateStartDateTime()
            // Re-validate end date when start date changes
            if (formData.value.endDateTime) {
                validateEndDateTime()
            }
            // Re-validate leave type when dates change
            if (formData.value.leaveTypeID) {
                validateLeaveTypeID()
            }
            // Fetch available work shifts when dates change
            if (formData.value.employeeID && formData.value.endDateTime) {
                fetchAvailableWorkShifts()
            }
            break
        case 'endDateTime':
            validateEndDateTime()
            // Re-validate start date when end date changes
            if (formData.value.startDateTime) {
                validateStartDateTime()
            }
            // Re-validate leave type when dates change
            if (formData.value.leaveTypeID) {
                validateLeaveTypeID()
            }
            // Fetch available work shifts when dates change
            if (formData.value.employeeID && formData.value.startDateTime) {
                fetchAvailableWorkShifts()
            }
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
        validateLeaveTypeID(),
        validateWorkShiftID(),
        validateStartDateTime(),
        validateEndDateTime(),
        validateReason()
    ]
    
    return validations.every(v => v === true)
}

/**
 * Kiểm tra overlap với các đơn tăng ca đã duyệt
 * @param {String} startDateTime - Thời gian bắt đầu đơn nghỉ phép
 * @param {String} endDateTime - Thời gian kết thúc đơn nghỉ phép
 * @param {String} employeeID - ID nhân viên
 * @returns {Array} Danh sách đơn tăng ca trùng
 */
const checkOverlappingOvertimeRequests = (startDateTime, endDateTime, employeeID) => {
    if (!overtimeRequests.value || overtimeRequests.value.length === 0) {
        return []
    }
    
    const leaveStart = new Date(startDateTime)
    const leaveEnd = new Date(endDateTime)
    
    if (isNaN(leaveStart.getTime()) || isNaN(leaveEnd.getTime())) {
        return []
    }
    
    // Filter approved overtime requests for the same employee
    const approvedRequests = overtimeRequests.value.filter(request => 
        (request.employeeID === employeeID || String(request.employeeID) === String(employeeID)) && 
        isApprovedStatus(request.approveStatus)
    )
    
    const overlapping = []
    
    approvedRequests.forEach(request => {
        const overtimeStart = new Date(request.startDateTime)
        const overtimeEnd = new Date(request.endDateTime)
        
        // Check if there's an overlap
        // Overlap exists if: (leaveStart < overtimeEnd) && (leaveEnd > overtimeStart)
        if (leaveStart < overtimeEnd && leaveEnd > overtimeStart) {
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
 * Kiểm tra overlap với ca làm việc có dữ liệu chấm công
 * @param {String} startDateTime - Thời gian bắt đầu đơn nghỉ phép
 * @param {String} endDateTime - Thời gian kết thúc đơn nghỉ phép
 * @param {String} employeeID - ID nhân viên
 * @returns {Promise<Array>} Danh sách ca làm việc trùng
 */
const checkOverlappingShiftTimes = async (startDateTime, endDateTime, employeeID) => {
    if (!employeeID || !startDateTime || !endDateTime) {
        return []
    }
    
    const leaveStart = new Date(startDateTime)
    const leaveEnd = new Date(endDateTime)
    
    if (isNaN(leaveStart.getTime()) || isNaN(leaveEnd.getTime())) {
        return []
    }
    
    // Lấy các phân ca làm việc trong khoảng thời gian của đơn nghỉ phép
    const startDateOnly = new Date(leaveStart)
    startDateOnly.setHours(0, 0, 0, 0)
    const endDateOnly = new Date(leaveEnd)
    endDateOnly.setHours(23, 59, 59, 999)
    
    const shiftAssignmentsInRange = await getShiftAssignmentsByDateRange(
        startDateOnly.toISOString(),
        endDateOnly.toISOString()
    )
    
    // Lọc chỉ các phân ca của nhân viên hiện tại
    const employeeShiftAssignments = shiftAssignmentsInRange.filter(assignment => 
        (assignment.employeeID === employeeID || String(assignment.employeeID) === String(employeeID))
    )
    
    // Lấy thông tin nhân viên để lấy employeeCode
    const selectedEmployee = employees.value.find(emp => 
        emp.id === employeeID || 
        String(emp.id) === String(employeeID) ||
        emp.employeeCode === employeeID ||
        String(emp.employeeCode) === String(employeeID)
    )
    
    // EmployeeCode là field chính để identify employee trong attendance data
    const employeeCode = selectedEmployee?.id || selectedEmployee?.employeeCode || String(employeeID)
    
    // Lấy dữ liệu chấm công trong khoảng thời gian
    let attendanceInRange = []
    try {
        attendanceInRange = await attendanceDataService.getAttendanceDataByDateRange(
            startDateOnly.toISOString().split('T')[0],
            endDateOnly.toISOString().split('T')[0]
        )
    } catch (error) {
        console.error("Error fetching attendance data for overlap check:", error)
        // Continue even if attendance data fetch fails
    }
    
    // Lọc chỉ dữ liệu chấm công của nhân viên hiện tại
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
    
    const overlapping = []
    
    // Helper function to parse time string (HH:mm:ss or HH:mm)
    const parseTimeString = (timeStr) => {
        if (!timeStr) return { hours: 0, minutes: 0 }
        const parts = String(timeStr).split(':').map(Number)
        return { hours: parts[0] || 0, minutes: parts[1] || 0 }
    }
    
    // KIỂM TRA TẤT CẢ DỮ LIỆU CHẤM CÔNG TRONG KHOẢNG THỜI GIAN NGHỈ PHÉP
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
            const timeParts = parseTimeString(checkInTime)
            attStartTime = new Date(attDate)
            attStartTime.setHours(timeParts.hours, timeParts.minutes, 0, 0)
        }
        
        if (checkOutTime) {
            const timeParts = parseTimeString(checkOutTime)
            attEndTime = new Date(attDate)
            attEndTime.setHours(timeParts.hours, timeParts.minutes, 0, 0)
        } else if (checkInTime) {
            // Nếu chỉ có check-in, giả sử ca làm việc kết thúc sau 8 giờ
            const timeParts = parseTimeString(checkInTime)
            attEndTime = new Date(attDate)
            attEndTime.setHours((timeParts.hours || 0) + 8, timeParts.minutes || 0, 0, 0)
        }
        
        // Kiểm tra overlap với đơn nghỉ phép
        // Overlap exists if: (leaveStart < attEndTime) && (leaveEnd > attStartTime)
        if (attStartTime && attEndTime) {
            const hasTimeOverlap = leaveStart < attEndTime && leaveEnd > attStartTime
            
            if (hasTimeOverlap) {
                const shiftName = att.shiftName || att.ShiftName || 'N/A'
                overlapping.push({
                    workDate: attDate.toLocaleDateString('vi-VN'),
                    shiftName: shiftName,
                    startTime: attStartTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                    endTime: attEndTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                    hasAttendance: true,
                    shiftAssignmentID: att.workShiftID || att.WorkShiftID || null
                })
            }
        }
    }
    
    return overlapping
}

// Function to check for overlapping leave requests
const checkOverlappingLeaveRequests = (startDateTime, endDateTime, employeeID) => {
    if (!leaveRequests.value || leaveRequests.value.length === 0) {
        return []
    }
    
    const startDate = new Date(startDateTime)
    const endDate = new Date(endDateTime)
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return []
    }
    
    // Filter approved leave requests for the same employee
    const approvedRequests = leaveRequests.value.filter(request => 
        request.employeeID === employeeID && 
        isApprovedStatus(request.approveStatus) &&
        // Exclude current request when updating
        (props.mode !== 'update' || request.voucherCode !== formData.value.voucherCode)
    )
    
    const overlapping = []
    
    approvedRequests.forEach(request => {
        const requestStart = new Date(request.startDateTime)
        const requestEnd = new Date(request.endDateTime)
        
        // Check if there's an overlap
        // Overlap exists if: (startDate <= requestEnd) && (endDate >= requestStart)
        if (startDate <= requestEnd && endDate >= requestStart) {
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
    
    // Convert datetime-local to proper format for API
    // Use formatDateTimeToISO to preserve local time without UTC conversion
    const submitData = {
        ...formData.value,
        voucherCode: formData.value.voucherCode.trim(),
        reason: formData.value.reason.trim(),
        startDateTime: formatDateTimeToISO(formData.value.startDateTime),
        endDateTime: formatDateTimeToISO(formData.value.endDateTime)
    }
    
    try {
        // Check for overlapping overtime requests first (blocks creation)
        const overtimeOverlaps = checkOverlappingOvertimeRequests(
            formData.value.startDateTime,
            formData.value.endDateTime,
            formData.value.employeeID
        )
        
        // Check for overlapping shift times with attendance data (blocks creation)
        const shiftOverlaps = await checkOverlappingShiftTimes(
            formData.value.startDateTime,
            formData.value.endDateTime,
            formData.value.employeeID
        )
        
        // Check for overlapping leave requests (allows confirmation)
        const leaveOverlaps = checkOverlappingLeaveRequests(
            formData.value.startDateTime,
            formData.value.endDateTime,
            formData.value.employeeID
        )
        
        // If there are overtime or shift overlaps, block creation
        if (overtimeOverlaps.length > 0 || shiftOverlaps.length > 0) {
            // Store all overlaps for display
            overlappingOvertimeRequests.value = overtimeOverlaps
            overlappingShiftTimes.value = shiftOverlaps
            overlappingRequests.value = leaveOverlaps
            
            // Determine modal type
            const hasOvertime = overtimeOverlaps.length > 0
            const hasShift = shiftOverlaps.length > 0
            const hasLeave = leaveOverlaps.length > 0
            
            if (hasOvertime && hasShift && hasLeave) {
                overlapModalType.value = 'all'
            } else if (hasOvertime && hasShift) {
                overlapModalType.value = 'overtime-shift'
            } else if (hasOvertime && hasLeave) {
                overlapModalType.value = 'overtime-leave'
            } else if (hasShift && hasLeave) {
                overlapModalType.value = 'shift-leave'
            } else if (hasOvertime) {
                overlapModalType.value = 'overtime'
            } else if (hasShift) {
                overlapModalType.value = 'shift'
            }
            
            // Show modal (no confirm button - blocks creation)
            showOverlapConfirmModal.value = true
            return
        }
        
        // If only leave overlaps, show confirmation modal (allows creation after confirmation)
        if (leaveOverlaps.length > 0) {
            pendingSubmitData.value = submitData
            overlappingRequests.value = leaveOverlaps
            overlappingOvertimeRequests.value = []
            overlappingShiftTimes.value = []
            overlapModalType.value = 'leave'
            showOverlapConfirmModal.value = true
            return
        }
        
        // No overlaps, submit directly
        emit('submit', submitData)
    } catch (error) {
        console.error('Error checking overlaps:', error)
        // If error occurs, still allow submission (fallback)
        emit('submit', submitData)
    }
}

const handleOverlapConfirm = () => {
    if (pendingSubmitData.value) {
        emit('submit', pendingSubmitData.value)
        showOverlapConfirmModal.value = false
        pendingSubmitData.value = null
        overlappingRequests.value = []
        overlappingOvertimeRequests.value = []
        overlappingShiftTimes.value = []
        overlapModalType.value = ''
    }
}

const handleOverlapCancel = () => {
    showOverlapConfirmModal.value = false
    pendingSubmitData.value = null
    overlappingRequests.value = []
    overlappingOvertimeRequests.value = []
    overlappingShiftTimes.value = []
    overlapModalType.value = ''
}

const handleClose = () => emit('close')

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
    
    try {
        // Check for overlapping overtime requests first (blocks creation)
        const overtimeOverlaps = checkOverlappingOvertimeRequests(
            formData.value.startDateTime,
            formData.value.endDateTime,
            formData.value.employeeID
        )
        
        // Check for overlapping shift times with attendance data (blocks creation)
        const shiftOverlaps = await checkOverlappingShiftTimes(
            formData.value.startDateTime,
            formData.value.endDateTime,
            formData.value.employeeID
        )
        
        // Check for overlapping leave requests
        const leaveOverlaps = checkOverlappingLeaveRequests(
            formData.value.startDateTime,
            formData.value.endDateTime,
            formData.value.employeeID
        )
        
        // If there are overtime or shift overlaps, block submission
        if (overtimeOverlaps.length > 0 || shiftOverlaps.length > 0) {
            // Store all overlaps for display
            overlappingOvertimeRequests.value = overtimeOverlaps
            overlappingShiftTimes.value = shiftOverlaps
            overlappingRequests.value = leaveOverlaps
            
            // Determine modal type
            const hasOvertime = overtimeOverlaps.length > 0
            const hasShift = shiftOverlaps.length > 0
            const hasLeave = leaveOverlaps.length > 0
            
            if (hasOvertime && hasShift && hasLeave) {
                overlapModalType.value = 'all'
            } else if (hasOvertime && hasShift) {
                overlapModalType.value = 'overtime-shift'
            } else if (hasOvertime && hasLeave) {
                overlapModalType.value = 'overtime-leave'
            } else if (hasShift && hasLeave) {
                overlapModalType.value = 'shift-leave'
            } else if (hasOvertime) {
                overlapModalType.value = 'overtime'
            } else if (hasShift) {
                overlapModalType.value = 'shift'
            }
            
            // Show modal (no confirm button - blocks submission)
            showOverlapConfirmModal.value = true
            return
        }
        
        // If only leave overlaps, also block for submit-for-approval (to be consistent)
        if (leaveOverlaps.length > 0) {
            overlappingRequests.value = leaveOverlaps
            overlappingOvertimeRequests.value = []
            overlappingShiftTimes.value = []
            overlapModalType.value = 'leave'
            showOverlapConfirmModal.value = true
            return
        }
        
        // Convert datetime-local to proper format for API
        // Use formatDateTimeToISO to preserve local time without UTC conversion
        const submitData = {
            ...formData.value,
            voucherCode: formData.value.voucherCode.trim(),
            reason: formData.value.reason.trim(),
            startDateTime: formatDateTimeToISO(formData.value.startDateTime),
            endDateTime: formatDateTimeToISO(formData.value.endDateTime)
        }
        emit('submit-for-approval', submitData.voucherCode)
    } catch (error) {
        console.error('Error checking overlaps:', error)
        // If error occurs, still allow submission (fallback)
        const submitData = {
            ...formData.value,
            voucherCode: formData.value.voucherCode.trim(),
            reason: formData.value.reason.trim(),
            startDateTime: formatDateTimeToISO(formData.value.startDateTime),
            endDateTime: formatDateTimeToISO(formData.value.endDateTime)
        }
        emit('submit-for-approval', submitData.voucherCode)
    }
}

// Computed properties for DataTable data
const overtimeRequestsTableData = computed(() => {
    return overlappingOvertimeRequests.value.map((request, index) => ({
        id: request.voucherCode || index,
        voucherCode: request.voucherCode,
        overtimeFormName: request.overtimeFormName || 'N/A',
        startDateTime: new Date(request.startDateTime).toLocaleString('vi-VN'),
        endDateTime: new Date(request.endDateTime).toLocaleString('vi-VN')
    }))
})

const shiftTimesTableData = computed(() => {
    return overlappingShiftTimes.value.map((shift, index) => ({
        id: shift.shiftAssignmentID || index,
        workDate: shift.workDate,
        shiftName: shift.shiftName,
        startTime: shift.startTime,
        endTime: shift.endTime,
        hasAttendance: shift.hasAttendance ? 'Có' : 'Không',
        status: shift.hasAttendance ? 'Có dữ liệu chấm công' : 'N/A'
    }))
})

const leaveRequestsTableData = computed(() => {
    return overlappingRequests.value.map((request, index) => ({
        id: request.voucherCode || index,
        voucherCode: request.voucherCode,
        leaveTypeName: request.leaveTypeName || 'N/A',
        startDateTime: new Date(request.startDateTime).toLocaleString('vi-VN'),
        endDateTime: new Date(request.endDateTime).toLocaleString('vi-VN')
    }))
})

// Columns for DataTable
const overtimeRequestsColumns = computed(() => [
    { key: 'voucherCode', label: 'Số phiếu' },
    { key: 'overtimeFormName', label: 'Hình thức tăng ca' },
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

const leaveRequestsColumns = computed(() => [
    { key: 'voucherCode', label: 'Số phiếu' },
    { key: 'leaveTypeName', label: 'Loại nghỉ phép' },
    { key: 'startDateTime', label: 'Từ ngày' },
    { key: 'endDateTime', label: 'Đến ngày' }
])

// Load data on mount
onMounted(async () => {
    try {
        await Promise.all([
            fetchAllEmployees(), // Lấy tất cả employees
            fetchWorkShifts(),
            fetchLeaveTypes(),
            fetchLeaveRequests(), // Load leave requests for calculations
            fetchOvertimeRequests(), // Load overtime requests for calculations
            fetchOvertimeForms() // Load overtime forms for overlap display
        ])
        
        // Auto-set employeeID cho technician/worker khi tạo mới
        if (props.mode === 'create' && isRestrictedUser.value && currentUser.value?.id) {
            formData.value.employeeID = currentUser.value.id
        }
        
        console.log('Loaded data:', {
            employees: employees.value,
            workShifts: workshifts.value,
            leaveTypes: leaveTypes.value,
            currentUser: currentUser.value,
            availableEmployeesCount: availableEmployees.value.length
        })
        
        console.log('Form data after load:', formData.value)
        
        // Debug individual arrays
        console.log('Employees length:', employees.value?.length)
        console.log('WorkShifts length:', workshifts.value?.length)
        console.log('LeaveTypes length:', leaveTypes.value?.length)
        
        // Fallback data for testing
        if (!leaveTypes.value || leaveTypes.value.length === 0) {
            console.log('No leave types loaded, using fallback data')
            leaveTypes.value = [
                { id: 1, leaveTypeName: 'Phép năm' },
                { id: 2, leaveTypeName: 'Nghỉ bù' }
            ]
        }
        
        if (!workshifts.value || workshifts.value.length === 0) {
            console.log('No work shifts loaded, using fallback data')
            workshifts.value = [
                { id: 1, shiftName: 'Ca Hành Chính' }
            ]
        }
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

// Watch for changes in leave prop
watch(() => props.leave, (newLeave) => {
    if (newLeave && Object.keys(newLeave).length > 0) {
        // Nếu là mode update và user bị giới hạn, đảm bảo employeeID không thay đổi
        let employeeID = newLeave.employeeID || ''
        if (props.mode === 'update' && isRestrictedUser.value && currentUser.value?.id) {
            employeeID = currentUser.value.id
        }
        
        formData.value = {
            voucherCode: newLeave.voucherCode || '',
            employeeID: employeeID,
            leaveTypeID: newLeave.leaveTypeID || '',
            workShiftID: newLeave.workShiftID || '',
            startDateTime: formatDateTimeLocal(newLeave.startDateTime),
            endDateTime: formatDateTimeLocal(newLeave.endDateTime),
            reason: newLeave.reason || ''
        }
        
        // Fetch available work shifts if we have all required fields
        if (formData.value.employeeID && formData.value.startDateTime && formData.value.endDateTime) {
            fetchAvailableWorkShifts()
        }
    }
}, { immediate: true })

// Watch currentUser để auto-set employeeID khi user thay đổi (nếu là restricted user)
watch(() => currentUser.value?.id, (newUserId) => {
    if (newUserId && isRestrictedUser.value && props.mode === 'create' && !formData.value.employeeID) {
        formData.value.employeeID = newUserId
    }
}, { immediate: true })

// Debounce timer for fetching work shifts
let fetchWorkShiftsTimer = null

// Watch for changes in employeeID, startDateTime, endDateTime to fetch available work shifts
watch([() => formData.value.employeeID, () => formData.value.startDateTime, () => formData.value.endDateTime], 
    ([employeeID, startDateTime, endDateTime]) => {
        // Clear previous timer
        if (fetchWorkShiftsTimer) {
            clearTimeout(fetchWorkShiftsTimer)
        }
        
        if (employeeID && startDateTime && endDateTime) {
            // Debounce to avoid too many API calls
            fetchWorkShiftsTimer = setTimeout(() => {
                fetchAvailableWorkShifts()
            }, 300)
        } else {
            // Reset available work shifts if any required field is missing
            availableWorkShifts.value = []
            shiftAssignmentsInRange.value = []
            // Clear workShiftID if it's set but conditions are not met
            if (!employeeID || !startDateTime || !endDateTime) {
                formData.value.workShiftID = ''
            }
        }
    }
)
</script>
<template>
    <form @submit.prevent="handleSubmit">
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
                    placeholder="VD: NP-2024-001"
                />
                <div class="invalid-feedback">{{ errors.voucherCode }}</div>
            </div>
            <div class="col-md-6">
                <label class="form-label">Nhân viên tạo đơn <span class="text-danger">*</span></label>
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
        
        <!-- Employee Leave Information -->
        <div v-if="employeeLeaveInfo" class="row g-3 mb-3">
            <div class="col-12">
                <div class="card border-light">
                    <div class="card-header bg-light">
                        <h6 class="mb-0 text-muted">
                            <i class="fas fa-info-circle me-2"></i>
                            Thông tin phép của {{ employeeLeaveInfo.employee.firstName }} {{ employeeLeaveInfo.employee.lastName }}
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="text-muted mb-3">Phép năm {{ selectedYear }}</h6>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Tổng phép năm:</span>
                                    <span class="fw-bold">{{ employeeLeaveInfo.totalLeave }} ngày</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Phép thâm niên:</span>
                                    <span class="fw-bold">{{ employeeLeaveInfo.seniorityLeave }} ngày</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Đã sử dụng:</span>
                                    <span class="fw-bold">{{ employeeLeaveInfo.totalUsed }} ngày</span>
                                </div>
                                <hr class="my-3">
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Còn lại:</span>
                                    <span class="fw-bold" :class="employeeLeaveInfo.leaveRemain > 0 ? 'text-success' : 'text-danger'">
                                        {{ employeeLeaveInfo.leaveRemain }} ngày
                                    </span>
                                </div>
                                <div v-if="requestedDays > 0" class="d-flex justify-content-between">
                                    <span class="text-muted">Yêu cầu:</span>
                                    <span class="fw-bold">{{ requestedDays }} ngày</span>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-muted mb-3">Phép bù tăng ca {{ selectedYear }}</h6>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Tổng phép bù:</span>
                                    <span class="fw-bold">{{ employeeLeaveInfo.otLeaveDays }} ngày</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Đã sử dụng:</span>
                                    <span class="fw-bold">{{ employeeLeaveInfo.otLeaveUsed }} ngày</span>
                                </div>
                                <hr class="my-3">
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Còn lại:</span>
                                    <span class="fw-bold" :class="employeeLeaveInfo.otLeaveRemain > 0 ? 'text-success' : 'text-danger'">
                                        {{ employeeLeaveInfo.otLeaveRemain }} ngày
                                    </span>
                                </div>
                                <div v-if="requestedDays > 0" class="d-flex justify-content-between">
                                    <span class="text-muted">Yêu cầu:</span>
                                    <span class="fw-bold">{{ requestedDays }} ngày</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row g-3">
            <div class="col-md-6">
                <label class="form-label">Từ ngày <span class="text-danger">*</span></label>
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
                <label class="form-label">Đến ngày <span class="text-danger">*</span></label>
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
            <div class="col-md-6">
                <label class="form-label">Loại nghỉ phép <span class="text-danger">*</span></label>
                <select 
                    class="form-select" 
                    v-model="formData.leaveTypeID" 
                    :class="{ 'is-invalid': errors.leaveTypeID }"
                    @change="validateField('leaveTypeID')"
                    :disabled="props.mode === 'detail'"
                >
                    <option value="">Chọn loại nghỉ phép</option>
                    <option v-for="type in leaveTypes" :key="type.id" :value="type.id">
                        {{ type.leaveTypeName }}
                    </option>
                </select>
                <div class="invalid-feedback">{{ errors.leaveTypeID }}</div>
            </div>
            <div class="col-md-6">
                <label class="form-label">Ca làm việc <span class="text-danger">*</span></label>
                <select 
                    class="form-select" 
                    v-model="formData.workShiftID" 
                    :class="{ 'is-invalid': errors.workShiftID }"
                    @change="validateField('workShiftID')"
                    :disabled="props.mode === 'detail' || !formData.employeeID || !formData.startDateTime || !formData.endDateTime || loadingShiftAssignments"
                >
                    <option value="">
                        {{ loadingShiftAssignments ? 'Đang tải...' : (!formData.employeeID || !formData.startDateTime || !formData.endDateTime ? 'Vui lòng chọn nhân viên, từ ngày và đến ngày trước' : 'Chọn ca làm việc') }}
                    </option>
                    <option v-for="shift in displayWorkShifts" :key="shift.id" :value="shift.id">
                        {{ shift.shiftName }}
                    </option>
                </select>
                <div class="invalid-feedback">{{ errors.workShiftID }}</div>
                <small v-if="formData.employeeID && formData.startDateTime && formData.endDateTime && availableWorkShifts.length === 0 && !loadingShiftAssignments" class="form-text text-warning">
                    <i class="fas fa-exclamation-triangle me-1"></i>
                    Không có ca làm việc nào được phân cho nhân viên này trong khoảng thời gian đã chọn.
                </small>
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
                    placeholder="Nhập lý do nghỉ phép (tối đa 500 ký tự)..."
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
                v-if="props.mode === 'update' && (props.leave.approveStatus == 0 || props.leave.approveStatus === '0')" 
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
    
    <!-- Overlap Confirmation Modal -->
    <ModalDialog 
        v-model:show="showOverlapConfirmModal" 
        :title="overlapModalType === 'leave' ? 'Cảnh báo: Đơn nghỉ phép trùng lặp' : 'Cảnh báo: Không thể tạo đơn nghỉ phép'" 
        :size="overlapModalType === 'leave' ? 'md' : 'xl'"
        scrollable
    >
        <div class="p-3">
            <!-- Warning message based on overlap type -->
            <div v-if="overlapModalType === 'leave'" class="alert alert-warning mb-3">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Đơn nghỉ phép này trùng lặp với {{ overlappingRequests.length }} đơn nghỉ phép đã duyệt khác.
            </div>
            <div v-else class="alert alert-danger mb-3">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Đơn nghỉ phép này trùng với đơn tăng ca đã duyệt hoặc ca làm việc đã có dữ liệu chấm công. Không thể tạo đơn.</strong>
            </div>
            
            <!-- Overtime Requests Table -->
            <div v-if="(overlapModalType === 'overtime' || overlapModalType === 'overtime-leave' || overlapModalType === 'overtime-shift' || overlapModalType === 'all') && overlappingOvertimeRequests.length > 0" class="mb-4">
                <h6 class="mb-3">
                    <i class="fas fa-clock me-2"></i>
                    Danh sách đơn tăng ca trùng lặp ({{ overlappingOvertimeRequests.length }})
                </h6>
                <DataTable 
                    :columns="overtimeRequestsColumns" 
                    :data="overtimeRequestsTableData"
                />
            </div>
            
            <!-- Shift Times Table -->
            <div v-if="(overlapModalType === 'shift' || overlapModalType === 'shift-leave' || overlapModalType === 'overtime-shift' || overlapModalType === 'all') && overlappingShiftTimes.length > 0" class="mb-4">
                <h6 class="mb-3">
                    <i class="fas fa-clock me-2"></i>
                    Danh sách ca làm việc có dữ liệu chấm công ({{ overlappingShiftTimes.length }})
                </h6>
                <DataTable 
                    :columns="shiftTimesColumns" 
                    :data="shiftTimesTableData"
                />
            </div>
            
            <!-- Leave Requests Table -->
            <div v-if="(overlapModalType === 'leave' || overlapModalType === 'overtime-leave' || overlapModalType === 'shift-leave' || overlapModalType === 'all') && overlappingRequests.length > 0" class="mb-4">
                <h6 class="mb-3">
                    <i class="fas fa-calendar-times me-2"></i>
                    Danh sách đơn nghỉ phép trùng lặp ({{ overlappingRequests.length }})
                </h6>
                <DataTable 
                    :columns="leaveRequestsColumns" 
                    :data="leaveRequestsTableData"
                />
            </div>
            
            <!-- Info message -->
            <div v-if="overlapModalType === 'leave'" class="alert alert-info mt-3 mb-0">
                <small>
                    <i class="fas fa-info-circle me-1"></i>
                    Lưu ý: Hệ thống sẽ tính theo đơn có thời gian nghỉ dài hơn trong mỗi ngày.
                </small>
            </div>
            <div v-else class="alert alert-info mt-3 mb-0">
                <small>
                    <i class="fas fa-info-circle me-1"></i>
                    Vui lòng kiểm tra và điều chỉnh thời gian đơn nghỉ phép để tránh trùng lặp.
                </small>
            </div>
            
            <!-- Buttons -->
            <div class="d-flex justify-content-end gap-2 mt-3">
                <!-- If only leave overlaps, show cancel and confirm buttons -->
                <template v-if="overlapModalType === 'leave'">
                    <button type="button" class="btn btn-secondary" @click="handleOverlapCancel">
                        Hủy
                    </button>
                    <button type="button" class="btn btn-warning" @click="handleOverlapConfirm">
                        Xác nhận tạo đơn
                    </button>
                </template>
                <!-- If overtime or shift overlaps, only show close button (blocks creation) -->
                <template v-else>
                    <button type="button" class="btn btn-secondary" @click="handleOverlapCancel">
                        Đóng
                    </button>
                </template>
            </div>
        </div>
    </ModalDialog>
</template>
